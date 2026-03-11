// Ödeme Linki Oluşturma (PayWithIyzico)
// Deploy: supabase functions deploy payment-link-create

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function iyzicoRequest(endpoint: string, payload: any) {
  const IYZICO_API_KEY = Deno.env.get('IYZICO_API_KEY')
  const IYZICO_SECRET_KEY = Deno.env.get('IYZICO_SECRET_KEY')
  const IYZICO_BASE_URL = Deno.env.get('IYZICO_BASE_URL')

  const randomString = crypto.randomUUID()
  const requestString = JSON.stringify(payload)
  const dataToSign = randomString + requestString

  const encoder = new TextEncoder()
  const keyData = encoder.encode(IYZICO_SECRET_KEY)
  const msgData = encoder.encode(dataToSign)

  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, msgData)
  const signatureBase64 = base64Encode(new Uint8Array(signature))
  const authorization = `apiKey:${IYZICO_API_KEY}&randomKey:${randomString}&signature:${signatureBase64}`

  const response = await fetch(`${IYZICO_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authorization,
      'x-iyzi-rnd': randomString,
    },
    body: requestString,
  })

  return await response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Only admins can create payment links')
    }

    const {
      invoice_id,
      customer_id,
      amount,
      description,
      expires_in_hours = 24,
    } = await req.json()

    console.log('🔗 Creating payment link for invoice:', invoice_id)

    // Fatura varsa bilgilerini al
    let invoiceData = null
    if (invoice_id) {
      const { data: invoice } = await supabaseAdmin
        .from('invoices')
        .select('*, customer:customers(*)')
        .eq('id', invoice_id)
        .single()

      if (!invoice) throw new Error('Invoice not found')
      invoiceData = invoice
    }

    // Müşteri bilgilerini al
    const targetCustomerId = customer_id || invoiceData?.customer_id
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', targetCustomerId)
      .single()

    if (!customer) throw new Error('Customer not found')

    const paymentAmount = amount || invoiceData?.total || 0
    const paymentDescription = description || `Fatura Ödemesi - ${invoiceData?.invoice_number || ''}`

    // iyzico'da ödeme linki oluştur
    const linkToken = crypto.randomUUID()
    const callbackUrl = `${Deno.env.get('PUBLIC_URL') || 'http://localhost:5173'}/payment-callback`

    const linkResult = await iyzicoRequest('/payment/iyzipos/checkoutform/initialize/auth/ecom', {
      locale: 'tr',
      conversationId: linkToken,
      price: paymentAmount.toFixed(2),
      paidPrice: paymentAmount.toFixed(2),
      currency: 'TRY',
      basketId: invoice_id || linkToken,
      paymentGroup: 'PRODUCT',
      callbackUrl: callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9, 12],
      buyer: {
        id: customer.customer_code || customer.id,
        name: customer.full_name?.split(' ')[0] || 'Ad',
        surname: customer.full_name?.split(' ').slice(1).join(' ') || 'Soyad',
        gsmNumber: customer.phone || '+905350000000',
        email: customer.email,
        identityNumber: '11111111111',
        registrationAddress: customer.billing_address || 'Adres',
        ip: req.headers.get('x-forwarded-for') || '85.34.78.112',
        city: customer.billing_city || 'Istanbul',
        country: 'Turkey',
        zipCode: customer.billing_postal_code || '34000',
      },
      shippingAddress: {
        contactName: customer.full_name || 'Müşteri',
        city: customer.shipping_city || customer.billing_city || 'Istanbul',
        country: 'Turkey',
        address: customer.shipping_address || customer.billing_address || 'Adres',
        zipCode: customer.shipping_postal_code || customer.billing_postal_code || '34000',
      },
      billingAddress: {
        contactName: customer.full_name || 'Müşteri',
        city: customer.billing_city || 'Istanbul',
        country: 'Turkey',
        address: customer.billing_address || 'Adres',
        zipCode: customer.billing_postal_code || '34000',
      },
      basketItems: [
        {
          id: invoice_id || linkToken,
          name: paymentDescription,
          category1: 'Payment',
          itemType: 'VIRTUAL',
          price: paymentAmount.toFixed(2),
        },
      ],
    })

    if (linkResult.status !== 'success') {
      throw new Error(linkResult.errorMessage || 'Payment link creation failed')
    }

    console.log('✅ Payment link created')

    // Database'e kaydet
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours)

    const { data: paymentLink, error: linkError } = await supabaseAdmin
      .from('payment_links')
      .insert({
        customer_id: targetCustomerId,
        invoice_id: invoice_id,
        link_token: linkResult.token,
        link_url: linkResult.paymentPageUrl,
        amount: paymentAmount,
        currency: 'TRY',
        description: paymentDescription,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (linkError) throw linkError

    return new Response(
      JSON.stringify({
        success: true,
        payment_link: paymentLink,
        payment_url: linkResult.paymentPageUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Payment link creation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
