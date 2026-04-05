// Cloudflare Zone ayarları yönetimi - SSL, cache, security level, always HTTPS vb.
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

    const { action, zone_id, setting, value } = await req.json()
    const CF_TOKEN = await getCfToken(supabaseAdmin)
    if (!CF_TOKEN) throw new Error('CF API Token yapılandırılmamış')

    // GET: Tüm zone ayarlarını tek seferde getir
    if (action === 'get') {
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone_id}/settings`, {
        headers: { 'Authorization': `Bearer ${CF_TOKEN}` },
      })
      const data = await res.json()

      if (!data.success) {
        console.error('CF settings error:', JSON.stringify(data.errors))
        throw new Error(data.errors?.map((e: any) => e.message).join(', ') || 'Ayarlar alınamadı')
      }

      // result bir array, her biri { id, value } şeklinde
      const settingsMap: Record<string, any> = {}
      for (const item of data.result || []) {
        settingsMap[item.id] = item.value
      }

      return new Response(JSON.stringify({
        success: true,
        settings: {
          ssl: settingsMap.ssl || 'off',
          browser_cache_ttl: settingsMap.browser_cache_ttl || 0,
          security_level: settingsMap.security_level || 'medium',
          always_use_https: settingsMap.always_use_https || 'off',
          minify: settingsMap.minify || { css: 'off', html: 'off', js: 'off' },
          development_mode: settingsMap.development_mode || 'off',
        },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // UPDATE: Tek bir ayarı güncelle
    if (action === 'update') {
      if (!setting) throw new Error('setting gerekli')
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone_id}/settings/${setting}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.errors?.map((e: any) => e.message).join(', ') || 'Ayar güncellenemedi')

      return new Response(JSON.stringify({ success: true, value: data.result?.value }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PURGE: Cache temizle
    if (action === 'purge_cache') {
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone_id}/purge_cache`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ purge_everything: true }),
      })
      const data = await res.json()
      if (!data.success) throw new Error('Cache temizlenemedi')

      return new Response(JSON.stringify({ success: true, message: 'Cache temizlendi' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Geçersiz action')
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
