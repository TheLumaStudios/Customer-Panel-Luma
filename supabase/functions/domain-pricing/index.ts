// Supabase Edge Function for domain pricing (Resellers Panel API)
// Deploy: supabase functions deploy domain-pricing

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
    const { currency = 'USD' } = await req.json().catch(() => ({}))

    // Resellers Panel API credentials
    const RP_USERNAME = Deno.env.get('RP_USERNAME')
    const RP_PASSWORD = Deno.env.get('RP_PASSWORD')
    const RP_API_URL = Deno.env.get('RP_API_URL') || 'https://api.duoservers.com'

    if (!RP_USERNAME || !RP_PASSWORD) {
      throw new Error('Resellers Panel credentials not configured')
    }

    console.log('📤 Fetching domain prices from Resellers Panel API...')

    // Build API request URL
    const params = new URLSearchParams({
      auth_username: RP_USERNAME,
      auth_password: RP_PASSWORD,
      section: 'products',
      command: 'get_registerdomains',
      return_type: 'json',
      offered: '1', // Only offered TLDs
      active: '1', // Only active TLDs
    })

    // Filter by currency
    params.append('currencies[]', currency)

    const apiUrl = `${RP_API_URL}/?${params.toString()}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    console.log(`📥 Response Status: ${response.status}`)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    console.log('📦 API Response received')

    // Response is wrapped in numbered object (e.g., "1": {...})
    const responseData = data['1'] || data

    // Check for API errors
    if (responseData.error_code && responseData.error_code !== 0) {
      throw new Error(`API Error ${responseData.error_code}: ${responseData.error_msg}`)
    }

    // Parse TLD prices
    const tlds = []

    // registerdomains is an object with TLD names as keys
    if (responseData.registerdomains && typeof responseData.registerdomains === 'object') {
      for (const [tldName, domain] of Object.entries(responseData.registerdomains)) {
        // Get price for 1 year registration (period_12 = 12 months)
        let price = 0
        if (domain.prices && domain.prices.period_12) {
          price = parseFloat(domain.prices.period_12.price || domain.prices.period_12.wholesale || 0)
        }

        // Convert period months to years: period_12 = 1 year, period_24 = 2 years
        const availablePeriods = []
        if (domain.prices) {
          for (const periodKey of Object.keys(domain.prices)) {
            const months = parseInt(periodKey.replace('period_', ''))
            if (!isNaN(months)) {
              const years = months / 12
              if (Number.isInteger(years)) {
                availablePeriods.push(years)
              }
            }
          }
        }

        tlds.push({
          extension: tldName,
          tld: tldName,
          price: price,
          currency: currency,
          periods: availablePeriods.length > 0 ? availablePeriods : [1, 2, 3, 5, 10],
          transfer: domain.can_transfer || false,
          id_protect: domain.id_protect_available || false,
        })
      }
    }

    console.log(`✅ Fetched ${tlds.length} TLDs`)

    return new Response(
      JSON.stringify({ success: true, tlds, count: tlds.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Domain pricing error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
