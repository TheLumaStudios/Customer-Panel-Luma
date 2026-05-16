// SaaS Provisioning Kiti — Generic HTTP Provisioner
//
// provisioning_integrations tablosundaki tanıma göre herhangi bir
// dış API'ye sağlama isteği gönderir. Plesk, DirectAdmin, cPanel
// DNSONLY, lisans sunucuları vb. için kullanılır.
//
// Deploy: supabase functions deploy generic-provision

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ProvisionAction = 'provision' | 'suspend' | 'terminate' | 'status_check'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'employee'].includes(profile?.role)) {
      throw new Error('Admin/employee access required')
    }

    const {
      integration_id,
      action,      // 'provision' | 'suspend' | 'terminate' | 'status_check'
      customer_id,
      external_id, // suspend/terminate/status için harici kayıt ID'si
      params = {}, // Sağlama için ek alanlar (hostname, username, plan vb.)
    }: {
      integration_id: string
      action: ProvisionAction
      customer_id?: string
      external_id?: string
      params?: Record<string, unknown>
    } = await req.json()

    if (!integration_id || !action) throw new Error('integration_id and action required')

    // Entegrasyonu getir
    const { data: integration, error: intErr } = await supabaseAdmin
      .from('provisioning_integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('is_active', true)
      .single()

    if (intErr || !integration) throw new Error('Integration not found or inactive')

    // Kimlik bilgilerini çöz (pgcrypto encrypted veya düz)
    let credentials: Record<string, string> = {}
    if (integration.credentials_encrypted) {
      const encKey = Deno.env.get('ENCRYPTION_KEY') ?? ''
      if (encKey) {
        const { data: decrypted } = await supabaseAdmin
          .rpc('decrypt_text', { encrypted: integration.credentials_encrypted, key: encKey })
        if (decrypted) {
          try { credentials = JSON.parse(decrypted) } catch { /* ignore */ }
        }
      }
    }

    // Endpoint path'ini belirle
    const pathMap: Record<ProvisionAction, string | null> = {
      provision:    integration.provision_path,
      suspend:      integration.suspend_path,
      terminate:    integration.terminate_path,
      status_check: integration.status_path,
    }
    const actionPath = pathMap[action]
    if (!actionPath) throw new Error(`No path configured for action: ${action}`)

    // field_map uygula: params'taki alanları API parametrelerine çevir
    const fieldMap: Record<string, string> = integration.field_map ?? {}
    const mappedParams: Record<string, unknown> = {}

    for (const [localKey, apiKey] of Object.entries(fieldMap)) {
      if (params[localKey] !== undefined) {
        mappedParams[apiKey] = params[localKey]
      }
    }
    // field_map'de olmayan alanları olduğu gibi aktar
    for (const [k, v] of Object.entries(params)) {
      if (!(k in fieldMap)) mappedParams[k] = v
    }

    // Path içindeki {external_id} placeholder'ı değiştir
    const resolvedPath = actionPath.replace(/\{external_id\}/g, external_id ?? '')
    const targetUrl = `${integration.endpoint_url}${resolvedPath}`

    // Auth header'ı oluştur
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    if (integration.auth_type === 'bearer' && credentials.token) {
      requestHeaders['Authorization'] = `Bearer ${credentials.token}`
    } else if (integration.auth_type === 'basic' && credentials.username && credentials.password) {
      const encoded = btoa(`${credentials.username}:${credentials.password}`)
      requestHeaders['Authorization'] = `Basic ${encoded}`
    } else if (integration.auth_type === 'api_key' && credentials.api_key) {
      const headerName = integration.auth_header || 'X-API-Key'
      requestHeaders[headerName] = credentials.api_key
    }

    // HTTP metod: status_check ve terminate → GET/DELETE, diğerleri → POST
    const httpMethod = action === 'status_check' ? 'GET'
      : action === 'terminate' ? 'DELETE'
      : 'POST'

    console.log(`[generic-provision] ${action} → ${httpMethod} ${targetUrl}`)

    const externalRes = await fetch(targetUrl, {
      method: httpMethod,
      headers: requestHeaders,
      body: httpMethod !== 'GET' ? JSON.stringify(mappedParams) : undefined,
      signal: AbortSignal.timeout(30_000),
    })

    const responseStatus = externalRes.status
    let responseBody: unknown
    try {
      responseBody = await externalRes.json()
    } catch {
      responseBody = { raw: await externalRes.text() }
    }

    const success = externalRes.ok

    // Harici ID'yi al (provision başarısıysa)
    let newExternalId = external_id
    if (action === 'provision' && success && typeof responseBody === 'object' && responseBody !== null) {
      const rb = responseBody as Record<string, unknown>
      newExternalId = (rb.id ?? rb.license_id ?? rb.key ?? external_id) as string
    }

    // Log kaydı
    await supabaseAdmin.from('provisioning_logs').insert({
      integration_id,
      customer_id: customer_id || null,
      action,
      status: success ? 'success' : 'failed',
      request_body: mappedParams,
      response_status: responseStatus,
      response_body: responseBody,
      error_message: success ? null : `HTTP ${responseStatus}`,
      external_id: newExternalId,
    })

    console.log(`[generic-provision] ✅ ${action} status=${responseStatus} success=${success}`)

    return new Response(
      JSON.stringify({ success, external_id: newExternalId, response: responseBody }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[generic-provision] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
