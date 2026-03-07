// Supabase Edge Function for creating cPanel accounts
// Deploy: supabase functions deploy cpanel-create-account

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

    // Get user from auth token
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Only admins can create cPanel accounts')
    }

    const {
      hosting_id,
      domain,
      username,
      password,
      package_name,
      email,
      server_id,
    } = await req.json()

    if (!hosting_id || !domain || !username || !package_name) {
      throw new Error('Missing required fields: hosting_id, domain, username, package_name')
    }

    // Get hosting record
    const { data: hosting, error: hostingError } = await supabaseClient
      .from('hosting')
      .select('*')
      .eq('id', hosting_id)
      .single()

    if (hostingError || !hosting) {
      throw new Error('Hosting record not found')
    }

    // Get server details
    const { data: server, error: serverError } = await supabaseClient
      .from('servers')
      .select('*')
      .eq('id', server_id || hosting.server_id)
      .single()

    if (serverError || !server) {
      throw new Error('Server not found')
    }

    console.log('🚀 Creating cPanel account:', { domain, username, server: server.name })

    // WHM API Configuration
    const WHM_HOST = server.hostname || Deno.env.get('WHM_HOST')
    const WHM_USER = server.username || Deno.env.get('WHM_USERNAME') || 'root'
    const WHM_TOKEN = server.api_token || Deno.env.get('WHM_API_TOKEN')

    if (!WHM_HOST || !WHM_TOKEN) {
      throw new Error('WHM credentials not configured')
    }

    // Generate random password if not provided
    const accountPassword = password || generatePassword()

    // Build WHM API request
    const params = new URLSearchParams({
      username: username.toLowerCase().substring(0, 16), // cPanel username max 16 chars
      domain: domain,
      password: accountPassword,
      plan: package_name,
      contactemail: email || hosting.customer_email || '',
      quota: '0', // unlimited (uses package quota)
      hasshell: '0',
      maxftp: '0', // unlimited
      maxsql: '0', // unlimited
      maxpop: '0', // unlimited
      maxlst: '0', // unlimited
      maxsub: '0', // unlimited
      maxpark: '0', // unlimited
      maxaddon: '0', // unlimited
      bwlimit: '0', // unlimited
      ip: 'y', // use main shared IP
      cgi: '1',
      frontpage: '0',
      cpmod: 'x3', // cPanel theme
    })

    // Call WHM API
    const whmUrl = `https://${WHM_HOST}:2087/json-api/createacct?${params.toString()}`

    const response = await fetch(whmUrl, {
      method: 'GET',
      headers: {
        'Authorization': `WHM ${WHM_USER}:${WHM_TOKEN}`,
      },
    })

    const result = await response.json()

    console.log('📥 WHM Response:', result.metadata?.result)

    if (result.metadata?.result !== 1) {
      const errorMsg = result.metadata?.reason || 'Failed to create cPanel account'
      throw new Error(errorMsg)
    }

    // Update hosting record with cPanel credentials
    await supabaseClient
      .from('hosting')
      .update({
        cpanel_username: username.toLowerCase().substring(0, 16),
        cpanel_password: accountPassword,
        server_ip: server.ip_address,
        nameserver_1: server.nameserver_1 || 'ns1.example.com',
        nameserver_2: server.nameserver_2 || 'ns2.example.com',
        status: 'active',
      })
      .eq('id', hosting_id)

    console.log('✅ cPanel account created successfully')

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          username: username.toLowerCase().substring(0, 16),
          password: accountPassword,
          domain: domain,
          server_ip: server.ip_address,
          cpanel_url: `https://${server.hostname}:2083`,
          nameservers: [
            server.nameserver_1 || 'ns1.example.com',
            server.nameserver_2 || 'ns2.example.com',
          ],
        },
        message: 'cPanel account created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('cPanel account creation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Generate random password
function generatePassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}
