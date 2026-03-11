// Kayıtlı Kart ile Ödeme - Tek tıkla ödeme
// Deploy: supabase functions deploy saved-card-pay

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

    const {
      invoice_id,
      card_id,
      installment = 1,
    } = await req.json()

    console.log('💳 Processing saved card payment:', { invoice_id, card_id })

    // Fatura bilgilerini al
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('*, customer:customers(*), items:invoice_items(*)')
      .eq('id', invoice_id)
      .single()

    if (!invoice) throw new Error('Invoice not found')
    if (invoice.customer_id !== user.id) throw new Error('Invoice does not belong to this user')
    if (invoice.status === 'paid') throw new Error('Invoice already paid')

    // Kayıtlı kartı al
    const { data: savedCard } = await supabaseAdmin
      .from('saved_cards')
      .select('*')
      .eq('id', card_id)
      .eq('customer_id', user.id)
      .eq('status', 'active')
      .single()

    if (!savedCard) throw new Error('Card not found or not authorized')

    const customer = invoice.customer

    // iyzico ödeme isteği
    const paymentResult = await iyzicoRequest('/payment/auth', {
      locale: 'tr',
      conversationId: invoice_id,
      price: invoice.total.toFixed(2),
      paidPrice: invoice.total.toFixed(2),
      currency: invoice.currency || 'TRY',
      installment: installment,
      paymentChannel: 'WEB',
      paymentGroup: 'PRODUCT',
      paymentCard: {
        cardToken: savedCard.card_token,
        cardUserKey: savedCard.card_user_key,
      },
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
      basketItems: invoice.items.map((item: any) => ({
        id: item.id,
        name: item.description || 'Item',
        category1: item.type || 'General',
        itemType: 'VIRTUAL',
        price: item.amount.toFixed(2),
      })),
    })

    if (paymentResult.status !== 'success') {
      // Başarısız ödeme kaydı
      await supabaseAdmin
        .from('payments')
        .insert({
          invoice_id,
          customer_id: user.id,
          amount: invoice.total,
          currency: invoice.currency || 'TRY',
          payment_method: 'iyzico',
          gateway: 'iyzico',
          status: 'failed',
          gateway_transaction_id: paymentResult.paymentId,
          gateway_response: paymentResult,
          notes: `Kayıtlı kart ile ödeme başarısız: ${paymentResult.errorMessage}`,
        })

      throw new Error(paymentResult.errorMessage || 'Payment failed')
    }

    console.log('✅ Payment successful')

    // Ödeme kaydı oluştur
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .insert({
        invoice_id,
        customer_id: user.id,
        amount: invoice.total,
        currency: invoice.currency || 'TRY',
        payment_method: 'iyzico',
        gateway: 'iyzico',
        status: 'completed',
        gateway_transaction_id: paymentResult.paymentId,
        gateway_response: paymentResult,
        notes: `Kayıtlı kart ile ödeme: ${savedCard.card_alias} (**** ${savedCard.last_four_digits})`,
      })
      .select()
      .single()

    // Fatura durumunu güncelle
    await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        payment_method: 'iyzico',
      })
      .eq('id', invoice_id)

    console.log('✅ Invoice marked as paid')

    return new Response(
      JSON.stringify({
        success: true,
        payment,
        iyzico_data: paymentResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Saved card payment error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
