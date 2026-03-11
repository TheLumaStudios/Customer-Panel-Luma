// İptal (Cancel) işlemi - Ödeme iptali
// Deploy: supabase functions deploy payment-cancel

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
      throw new Error('Only admins can cancel payments')
    }

    const {
      payment_id,
      reason,
    } = await req.json()

    console.log('🚫 Processing cancellation for payment:', payment_id)

    // Ödeme kaydını bul
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*, invoice:invoices(*)')
      .eq('id', payment_id)
      .single()

    if (!payment) throw new Error('Payment not found')
    if (payment.status === 'cancelled') throw new Error('Payment already cancelled')
    if (payment.status === 'refunded') throw new Error('Cannot cancel refunded payment')

    // iyzico'da iptal işlemi
    const cancelResult = await iyzicoRequest('/payment/cancel', {
      locale: 'tr',
      conversationId: payment.gateway_transaction_id,
      paymentId: payment.gateway_transaction_id,
      ip: req.headers.get('x-forwarded-for') || '85.34.78.112',
    })

    if (cancelResult.status !== 'success') {
      throw new Error(cancelResult.errorMessage || 'Cancellation failed')
    }

    console.log('✅ Cancellation successful')

    // İptal kaydı oluştur
    const { data: cancellation } = await supabaseAdmin
      .from('cancellations')
      .insert({
        payment_id,
        invoice_id: payment.invoice_id,
        iyzico_payment_id: payment.gateway_transaction_id,
        reason,
        status: 'success',
        iyzico_response: cancelResult,
        created_by: user.id,
      })
      .select()
      .single()

    // Ödeme durumunu güncelle
    await supabaseAdmin
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('id', payment_id)

    // Faturayı da güncelle
    if (payment.invoice_id) {
      await supabaseAdmin
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', payment.invoice_id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        cancellation,
        iyzico_data: cancelResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Cancellation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
