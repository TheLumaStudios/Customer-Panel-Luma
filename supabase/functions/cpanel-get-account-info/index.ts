// Supabase Edge Function for getting cPanel account info
// Deploy: supabase functions deploy cpanel-get-account-info

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

    const url = new URL(req.url)
    const hosting_id = url.searchParams.get('hosting_id')

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

    // Check if user owns this hosting or is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && hosting.customer_id !== user.id) {
      throw new Error('Unauthorized to view this hosting account')
    }

    if (!hosting.cpanel_username) {
      throw new Error('cPanel username not found')
    }

    console.log('📊 Getting cPanel account info:', hosting.cpanel_username)

    const WHM_HOST = hosting.server?.hostname || Deno.env.get('WHM_HOST')
    const WHM_USER = hosting.server?.username || Deno.env.get('WHM_USERNAME') || 'root'
    const WHM_TOKEN = hosting.server?.api_token || Deno.env.get('WHM_API_TOKEN')

    if (!WHM_HOST || !WHM_TOKEN) {
      throw new Error('WHM credentials not configured')
    }

    // Get account summary
    const params = new URLSearchParams({
      user: hosting.cpanel_username,
    })

    const whmUrl = `https://${WHM_HOST}:2087/json-api/accountsummary?${params.toString()}`

    const response = await fetch(whmUrl, {
      method: 'GET',
      headers: {
        'Authorization': `WHM ${WHM_USER}:${WHM_TOKEN}`,
      },
    })

    const result = await response.json()

    if (result.metadata?.result !== 1) {
      throw new Error(result.metadata?.reason || 'Failed to get account info')
    }

    const accountData = result.data?.acct?.[0]

    if (!accountData) {
      throw new Error('Account data not found')
    }

    console.log('✅ Account info retrieved')

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          username: accountData.user,
          domain: accountData.domain,
          email: accountData.email,
          disk_used: accountData.diskused,
          disk_limit: accountData.disklimit,
          disk_percent: accountData.diskusedpercent,
          suspended: accountData.suspended === '1',
          suspended_reason: accountData.suspendreason,
          plan: accountData.plan,
          theme: accountData.theme,
          owner: accountData.owner,
          ip: accountData.ip,
          partition: accountData.partition,
          unix_startdate: accountData.unix_startdate,
          startdate: accountData.startdate,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('cPanel get info error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
