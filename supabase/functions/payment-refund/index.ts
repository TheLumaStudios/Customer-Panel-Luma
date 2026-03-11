// İade (Refund) işlemi - Tam veya kısmi iade
// Deploy: supabase functions deploy payment-refund

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

    // Kullanıcı kontrolü
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
      throw new Error('Only admins can process refunds')
    }

    const {
      payment_id,
      amount, // Kısmi iade için, belirtilmezse tam iade
      reason,
    } = await req.json()

    console.log('💸 Processing refund for payment:', payment_id)

    // Ödeme kaydını bul
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*, invoice:invoices(*)')
      .eq('id', payment_id)
      .single()

    if (!payment) throw new Error('Payment not found')
    if (payment.status !== 'completed') throw new Error('Only completed payments can be refunded')

    const refundAmount = amount || payment.amount
    if (refundAmount > payment.amount) throw new Error('Refund amount exceeds payment amount')

    // iyzico'da iade işlemi
    const refundResult = await iyzicoRequest('/payment/refund', {
      locale: 'tr',
      conversationId: payment.gateway_transaction_id,
      paymentTransactionId: payment.gateway_transaction_id,
      price: refundAmount.toFixed(2),
      currency: payment.currency,
      ip: req.headers.get('x-forwarded-for') || '85.34.78.112',
    })

    if (refundResult.status !== 'success') {
      throw new Error(refundResult.errorMessage || 'Refund failed')
    }

    console.log('✅ Refund successful')

    // İade kaydı oluştur
    const { data: refund } = await supabaseAdmin
      .from('refunds')
      .insert({
        payment_id,
        invoice_id: payment.invoice_id,
        iyzico_payment_id: payment.gateway_transaction_id,
        iyzico_payment_transaction_id: refundResult.paymentId,
        amount: refundAmount,
        currency: payment.currency,
        reason,
        status: 'success',
        iyzico_response: refundResult,
        created_by: user.id,
      })
      .select()
      .single()

    // Ödeme durumunu güncelle
    if (refundAmount === payment.amount) {
      // Tam iade
      await supabaseAdmin
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', payment_id)

      // Faturayı da güncelle
      if (payment.invoice_id) {
        await supabaseAdmin
          .from('invoices')
          .update({ status: 'refunded' })
          .eq('id', payment.invoice_id)
      }
    } else {
      // Kısmi iade - notlara ekle
      await supabaseAdmin
        .from('payments')
        .update({
          notes: `Kısmi iade: ${refundAmount} ${payment.currency}`
        })
        .eq('id', payment_id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund,
        iyzico_data: refundResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Refund error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
