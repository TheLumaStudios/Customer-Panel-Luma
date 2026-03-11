// Supabase Edge Function for iyzico payment callback
// Deploy: supabase functions deploy payment-iyzico-callback

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role for admin operations
    )

    // Get token from query params (iyzico sends via POST or GET)
    const url = new URL(req.url)
    const token = url.searchParams.get('token') || (await req.formData()).get('token')

    if (!token) {
      throw new Error('Payment token not provided')
    }

    console.log('🔍 Processing iyzico callback, token:', token)

    // iyzico configuration
    const IYZICO_API_KEY = Deno.env.get('IYZICO_API_KEY')
    const IYZICO_SECRET_KEY = Deno.env.get('IYZICO_SECRET_KEY')
    const IYZICO_BASE_URL = Deno.env.get('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com'

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      throw new Error('iyzico credentials not configured')
    }

    // Retrieve payment result from iyzico
    const requestPayload = {
      locale: 'tr',
      token: token.toString(),
    }

    // Create authorization header
    const randomString = crypto.randomUUID()
    const authString = `apiKey:${IYZICO_API_KEY}&randomKey:${randomString}&signature:`

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

    // Retrieve payment result
    const response = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail`, {
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

    console.log('📥 iyzico Payment Result:', result.status, result.paymentStatus)

    // Find payment record
    const { data: payment } = await supabaseClient
      .from('payments')
      .select('*, invoice:invoices(*)')
      .eq('gateway_transaction_id', token.toString())
      .single()

    if (!payment) {
      throw new Error('Payment record not found')
    }

    // Update payment status
    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      console.log('✅ Payment successful')

      // Sistem ayarlarını al
      const { data: settings } = await supabaseClient
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['iyzico_invoice_type', 'iyzico_payment_method', 'iyzico_official_invoice'])

      const settingsMap = settings?.reduce((acc: any, setting: any) => {
        acc[setting.setting_key] = setting.setting_value
        return acc
      }, {}) || {}

      const invoiceType = settingsMap['iyzico_invoice_type'] || 'Mükerrer 20/B'
      const paymentMethod = settingsMap['iyzico_payment_method'] || 'İyzico Kredi Kartı'
      const isOfficialInvoice = settingsMap['iyzico_official_invoice'] === 'true'

      // Update payment
      await supabaseClient
        .from('payments')
        .update({
          status: 'completed',
          gateway_response: JSON.stringify(result),
        })
        .eq('id', payment.id)

      // Update invoice
      await supabaseClient
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString(),
          payment_method: paymentMethod,
          invoice_type: isOfficialInvoice ? 'official' : 'proforma',
          transaction_id: result.paymentId,
          notes: invoiceType,
        })
        .eq('id', payment.invoice_id)

      // If using wallet, deduct amount
      if (result.paidPrice) {
        const paidAmount = parseFloat(result.paidPrice)

        // Get current credit
        const { data: credit } = await supabaseClient
          .from('customer_credit')
          .select('*')
          .eq('customer_id', payment.customer_id)
          .single()

        if (credit) {
          const newBalance = credit.balance - paidAmount

          // Update credit
          await supabaseClient
            .from('customer_credit')
            .update({ balance: newBalance })
            .eq('customer_id', payment.customer_id)

          // Record transaction
          await supabaseClient
            .from('credit_transactions')
            .insert({
              customer_id: payment.customer_id,
              type: 'debit',
              amount: paidAmount,
              currency: payment.currency,
              invoice_id: payment.invoice_id,
              payment_id: payment.id,
              description: `iyzico payment for invoice ${payment.invoice.invoice_number}`,
              balance_after: newBalance,
            })
        }
      }

      // Redirect to success page
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `/payment-success?invoice=${payment.invoice_id}&payment=${payment.id}`,
        },
      })
    } else {
      console.log('❌ Payment failed:', result.errorMessage)

      // Update payment as failed
      await supabaseClient
        .from('payments')
        .update({
          status: 'failed',
          gateway_response: JSON.stringify(result),
        })
        .eq('id', payment.id)

      // Redirect to failure page
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `/payment-failed?error=${encodeURIComponent(result.errorMessage || 'Payment failed')}`,
        },
      })
    }
  } catch (error) {
    console.error('iyzico callback error:', error)

    // Redirect to error page
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `/payment-failed?error=${encodeURIComponent(error.message)}`,
      },
    })
  }
})
