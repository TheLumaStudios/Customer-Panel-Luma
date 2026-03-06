// Supabase Edge Function for cPanel/WHM API Proxy
// This function proxies requests to cPanel servers to avoid CORS issues

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { server, endpoint, method = 'GET', params } = await req.json()

    if (!server || !endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing server or endpoint' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate server has required fields
    if (!server.hostname || !server.port || !server.username) {
      return new Response(
        JSON.stringify({ error: 'Server configuration incomplete' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build cPanel API URL
    const baseURL = `https://${server.hostname}:${server.port}/json-api`
    const url = new URL(`${baseURL}${endpoint}`)

    // Add query parameters - WHM API uses query strings, not JSON body
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          url.searchParams.append(key, String(params[key]))
        }
      })
    }

    // Prepare authentication header
    let authHeader = ''
    if (server.api_token) {
      // API Token authentication (recommended)
      authHeader = `whm ${server.username}:${server.api_token}`
    } else if (server.access_hash) {
      // Access Hash authentication (legacy)
      const cleanHash = server.access_hash.replace(/\n/g, '').replace(/\r/g, '')
      authHeader = `WHM ${server.username}:${cleanHash}`
    } else if (server.password) {
      // Basic authentication (least secure)
      const credentials = btoa(`${server.username}:${server.password}`)
      authHeader = `Basic ${credentials}`
    } else {
      return new Response(
        JSON.stringify({ error: 'No authentication method available' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('cPanel Request:', {
      url: url.toString(),
      method,
      hasAuth: !!authHeader
    })

    // Make request to cPanel - all parameters must be in query string
    const cpanelResponse = await fetch(url.toString(), {
      method: method === 'POST' ? 'GET' : method, // WHM API uses GET even for mutations
      headers: {
        'Authorization': authHeader,
      },
    })

    const responseData = await cpanelResponse.json()

    // Return response with CORS headers
    return new Response(
      JSON.stringify(responseData),
      {
        status: cpanelResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('cPanel Proxy Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to connect to cPanel server'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
