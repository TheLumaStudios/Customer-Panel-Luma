// Supabase Edge Function for domain renewal
// Deploy: supabase functions deploy domain-renew

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

    const { domain_name, period = 1 } = await req.json()
    if (!domain_name) throw new Error('domain_name is required')

    // Check domain ownership
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    const { data: domain } = await supabaseClient.from('domains').select('id, customer_id, expiration_date').eq('domain_name', domain_name).single()
    if (!domain) throw new Error('Domain not found')
    if (!isAdmin && domain.customer_id !== user.id) throw new Error('Unauthorized')

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
      'domains[0][type]': 'renew',
      'domains[0][sld]': sld,
      'domains[0][tld]': tld,
      'domains[0][period]': period.toString(),
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

    // Create invoice for renewal
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .insert({
        customer_id: domain.customer_id,
        status: 'unpaid',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: 0,
        tax: 0,
        total: 0,
        currency: 'USD',
        notes: `Domain renewal: ${domain_name} (${period} year${period > 1 ? 's' : ''})`,
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError)
      throw new Error('Failed to create renewal invoice')
    }

    // Insert invoice item
    await supabaseClient.from('invoice_items').insert({
      invoice_id: invoice.id,
      type: 'domain',
      description: `Domain Renewal - ${domain_name} (${period} year${period > 1 ? 's' : ''})`,
      quantity: period,
      unit_price: 0,
      amount: 0,
      service_type: 'domain',
    })

    // Update domain expiration date
    const currentExpiration = domain.expiration_date ? new Date(domain.expiration_date) : new Date()
    const newExpiration = new Date(currentExpiration)
    newExpiration.setFullYear(newExpiration.getFullYear() + period)

    await supabaseClient.from('domains')
      .update({ expiration_date: newExpiration.toISOString() })
      .eq('id', domain.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Domain renewal submitted successfully',
        invoice_id: invoice.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Domain renewal error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
