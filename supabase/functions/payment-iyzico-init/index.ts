// Supabase Edge Function for iyzico payment initialization
// Deploy: supabase functions deploy payment-iyzico-init

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

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
      invoice_id,
      return_url,
      language = 'tr',
    } = await req.json()

    if (!invoice_id) {
      throw new Error('invoice_id is required')
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        customer:profiles(id, full_name, email, phone),
        items:invoice_items(*)
      `)
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get default billing address
    const { data: billingAddress } = await supabaseClient
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', user.id)
      .eq('type', 'billing')
      .eq('is_default', true)
      .single()

    // Get default shipping address (fallback to billing if not exists)
    const { data: shippingAddress } = await supabaseClient
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', user.id)
      .eq('type', 'shipping')
      .eq('is_default', true)
      .single()

    // iyzico configuration
    const IYZICO_API_KEY = Deno.env.get('IYZICO_API_KEY')
    const IYZICO_SECRET_KEY = Deno.env.get('IYZICO_SECRET_KEY')
    const IYZICO_BASE_URL = Deno.env.get('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com'

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      throw new Error('iyzico credentials not configured')
    }

    // Generate conversation ID
    const conversationId = `${invoice_id}-${Date.now()}`

    // Prepare basket items
    const basketItems = invoice.items.map((item: any) => ({
      id: item.id,
      name: item.description.substring(0, 100), // Max 100 chars
      category1: item.type,
      itemType: 'VIRTUAL',
      price: item.amount.toFixed(2),
    }))

    // Calculate price (iyzico requires string with 2 decimals)
    const price = invoice.total.toFixed(2)
    const paidPrice = invoice.total.toFixed(2) // Including fees

    // Build request payload
    const requestPayload = {
      locale: language.toUpperCase(),
      conversationId,
      price,
      paidPrice,
      currency: invoice.currency || 'USD',
      basketId: invoice.invoice_number,
      paymentGroup: 'PRODUCT',
      callbackUrl: return_url || `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-iyzico-callback`,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: profile.id,
        name: (billingAddress?.contact_name || profile.full_name)?.split(' ')[0] || 'Ad',
        surname: (billingAddress?.contact_name || profile.full_name)?.split(' ').slice(1).join(' ') || 'Soyad',
        gsmNumber: billingAddress?.phone || profile.phone || '+905350000000',
        email: profile.email,
        identityNumber: billingAddress?.identity_number || '11111111111', // TR kimlik no
        registrationAddress: billingAddress?.address_line1 || 'Adres bilgisi yok',
        ip: req.headers.get('x-forwarded-for') || '85.34.78.112',
        city: billingAddress?.city || 'Istanbul',
        country: billingAddress?.country || 'Turkey',
        zipCode: billingAddress?.postal_code || '34732',
      },
      shippingAddress: {
        contactName: shippingAddress?.contact_name || billingAddress?.contact_name || profile.full_name || 'Müşteri',
        city: shippingAddress?.city || billingAddress?.city || 'Istanbul',
        country: shippingAddress?.country || billingAddress?.country || 'Turkey',
        address: shippingAddress?.address_line1 || billingAddress?.address_line1 || 'Adres bilgisi yok',
        zipCode: shippingAddress?.postal_code || billingAddress?.postal_code || '34732',
      },
      billingAddress: {
        contactName: billingAddress?.contact_name || profile.full_name || 'Müşteri',
        city: billingAddress?.city || 'Istanbul',
        country: billingAddress?.country || 'Turkey',
        address: billingAddress?.address_line1 || 'Adres bilgisi yok',
        zipCode: billingAddress?.postal_code || '34732',
      },
      basketItems,
    }

    console.log('🔐 Initializing iyzico payment:', conversationId)

    // Create authorization header
    const randomString = crypto.randomUUID()
    const authString = `apiKey:${IYZICO_API_KEY}&randomKey:${randomString}&signature:`

    // Create HMAC signature
    const requestString = JSON.stringify(requestPayload)
    const dataToSign = randomString + requestString

    const encoder = new TextEncoder()
    const keyData = encoder.encode(IYZICO_SECRET_KEY)
    const msgData = encoder.encode(dataToSign)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, msgData)
    const signatureBase64 = base64Encode(new Uint8Array(signature))

    const authorization = `${authString}${signatureBase64}`

    // Call iyzico API
    const response = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'x-iyzi-rnd': randomString,
      },
      body: requestString,
    })

    const result = await response.json()

    console.log('📥 iyzico Response:', result.status)

    if (result.status !== 'success') {
      throw new Error(result.errorMessage || 'iyzico payment initialization failed')
    }

    // Save payment record
    await supabaseClient
      .from('payments')
      .insert({
        customer_id: user.id,
        invoice_id: invoice.id,
        amount: invoice.total,
        currency: invoice.currency,
        payment_method: 'iyzico',
        gateway_transaction_id: result.token,
        status: 'pending',
        notes: `iyzico conversation: ${conversationId}`,
      })

    return new Response(
      JSON.stringify({
        success: true,
        paymentPageUrl: result.paymentPageUrl,
        token: result.token,
        checkoutFormContent: result.checkoutFormContent, // HTML iframe content
        conversationId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('iyzico payment init error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
