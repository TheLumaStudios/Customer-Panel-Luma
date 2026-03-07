// Supabase Edge Function for domain registration (Resellers Panel API)
// Deploy: supabase functions deploy domain-register

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

    const {
      domains, // Array of { sld, tld, period, contacts }
      currency = 'USD',
      payment_method = 'Wallet',
      return_url,
      cancel_url,
    } = await req.json()

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      throw new Error('Domains array is required')
    }

    // Resellers Panel API credentials
    const RP_USERNAME = Deno.env.get('RP_USERNAME')
    const RP_PASSWORD = Deno.env.get('RP_PASSWORD')
    const RP_API_URL = Deno.env.get('RP_API_URL') || 'https://api.duoservers.com'

    if (!RP_USERNAME || !RP_PASSWORD) {
      throw new Error('Resellers Panel credentials not configured')
    }

    console.log('📤 Submitting domain registration order...')
    console.log('Domains:', domains.map(d => `${d.sld}.${d.tld}`).join(', '))

    // Build API request
    const params = new URLSearchParams({
      auth_username: RP_USERNAME,
      auth_password: RP_PASSWORD,
      section: 'order',
      command: 'order_domains',
      return_type: 'json',
      client_id: user.id,
      username: user.email,
      ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
      currency: currency,
      price_type: 'price',
      payment_method: payment_method,
      country: 'TR',
      return_url: return_url || 'https://thankyou.duoservers.com/',
      cancel_url: cancel_url || window.location.origin,
    })

    // Add domains
    domains.forEach((domain, index) => {
      params.append(`domains[${index}][type]`, 'register')
      params.append(`domains[${index}][sld]`, domain.sld)
      params.append(`domains[${index}][tld]`, domain.tld)
      params.append(`domains[${index}][period]`, domain.period?.toString() || '1')

      // Add contact information
      if (domain.contacts) {
        const contacts = domain.contacts

        // Registrant contact
        params.append(`domains[${index}][contacts][registrantfirstname]`, contacts.firstName)
        params.append(`domains[${index}][contacts][registrantlastname]`, contacts.lastName)
        params.append(`domains[${index}][contacts][registrantemailaddress]`, contacts.email)
        params.append(`domains[${index}][contacts][registrantaddress1]`, contacts.address)
        params.append(`domains[${index}][contacts][registrantcity]`, contacts.city)
        params.append(`domains[${index}][contacts][registrantstateprovince]`, contacts.state)
        params.append(`domains[${index}][contacts][registrantpostalcode]`, contacts.postalCode)
        params.append(`domains[${index}][contacts][registrantcountry]`, contacts.country)
        params.append(`domains[${index}][contacts][registrantphone]`, contacts.phone)

        if (contacts.organization) {
          params.append(`domains[${index}][contacts][registrantorganizationname]`, contacts.organization)
        }
      }

      // Custom nameservers
      if (domain.nameservers && domain.nameservers.length > 0) {
        params.append(`domains[${index}][custom_nameservers]`, '1')
        domain.nameservers.forEach((ns, nsIndex) => {
          params.append(`domains[${index}][ns${nsIndex + 1}]`, ns)
        })
      }
    })

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

    console.log('📦 API Response:', JSON.stringify(data, null, 2))

    // Response is wrapped in numbered object (e.g., "1": {...})
    const responseData = data['1'] || data

    // Check for API errors
    if (responseData.error_code && responseData.error_code !== 0) {
      throw new Error(`API Error ${responseData.error_code}: ${responseData.error_msg}`)
    }

    // If redirect is needed (for payment)
    if (responseData.redirect && responseData.redirect_url) {
      return new Response(
        JSON.stringify({
          success: true,
          redirect: true,
          redirect_url: responseData.redirect_url,
          method: responseData.method || 'GET',
          parameters: responseData.parameters || {},
          temporary_id: responseData.temporary_id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create domain orders and invoice
    const domainOrderIds = []
    let invoiceId = null

    for (const domain of domains) {
      // Create domain order record
      const { data: domainOrder, error: orderError } = await supabaseClient
        .from('domain_orders')
        .insert({
          customer_id: user.id,
          domain: `${domain.sld}.${domain.tld}`,
          sld: domain.sld,
          tld: domain.tld,
          period: domain.period || 1,
          status: 'pending',
          registrant_contact: domain.contacts,
          nameservers: domain.nameservers,
          price: 0, // Price will be updated from Resellers Panel response
          currency: currency,
          registrar_order_id: responseData.temporary_id,
        })
        .select()
        .single()

      if (!orderError && domainOrder) {
        domainOrderIds.push(domainOrder.id)
      }
    }

    // Create invoice for domains
    const invoiceItems = domains.map(domain => ({
      type: 'domain',
      description: `Domain Registration - ${domain.sld}.${domain.tld} (${domain.period} year${domain.period > 1 ? 's' : ''})`,
      quantity: domain.period,
      unit_price: 0, // Will be updated with actual price
      service_type: 'domain',
    }))

    const subtotal = 0 // Calculate from actual prices
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .insert({
        customer_id: user.id,
        status: payment_method === 'Wallet' ? 'paid' : 'unpaid',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal,
        tax: 0,
        total: subtotal,
        currency,
        payment_method: payment_method === 'Wallet' ? 'wallet' : null,
        notes: `Domain registration order: ${responseData.temporary_id}`,
      })
      .select()
      .single()

    if (!invoiceError && invoice) {
      invoiceId = invoice.id

      // Insert invoice items
      const itemsToInsert = invoiceItems.map(item => ({
        ...item,
        invoice_id: invoice.id,
        amount: item.quantity * item.unit_price,
      }))

      await supabaseClient
        .from('invoice_items')
        .insert(itemsToInsert)

      // If wallet payment, record payment
      if (payment_method === 'Wallet') {
        await supabaseClient
          .from('payments')
          .insert({
            customer_id: user.id,
            invoice_id: invoice.id,
            amount: subtotal,
            currency,
            payment_method: 'wallet',
            status: 'completed',
            notes: `Domain registration payment`,
          })

        // Update invoice as paid
        await supabaseClient
          .from('invoices')
          .update({
            status: 'paid',
            paid_date: new Date().toISOString(),
          })
          .eq('id', invoice.id)
      }
    }

    // Success without redirect (e.g., using Wallet)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Domain registration order submitted successfully',
        order_id: responseData.temporary_id,
        invoice_id: invoiceId,
        domain_orders: domainOrderIds,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Domain registration error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
