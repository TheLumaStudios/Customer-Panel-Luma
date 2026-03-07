// Supabase Edge Function for terminating cPanel accounts
// Deploy: supabase functions deploy cpanel-terminate-account

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

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Only admins can terminate cPanel accounts')
    }

    const { hosting_id, keep_dns = false } = await req.json()

    if (!hosting_id) {
      throw new Error('hosting_id is required')
    }

    const { data: hosting, error: hostingError } = await supabaseClient
      .from('hosting')
      .select('*, server:servers(*)')
      .eq('id', hosting_id)
      .single()

    if (hostingError || !hosting) {
      throw new Error('Hosting record not found')
    }

    if (!hosting.cpanel_username) {
      throw new Error('cPanel username not found')
    }

    console.log('🗑️ Terminating cPanel account:', hosting.cpanel_username)

    const WHM_HOST = hosting.server?.hostname || Deno.env.get('WHM_HOST')
    const WHM_USER = hosting.server?.username || Deno.env.get('WHM_USERNAME') || 'root'
    const WHM_TOKEN = hosting.server?.api_token || Deno.env.get('WHM_API_TOKEN')

    if (!WHM_HOST || !WHM_TOKEN) {
      throw new Error('WHM credentials not configured')
    }

    const params = new URLSearchParams({
      user: hosting.cpanel_username,
      keepdns: keep_dns ? '1' : '0',
    })

    const whmUrl = `https://${WHM_HOST}:2087/json-api/removeacct?${params.toString()}`

    const response = await fetch(whmUrl, {
      method: 'GET',
      headers: {
        'Authorization': `WHM ${WHM_USER}:${WHM_TOKEN}`,
      },
    })

    const result = await response.json()

    if (result.metadata?.result !== 1) {
      throw new Error(result.metadata?.reason || 'Failed to terminate cPanel account')
    }

    // Update hosting status to terminated
    await supabaseClient
      .from('hosting')
      .update({
        status: 'terminated',
        cpanel_username: null,
        cpanel_password: null,
      })
      .eq('id', hosting_id)

    console.log('✅ cPanel account terminated')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'cPanel account terminated successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('cPanel terminate error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
