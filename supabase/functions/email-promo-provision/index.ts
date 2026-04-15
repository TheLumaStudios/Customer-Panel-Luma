// Kurumsal E-Posta Kampanyası - Otomatik Provisioning
// cPanel'de Free-Demo-Campaign paketi ile hesap açar
// Ödeme alınmazsa cron-auto-suspend otomatik pasife alır
//
// Fiyatlandırma (1 yıl taahhütlü, ön ödemeli):
//   1. ay: 0₺ (bedava)
//   2-3. ay: 9,90₺/ay
//   4-12. ay: 49,90₺/ay
//
// Deploy: supabase functions deploy email-promo-provision

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CPANEL_PACKAGE = 'Free-Demo-Campaign'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ success: false, error: 'Unauthorized' }, 401)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { domain, email_prefix, _override_user_id } = body

    if (!domain) {
      return json({ success: false, error: 'Domain gerekli' }, 400)
    }

    // Resolve user: either from JWT or from _override_user_id (service role calls)
    let userId: string | null = null

    if (_override_user_id) {
      // Check if caller is service_role by decoding JWT payload
      try {
        const token = (authHeader || '').replace('Bearer ', '')
        const payloadB64 = token.split('.')[1]
        if (payloadB64) {
          const payload = JSON.parse(atob(payloadB64))
          if (payload.role === 'service_role') {
            userId = _override_user_id
          }
        }
      } catch {
        // Not a valid JWT, ignore
      }
    }

    if (!userId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
      if (authError || !user) return json({ success: false, error: 'Unauthorized' }, 401)
      userId = user.id
    }

    // Resolve customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    const customerEmail = profile?.email || ''

    let customerRow = null
    if (customerEmail) {
      const { data } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle()
      customerRow = data
    }
    if (!customerRow) {
      const { data } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('profile_id', userId)
        .maybeSingle()
      customerRow = data
    }
    if (!customerRow) {
      return json({ success: false, error: 'Müşteri kaydı bulunamadı' }, 400)
    }

    // Check if user already has an email promo service
    const { data: existingHosting } = await supabaseAdmin
      .from('hosting')
      .select('id')
      .eq('customer_id', customerRow.id)
      .eq('package_name', CPANEL_PACKAGE)
      .maybeSingle()

    if (existingHosting) {
      return json({ success: false, error: 'Bu kampanyadan zaten yararlandınız' }, 400)
    }

    // Generate cPanel username from domain (max 8 chars, lowercase, alphanumeric)
    const cleanDomain = domain.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    const cpanelUsername = cleanDomain.substring(0, 8) + Math.floor(Math.random() * 100)
    const cpanelPassword = generatePassword()

    // Get the cPanel server (is_active=true, server_type=cpanel)
    const { data: server } = await supabaseAdmin
      .from('servers')
      .select('*')
      .eq('is_active', true)
      .eq('server_type', 'cpanel')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (!server) {
      return json({ success: false, error: 'Aktif cPanel sunucusu bulunamadı' }, 500)
    }

    // Create hosting record first
    const { data: hosting, error: hostingError } = await supabaseAdmin
      .from('hosting')
      .insert({
        customer_id: customerRow.id,
        domain: domain,
        package_name: CPANEL_PACKAGE,
        server_id: server.id,
        cpanel_username: cpanelUsername,
        cpanel_password: cpanelPassword,
        server_ip: server.ip_address,
        nameserver_1: server.nameservers?.[0] || 'ns1.lumayazilim.com',
        nameserver_2: server.nameservers?.[1] || 'ns2.lumayazilim.com',
        status: 'active',
        billing_cycle: 'monthly',
        disk_space_gb: 10,
        bandwidth_gb: 100,
        start_date: new Date().toISOString(),
        expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        next_invoice_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Kurumsal E-Posta Kampanyası - 1 yıl taahhütlü',
      })
      .select()
      .single()

    if (hostingError || !hosting) {
      console.error('Hosting insert failed:', JSON.stringify(hostingError))
      return json({ success: false, error: 'Hosting kaydı oluşturulamadı: ' + (hostingError?.message || 'unknown') }, 500)
    }

    // Create cPanel account via WHM API
    const WHM_HOST = server.hostname || Deno.env.get('WHM_HOST')
    const WHM_USER = server.username || Deno.env.get('WHM_USERNAME') || 'root'
    // Server may store token in api_token or access_hash field
    const WHM_TOKEN = server.api_token || Deno.env.get('WHM_API_TOKEN')

    let cpanelCreated = false
    let whmDebug = ''

    if (WHM_HOST && WHM_TOKEN) {
      try {
        const params = new URLSearchParams({
          username: cpanelUsername,
          domain: domain,
          password: cpanelPassword,
          plan: CPANEL_PACKAGE,
          contactemail: customerEmail,
          quota: '0',
          hasshell: '0',
          maxftp: '0',
          maxsql: '0',
          maxpop: '0', // unlimited email accounts
          maxlst: '0',
          maxsub: '0',
          maxpark: '0',
          maxaddon: '0',
          bwlimit: '0',
          ip: 'y',
          cgi: '1',
          frontpage: '0',
          cpmod: 'jupiter',
        })

        const whmUrl = `https://${WHM_HOST}:2087/json-api/createacct?${params.toString()}`
        const whmRes = await fetch(whmUrl, {
          method: 'GET',
          headers: { 'Authorization': `WHM ${WHM_USER}:${WHM_TOKEN}` },
        })

        const whmResult = await whmRes.json()

        console.log('WHM response:', JSON.stringify(whmResult).substring(0, 500))

        // WHM response format varies: metadata.result or result[0].status
        const whmSuccess = whmResult.metadata?.result === 1 || whmResult.result?.[0]?.status === 1

        if (whmSuccess) {
          cpanelCreated = true
          console.log(`✅ cPanel account created: ${cpanelUsername}@${domain}`)

          // Update hosting status to active
          await supabaseAdmin
            .from('hosting')
            .update({ status: 'active' })
            .eq('id', hosting.id)
        } else {
          whmDebug = whmResult.metadata?.reason || JSON.stringify(whmResult).substring(0, 500)
          console.error('WHM createacct failed:', whmDebug)
        }
      } catch (whmErr: any) {
        console.error('WHM API error:', whmErr?.message || whmErr)
        // Return the WHM error for debugging
        return json({
          success: true,
          hosting_id: hosting.id,
          cpanel_created: false,
          whm_error: whmErr?.message || String(whmErr),
          credentials: {
            domain,
            username: cpanelUsername,
            password: cpanelPassword,
            server: WHM_HOST,
          },
        })
      }
    } else {
      console.log('WHM credentials not configured, skipping auto-provision')
    }

    // If WHM failed, add to provisioning queue for manual/retry
    if (!cpanelCreated) {
      await supabaseAdmin.from('provisioning_queue').insert({
        service_type: 'hosting',
        service_id: hosting.id,
        status: 'active',
        metadata: {
          domain,
          username: cpanelUsername,
          password: cpanelPassword,
          package_name: CPANEL_PACKAGE,
          email: customerEmail,
          server_id: server.id,
          campaign: 'email-promo',
        },
      })
    }

    // Create first month invoice (0₺ with ILKAY promo)
    // This invoice is auto-paid since total is 0
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .insert({
        customer_id: customerRow.id,
        status: 'paid',
        due_date: new Date().toISOString(),
        paid_date: new Date().toISOString(),
        subtotal: 0,
        tax: 0,
        total: 0,
        total_amount: 0,
        currency: 'TRY',
        payment_method: 'Kampanya - İlk Ay Bedava',
        notes: `Kurumsal E-Posta Kampanyası - ${domain} - 1/12 ay`,
        related_service_id: hosting.id,
        related_service_type: 'hosting',
      })
      .select()
      .single()

    if (invoice) {
      await supabaseAdmin.from('invoice_items').insert({
        invoice_id: invoice.id,
        type: 'hosting',
        description: `Kurumsal E-Posta - ${domain} (İlk Ay Bedava)`,
        quantity: 1,
        unit_price: 0,
        amount: 0,
        total_price: 0,
        total: 0,
        service_type: 'hosting',
      })
    }

    // --- iyzico Abonelik Oluştur (3D'siz otomatik çekim için) ---
    // Kart bilgisi iyzico checkout'ta zaten kaydedildi (cardUserKey).
    // Şimdi subscription-create ile aylık abonelik planı oluştur.
    try {
      const subRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/subscription-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          customer_id: customerRow.id,
          hosting_id: hosting.id,
          // E-Posta kampanyası özel fiyatlandırma:
          // iyzico abonelik 2. aydan itibaren otomatik çekim yapacak
          // 2-3. ay: 9,90₺ → sonra plan güncellenir 49,90₺
          custom_price: 9.90,
          billing_cycle: 'monthly',
          campaign: 'email-promo',
        }),
      })
      const subResult = await subRes.json()
      if (subResult.success) {
        console.log('✅ iyzico subscription created for email promo')
      } else {
        console.error('Subscription creation failed (non-fatal):', subResult.error)
      }
    } catch (subErr) {
      console.error('Subscription creation error (non-fatal):', subErr)
    }

    // Send welcome email
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          to: customerEmail,
          template_key: 'service_provisioned',
          template_vars: {
            customer_name: profile?.full_name || 'Müşteri',
            service_name: `Kurumsal E-Posta - ${domain}`,
            username: cpanelUsername,
            server: WHM_HOST || server.hostname || server.ip_address,
            panel_url: `https://${server.hostname || server.ip_address}:2083`,
          },
        }),
      })
    } catch (emailErr) {
      console.error('Welcome email failed (non-fatal):', emailErr)
    }

    return json({
      success: true,
      hosting_id: hosting.id,
      cpanel_created: cpanelCreated,
      whm_debug: whmDebug || undefined,
      credentials: {
        domain,
        username: cpanelUsername,
        password: cpanelPassword,
        server: server.hostname || server.ip_address,
        cpanel_url: `https://${server.hostname || server.ip_address}:2083`,
        webmail_url: `https://${server.hostname || server.ip_address}:2096`,
        nameservers: [
          server.nameserver_1 || 'ns1.lumayazilim.com',
          server.nameserver_2 || 'ns2.lumayazilim.com',
        ],
      },
      pricing: {
        month_1: '0₺ (bedava)',
        month_2_3: '9,90₺/ay',
        month_4_12: '49,90₺/ay',
        total_year: '468,90₺',
      },
    })
  } catch (error) {
    console.error('email-promo-provision error:', error)
    return json({ success: false, error: (error as Error).message }, 400)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function generatePassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}
