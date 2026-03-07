// Supabase Edge Function for changing cPanel password
// Deploy: supabase functions deploy cpanel-change-password

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

    const { hosting_id, new_password } = await req.json()

    if (!hosting_id || !new_password) {
      throw new Error('hosting_id and new_password are required')
    }

    if (new_password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    const { data: hosting, error: hostingError } = await supabaseClient
      .from('hosting')
      .select('*, server:servers(*)')
      .eq('id', hosting_id)
      .single()

    if (hostingError || !hosting) {
      throw new Error('Hosting record not found')
    }

    // Check if user owns this hosting or is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && hosting.customer_id !== user.id) {
      throw new Error('Unauthorized to change password for this hosting account')
    }

    if (!hosting.cpanel_username) {
      throw new Error('cPanel username not found')
    }

    console.log('🔑 Changing password for:', hosting.cpanel_username)

    const WHM_HOST = hosting.server?.hostname || Deno.env.get('WHM_HOST')
    const WHM_USER = hosting.server?.username || Deno.env.get('WHM_USERNAME') || 'root'
    const WHM_TOKEN = hosting.server?.api_token || Deno.env.get('WHM_API_TOKEN')

    if (!WHM_HOST || !WHM_TOKEN) {
      throw new Error('WHM credentials not configured')
    }

    const params = new URLSearchParams({
      user: hosting.cpanel_username,
      password: new_password,
    })

    const whmUrl = `https://${WHM_HOST}:2087/json-api/passwd?${params.toString()}`

    const response = await fetch(whmUrl, {
      method: 'GET',
      headers: {
        'Authorization': `WHM ${WHM_USER}:${WHM_TOKEN}`,
      },
    })

    const result = await response.json()

    if (result.metadata?.result !== 1) {
      throw new Error(result.metadata?.reason || 'Failed to change password')
    }

    // Update password in database
    await supabaseClient
      .from('hosting')
      .update({
        cpanel_password: new_password,
      })
      .eq('id', hosting_id)

    console.log('✅ Password changed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password changed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('cPanel password change error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
