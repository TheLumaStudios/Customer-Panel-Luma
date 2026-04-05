// CF zone'u sisteme bağla - mevcut domain varsa güncelle, yoksa oluştur
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

    const { zone_id, zone_name, zone_status, name_servers, customer_id } = await req.json()
    if (!zone_id || !zone_name) throw new Error('zone_id ve zone_name gerekli')

    // DB'de bu domain var mı?
    const { data: existing } = await supabaseAdmin
      .from('domains')
      .select('id')
      .eq('domain_name', zone_name)
      .maybeSingle()

    if (existing) {
      // Mevcut domain'e CF bilgilerini bağla
      await supabaseAdmin.from('domains').update({
        cf_zone_id: zone_id,
        cf_nameservers: name_servers,
        cf_status: zone_status || 'pending',
      }).eq('id', existing.id)

      return new Response(JSON.stringify({
        success: true,
        action: 'linked',
        domain_id: existing.id,
        message: `${zone_name} mevcut domain kaydına bağlandı`,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } else {
      // Yeni domain kaydı oluştur
      const { data: newDomain, error } = await supabaseAdmin.from('domains').insert({
        domain_name: zone_name,
        status: 'active',
        cf_zone_id: zone_id,
        cf_nameservers: name_servers,
        cf_status: zone_status || 'pending',
        customer_id: customer_id || null,
        registration_date: new Date().toISOString(),
        expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }).select().single()

      if (error) throw error

      return new Response(JSON.stringify({
        success: true,
        action: 'created',
        domain_id: newDomain.id,
        message: `${zone_name} sisteme eklendi ve CF'ye bağlandı`,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (error) {
    console.error('CF zone link error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
