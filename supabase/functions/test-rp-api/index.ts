// Test function with hardcoded credentials
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Hardcoded credentials for testing
    const username = 'store245114'
    const password = 'Enes16P1289!'
    const apiUrl = 'https://api.duoservers.com'

    const params = new URLSearchParams({
      auth_username: username,
      auth_password: password,
      section: 'products',
      command: 'get_registerdomains',
      return_type: 'json',
      offered: '1',
      active: '1',
    })

    params.append('currencies[]', 'USD')

    const fullUrl = `${apiUrl}/?${params.toString()}`

    console.log('Testing pricing API')

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    const data = await response.json()
    const responseData = data['1'] || data

    // Get .com domain as sample
    let comDomain = null
    if (responseData.registerdomains && responseData.registerdomains.com) {
      comDomain = responseData.registerdomains.com
    }

    return new Response(
      JSON.stringify({
        status: response.status,
        error_code: responseData.error_code,
        error_msg: responseData.error_msg,
        has_registerdomains: !!responseData.registerdomains,
        tld_count: responseData.registerdomains ? Object.keys(responseData.registerdomains).length : 0,
        sample_com: comDomain ? {
          name: comDomain.name,
          prices: comDomain.prices,
          price_tiers: comDomain.price_tiers,
          setup: comDomain.setup,
          available_periods: comDomain.available_periods
        } : null
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
