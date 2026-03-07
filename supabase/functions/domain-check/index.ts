// Supabase Edge Function for domain availability check (Resellers Panel API)
// Deploy: supabase functions deploy domain-check

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
    const { domains, extensions = ['com', 'net', 'org'], period = 1 } = await req.json()

    if (!domains || !Array.isArray(domains)) {
      throw new Error('Domains array is required')
    }

    // Resellers Panel API credentials
    const RP_USERNAME = Deno.env.get('RP_USERNAME')
    const RP_PASSWORD = Deno.env.get('RP_PASSWORD')
    const RP_API_URL = Deno.env.get('RP_API_URL') || 'https://api.duoservers.com'

    if (!RP_USERNAME || !RP_PASSWORD) {
      throw new Error('Resellers Panel credentials not configured')
    }

    console.log('📤 Checking domain availability via Resellers Panel API...')
    console.log('Request domains:', domains)
    console.log('Request extensions:', extensions)

    // Check each domain with all TLDs in one API call
    const results = []

    for (const sld of domains) {
      try {
        // Build API request URL
        const params = new URLSearchParams({
          auth_username: RP_USERNAME,
          auth_password: RP_PASSWORD,
          section: 'domains',
          command: 'check',
          name: sld,
          return_type: 'json'
        })

        // Add TLDs array
        extensions.forEach(ext => {
          params.append('tlds[]', ext)
        })

        const apiUrl = `${RP_API_URL}/?${params.toString()}`

        console.log(`🔍 Checking: ${sld} with extensions: ${extensions.join(', ')}`)

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })

        console.log(`📥 Response Status: ${response.status}`)

        if (!response.ok) {
          console.error(`❌ API Error: ${response.status} ${response.statusText}`)
          continue
        }

        const data = await response.json()

        // Response is wrapped in numbered object (e.g., "1": {...})
        const responseData = data['1'] || data

        // Check for API errors
        if (responseData.error_code && responseData.error_code !== 0) {
          console.error(`❌ API Error ${responseData.error_code}: ${responseData.error_msg}`)
          continue
        }

        // Parse results - result object has TLD as keys with status codes
        // Status: 0 = available, 1 = unavailable
        if (responseData.result && typeof responseData.result === 'object') {
          for (const [tld, status] of Object.entries(responseData.result)) {
            results.push({
              domain: `${sld}.${tld}`,
              sld: sld,
              tld: tld,
              available: status === 0,
              status: status === 0 ? 'available' : 'unavailable',
              price: 0, // Price will be fetched from pricing endpoint
              currency: 'USD',
              period: period,
            })
          }
        }
      } catch (err) {
        console.error(`❌ Error checking ${sld}:`, err.message)
      }
    }

    console.log('✅ Total results:', results.length)

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Domain check error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
