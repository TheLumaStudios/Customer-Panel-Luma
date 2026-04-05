// Cloudflare'daki tüm zone'ları listele
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
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('Admin access required')

    // CF token
    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['cf_api_token', 'cf_account_id'])
    const settingsMap = Object.fromEntries((settings || []).map(s => [s.setting_key, s.setting_value]))
    const CF_TOKEN = settingsMap.cf_api_token || Deno.env.get('CF_API_TOKEN')
    if (!CF_TOKEN) throw new Error('CF API Token yapılandırılmamış')

    // Tüm zone'ları çek (sayfalı)
    const allZones = []
    let page = 1
    let totalPages = 1

    while (page <= totalPages) {
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones?per_page=50&page=${page}`, {
        headers: { 'Authorization': `Bearer ${CF_TOKEN}` },
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.errors?.map((e: any) => e.message).join(', ') || 'Zone listesi alınamadı')

      allZones.push(...data.result)
      totalPages = data.result_info?.total_pages || 1
      page++
    }

    // Bizim DB'deki domainleri çek
    const { data: dbDomains } = await supabaseAdmin
      .from('domains')
      .select('domain_name, cf_zone_id')

    const dbMap = new Map((dbDomains || []).map(d => [d.domain_name, d.cf_zone_id]))

    // Zone'ları zenginleştir
    const zones = allZones.map(z => ({
      id: z.id,
      name: z.name,
      status: z.status,
      name_servers: z.name_servers,
      plan: z.plan?.name || 'Free',
      created_on: z.created_on,
      activated_on: z.activated_on,
      // Bizim sistemde var mı?
      in_system: dbMap.has(z.name),
      linked: dbMap.get(z.name) === z.id,
    }))

    return new Response(JSON.stringify({
      success: true,
      zones,
      total: zones.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('CF zones list error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
