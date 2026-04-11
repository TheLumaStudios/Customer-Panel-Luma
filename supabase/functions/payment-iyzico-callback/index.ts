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

    // --- iyzico v2 auth signature (see payment-iyzico-init for spec) ---
    const iyzicoUri = '/payment/iyzipos/checkoutform/auth/ecom/detail'
    const randomString = crypto.randomUUID().replace(/-/g, '')
    const requestString = JSON.stringify(requestPayload)
    const dataToSign = randomString + iyzicoUri + requestString

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(IYZICO_SECRET_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBytes = new Uint8Array(
      await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign))
    )
    const signatureHex = Array.from(signatureBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const authString = `apiKey:${IYZICO_API_KEY}&randomKey:${randomString}&signature:${signatureHex}`
    const authorization = `IYZWSv2 ${base64Encode(encoder.encode(authString))}`

    // Retrieve payment result
    const response = await fetch(`${IYZICO_BASE_URL}${iyzicoUri}`, {
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

    // Frontend redirect base (falls back to relative paths)
    const APP_URL = Deno.env.get('PUBLIC_URL') || ''
    const successUrl = (invoiceId: string, paymentId: string) =>
      `${APP_URL}/payment-success?invoice=${invoiceId}&payment=${paymentId}`
    const failedUrl = (msg: string) =>
      `${APP_URL}/payment-failed?error=${encodeURIComponent(msg)}`

    // Idempotency: if this payment is already completed, short-circuit so
    // retried callbacks never double-credit a wallet or re-register a domain.
    if (payment.status === 'completed') {
      console.log('↩️ Payment already completed, skipping post-processing')
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': successUrl(payment.invoice_id, payment.id),
        },
      })
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

      // Branch on invoice item types:
      //   wallet_topup → credit the wallet
      //   domain       → trigger reseller registration
      //   hosting/vds  → no-op (admin provisions manually)
      //
      // IMPORTANT: the pre-fix version unconditionally DEBITED customer_credit
      // on every successful iyzico payment, which silently drove card-paying
      // customers' wallet balances negative. That logic is removed.
      const { data: invoiceItems } = await supabaseClient
        .from('invoice_items')
        .select('type, amount')
        .eq('invoice_id', payment.invoice_id)

      const items = invoiceItems || []
      const topUpAmount = items
        .filter((i: any) => i.type === 'wallet_topup')
        .reduce((s: number, i: any) => s + parseFloat(i.amount), 0)

      if (topUpAmount > 0) {
        // Upsert customer_credit row and record a credit transaction
        const { data: existingCredit } = await supabaseClient
          .from('customer_credit')
          .select('*')
          .eq('customer_id', payment.customer_id)
          .maybeSingle()

        const currentBalance = parseFloat(existingCredit?.balance ?? '0')
        const newBalance = currentBalance + topUpAmount

        if (existingCredit) {
          await supabaseClient
            .from('customer_credit')
            .update({ balance: newBalance })
            .eq('customer_id', payment.customer_id)
        } else {
          await supabaseClient
            .from('customer_credit')
            .insert({
              customer_id: payment.customer_id,
              balance: newBalance,
              currency: 'TRY',
            })
        }

        await supabaseClient
          .from('credit_transactions')
          .insert({
            customer_id: payment.customer_id,
            type: 'credit',
            amount: topUpAmount,
            currency: 'TRY',
            invoice_id: payment.invoice_id,
            payment_id: payment.id,
            description: `iyzico wallet top-up (invoice ${payment.invoice.invoice_number})`,
            balance_after: newBalance,
          })
      }

      const hasDomain = items.some((i: any) => i.type === 'domain')
      if (hasDomain) {
        // Mark the staged domain_orders row as awaiting reseller register.
        // Actual registration is performed by the admin/cron follow-up (the
        // contacts + nameservers were persisted at invoice-create time).
        // Keeping this out of the callback avoids blocking the 302 redirect
        // on a slow reseller API round-trip. M1 ships with manual/admin
        // registration; a follow-up milestone will auto-execute it.
        await supabaseClient
          .from('domain_orders')
          .update({ register_status: 'paid_pending_register' })
          .eq('invoice_id', payment.invoice_id)
          .eq('register_status', 'pending')
      }

      // Redirect to success page
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': successUrl(payment.invoice_id, payment.id),
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
          'Location': failedUrl(result.errorMessage || 'Payment failed'),
        },
      })
    }
  } catch (error) {
    console.error('iyzico callback error:', error)

    const APP_URL = Deno.env.get('PUBLIC_URL') || ''
    // Redirect to error page
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${APP_URL}/payment-failed?error=${encodeURIComponent((error as Error).message)}`,
      },
    })
  }
})
