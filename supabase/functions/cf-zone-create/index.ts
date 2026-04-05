// Cloudflare Zone oluşturma - Domain eklendiğinde otomatik CF zone açar
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

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

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('Admin access required')

    const { domain_id } = await req.json()
    if (!domain_id) throw new Error('domain_id gerekli')

    // Domain bilgisi
    const { data: domain } = await supabaseAdmin
      .from('domains').select('*').eq('id', domain_id).single()
    if (!domain) throw new Error('Domain bulunamadı')
    if (domain.cf_zone_id) throw new Error('Bu domain zaten Cloudflare\'da kayıtlı')

    // CF API ayarları
    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['cf_api_token', 'cf_account_id'])

    const settingsMap = Object.fromEntries((settings || []).map(s => [s.setting_key, s.setting_value]))
    const CF_TOKEN = settingsMap.cf_api_token || Deno.env.get('CF_API_TOKEN')
    const CF_ACCOUNT_ID = settingsMap.cf_account_id || Deno.env.get('CF_ACCOUNT_ID')

    if (!CF_TOKEN) throw new Error('Cloudflare API Token yapılandırılmamış')
    if (!CF_ACCOUNT_ID) throw new Error('Cloudflare Account ID yapılandırılmamış')

    console.log(`☁️ CF Zone oluşturuluyor: ${domain.domain_name}`)

    // 1. CF'de zone oluştur
    const createRes = await fetch('https://api.cloudflare.com/client/v4/zones', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: { id: CF_ACCOUNT_ID },
        name: domain.domain_name,
        type: 'full',
      }),
    })

    const createData = await createRes.json()

    if (!createData.success) {
      const errMsg = createData.errors?.map((e: any) => e.message).join(', ') || 'Zone oluşturulamadı'
      throw new Error(`CF Error: ${errMsg}`)
    }

    const zone = createData.result
    console.log(`✅ CF Zone oluşturuldu: ${zone.id}, NS: ${zone.name_servers.join(', ')}`)

    // 2. Domain kaydını güncelle
    await supabaseAdmin.from('domains').update({
      cf_zone_id: zone.id,
      cf_nameservers: zone.name_servers,
      cf_status: zone.status, // 'pending'
      cf_plan: 'free',
    }).eq('id', domain_id)

    // 3. Vanity NS kontrolü
    const { data: vanitySettings } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['cf_vanity_ns_enabled', 'cf_vanity_ns1', 'cf_vanity_ns2'])

    const vanityMap = Object.fromEntries((vanitySettings || []).map(s => [s.setting_key, s.setting_value]))
    const useVanity = vanityMap.cf_vanity_ns_enabled === 'true'

    const nameservers = useVanity
      ? [vanityMap.cf_vanity_ns1, vanityMap.cf_vanity_ns2].filter(Boolean)
      : zone.name_servers

    return new Response(JSON.stringify({
      success: true,
      zone_id: zone.id,
      nameservers,
      cf_nameservers: zone.name_servers,
      status: zone.status,
      message: `Domain Cloudflare'a eklendi. Müşterinin NS'lerini ${nameservers.join(' ve ')} olarak değiştirmesi gerekiyor.`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('CF Zone create error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
