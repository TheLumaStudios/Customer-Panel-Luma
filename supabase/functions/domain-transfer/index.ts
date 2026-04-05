// Supabase Edge Function for domain transfer
// Deploy: supabase functions deploy domain-transfer

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
    if (!user) throw new Error('Unauthorized')

    const { domain_name, auth_code } = await req.json()
    if (!domain_name) throw new Error('domain_name is required')
    if (!auth_code) throw new Error('auth_code is required')

    // Split domain into SLD and TLD
    const parts = domain_name.split('.')
    const sld = parts[0]
    const tld = parts.slice(1).join('.')

    // Resellers Panel API credentials
    const RP_USERNAME = Deno.env.get('RP_USERNAME')
    const RP_PASSWORD = Deno.env.get('RP_PASSWORD')
    const RP_API_URL = Deno.env.get('RP_API_URL') || 'https://api.duoservers.com'

    if (!RP_USERNAME || !RP_PASSWORD) throw new Error('Resellers Panel credentials not configured')

    const params = new URLSearchParams({
      auth_username: RP_USERNAME,
      auth_password: RP_PASSWORD,
      section: 'order',
      command: 'order_domains',
      return_type: 'json',
      client_id: user.id,
      username: user.email || '',
      ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
      currency: 'USD',
      price_type: 'price',
      payment_method: 'Wallet',
      country: 'TR',
      'domains[0][type]': 'transfer',
      'domains[0][sld]': sld,
      'domains[0][tld]': tld,
      'domains[0][auth_code]': auth_code,
    })

    const response = await fetch(`${RP_API_URL}/?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) throw new Error(`API returned ${response.status}: ${response.statusText}`)

    const apiData = await response.json()
    const responseData = apiData['1'] || apiData

    if (responseData.error_code && responseData.error_code !== 0) {
      throw new Error(`API Error ${responseData.error_code}: ${responseData.error_msg}`)
    }

    // Create domain_transfers record
    const { data: transfer, error: transferError } = await supabaseClient
      .from('domain_transfers')
      .insert({
        customer_id: user.id,
        domain_name,
        sld,
        tld,
        auth_code,
        status: 'pending',
        registrar_order_id: responseData.temporary_id || null,
      })
      .select()
      .single()

    if (transferError) {
      console.error('Transfer record error:', transferError)
      throw new Error('Failed to create transfer record')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Domain transfer initiated successfully',
        transfer_id: transfer.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Domain transfer error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
