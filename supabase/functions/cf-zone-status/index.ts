// Cloudflare Zone durum kontrolü - NS değişikliği yapılmış mı kontrol eder
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

    const { domain_id } = await req.json()
    const { data: domain } = await supabaseAdmin.from('domains').select('*').eq('id', domain_id).single()
    if (!domain?.cf_zone_id) throw new Error('CF zone bulunamadı')

    // Yetki kontrolü
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin' && domain.customer_id !== user.id) throw new Error('Yetkisiz')

    const { data: settings } = await supabaseAdmin.from('system_settings').select('setting_value').eq('setting_key', 'cf_api_token').single()
    const CF_TOKEN = settings?.setting_value || Deno.env.get('CF_API_TOKEN')

    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${domain.cf_zone_id}`, {
      headers: { 'Authorization': `Bearer ${CF_TOKEN}` },
    })
    const data = await res.json()

    if (!data.success) throw new Error('Zone durumu alınamadı')

    const zone = data.result

    // DB'yi güncelle
    if (zone.status !== domain.cf_status) {
      await supabaseAdmin.from('domains').update({ cf_status: zone.status }).eq('id', domain_id)
    }

    return new Response(JSON.stringify({
      success: true,
      status: zone.status,
      nameservers: zone.name_servers,
      activated: zone.status === 'active',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
