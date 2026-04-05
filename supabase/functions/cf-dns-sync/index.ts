// Cloudflare DNS kayıtları yönetimi - list/create/update/delete
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getCfToken(supabaseAdmin: any) {
  const { data } = await supabaseAdmin.from('system_settings').select('setting_value').eq('setting_key', 'cf_api_token').single()
  return data?.setting_value || Deno.env.get('CF_API_TOKEN')
}

async function cfFetch(token: string, path: string, method = 'GET', body?: any) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return res.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    const { action, domain_id, zone_id: directZoneId, record } = await req.json()
    // action: 'list' | 'create' | 'update' | 'delete'
    // domain_id VEYA zone_id ile çalışır (admin zone_id ile doğrudan erişebilir)

    let zoneId = directZoneId
    let domainId = domain_id

    if (domain_id) {
      const { data: domain } = await supabaseAdmin.from('domains').select('*').eq('id', domain_id).single()
      if (!domain) throw new Error('Domain bulunamadı')
      if (!isAdmin && domain.customer_id !== user.id) throw new Error('Bu domain size ait değil')
      if (!domain.cf_zone_id) throw new Error('Bu domain Cloudflare\'a eklenmemiş')
      zoneId = domain.cf_zone_id
    } else if (directZoneId && isAdmin) {
      zoneId = directZoneId
    } else {
      throw new Error('domain_id veya zone_id gerekli')
    }

    const CF_TOKEN = await getCfToken(supabaseAdmin)
    if (!CF_TOKEN) throw new Error('CF API Token yapılandırılmamış')

    if (action === 'list') {
      const data = await cfFetch(CF_TOKEN, `/zones/${zoneId}/dns_records?per_page=100`)
      if (!data.success) throw new Error('DNS kayıtları alınamadı')

      return new Response(JSON.stringify({
        success: true,
        records: data.result.map((r: any) => ({
          id: r.id,
          type: r.type,
          name: r.name,
          content: r.content,
          ttl: r.ttl,
          priority: r.priority,
          proxied: r.proxied,
        })),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'create') {
      if (!record?.type || !record?.name || !record?.content) throw new Error('type, name, content gerekli')

      const body: any = {
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl || 1, // 1 = automatic
        proxied: record.proxied ?? (record.type === 'A' || record.type === 'AAAA' || record.type === 'CNAME'),
      }
      if (record.priority != null) body.priority = record.priority

      const data = await cfFetch(CF_TOKEN, `/zones/${zoneId}/dns_records`, 'POST', body)
      if (!data.success) throw new Error(data.errors?.map((e: any) => e.message).join(', ') || 'Kayıt oluşturulamadı')

      // Lokal dns_records tablosuna da ekle
      await supabaseAdmin.from('dns_records').insert({
        domain_id,
        record_type: record.type,
        name: record.name,
        value: record.content,
        ttl: record.ttl || 3600,
        priority: record.priority,
      })

      return new Response(JSON.stringify({ success: true, record: data.result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'update') {
      if (!record?.id) throw new Error('record.id gerekli')
      const body: any = {
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl || 1,
        proxied: record.proxied ?? false,
      }
      if (record.priority != null) body.priority = record.priority

      const data = await cfFetch(CF_TOKEN, `/zones/${zoneId}/dns_records/${record.id}`, 'PUT', body)
      if (!data.success) throw new Error(data.errors?.map((e: any) => e.message).join(', ') || 'Kayıt güncellenemedi')

      return new Response(JSON.stringify({ success: true, record: data.result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'delete') {
      if (!record?.id) throw new Error('record.id gerekli')
      const data = await cfFetch(CF_TOKEN, `/zones/${zoneId}/dns_records/${record.id}`, 'DELETE')
      if (!data.success) throw new Error('Kayıt silinemedi')

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Geçersiz action. list/create/update/delete kullanın.')
  } catch (error) {
    console.error('CF DNS error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
