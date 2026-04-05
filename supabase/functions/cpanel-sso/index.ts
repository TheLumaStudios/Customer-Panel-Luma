// Supabase Edge Function for cPanel SSO (Single Sign-On)
// Creates a session URL for cPanel or Webmail access
// Deploy: supabase functions deploy cpanel-sso

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Authenticate user
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get user profile/role
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const { hosting_id, target } = await req.json()

    if (!hosting_id || !target) {
      throw new Error('hosting_id ve target (cpanel | webmail) gerekli')
    }

    if (!['cpanel', 'webmail'].includes(target)) {
      throw new Error('target "cpanel" veya "webmail" olmalı')
    }

    // Get hosting record
    const { data: hosting, error: hostingError } = await supabaseClient
      .from('hosting')
      .select('*, server:servers(*)')
      .eq('id', hosting_id)
      .single()

    if (hostingError || !hosting) {
      throw new Error('Hosting kaydı bulunamadı')
    }

    // Authorization: admin can access any, customer can only access own hosting
    if (profile?.role !== 'admin') {
      // Check if this hosting belongs to the customer
      const { data: customer } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (!customer || hosting.customer_id !== customer.id) {
        throw new Error('Bu hosting paketine erişim yetkiniz yok')
      }
    }

    const server = hosting.server
    if (!server) {
      throw new Error('Sunucu bilgisi bulunamadı')
    }

    if (!hosting.cpanel_username) {
      throw new Error('cPanel kullanıcı adı tanımlanmamış')
    }

    // Build WHM API URL for create_user_session
    const whmHost = server.hostname || server.ip_address
    const whmPort = server.port || 2087

    // Prepare authentication
    let authValue = ''
    if (server.api_token) {
      authValue = `whm ${server.username || 'root'}:${server.api_token}`
    } else if (server.access_hash) {
      const cleanHash = server.access_hash.replace(/\n/g, '').replace(/\r/g, '')
      authValue = `WHM ${server.username || 'root'}:${cleanHash}`
    } else if (server.password) {
      const credentials = btoa(`${server.username || 'root'}:${server.password}`)
      authValue = `Basic ${credentials}`
    } else {
      throw new Error('Sunucu kimlik doğrulama bilgisi bulunamadı')
    }

    const ssoUrl = `https://${whmHost}:${whmPort}/json-api/create_user_session?api.version=1&user=${hosting.cpanel_username}&service=${target}`

    console.log('cPanel SSO request:', { whmHost, whmPort, user: hosting.cpanel_username, target })

    const whmResponse = await fetch(ssoUrl, {
      method: 'GET',
      headers: {
        'Authorization': authValue,
      },
    })

    const whmData = await whmResponse.json()

    if (!whmResponse.ok || whmData?.metadata?.result !== 1) {
      const errorMsg = whmData?.metadata?.reason || whmData?.error || 'SSO oturumu oluşturulamadı'
      throw new Error(errorMsg)
    }

    const sessionUrl = whmData?.data?.url
    if (!sessionUrl) {
      throw new Error('Oturum URL bilgisi alınamadı')
    }

    return new Response(
      JSON.stringify({ success: true, url: sessionUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('cPanel SSO Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error.message === 'Unauthorized' ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
