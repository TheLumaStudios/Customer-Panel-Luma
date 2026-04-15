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
    const successUrl = (invoiceId: string, paymentId: string, extra = '') =>
      `${APP_URL}/payment-success?invoice=${invoiceId}&payment=${paymentId}${extra}`
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

      // --- Kart bilgisini kaydet (3D'siz sonraki ödemeler için) ---
      if (result.cardUserKey && result.paymentItems?.[0]?.cardToken) {
        try {
          const cardAssociation = result.cardAssociation || ''
          const cardFamily = result.cardFamily || ''
          const lastFour = result.binNumber ? result.binNumber.slice(-4) : '****'
          const cardAlias = `${cardAssociation} ${cardFamily} *${lastFour}`

          await supabaseClient
            .from('saved_cards')
            .upsert({
              customer_id: payment.customer_id,
              card_user_key: result.cardUserKey,
              card_token: result.paymentItems[0].cardToken,
              card_alias: cardAlias,
              last_four_digits: lastFour,
              card_type: result.cardType || '',
              card_association: cardAssociation,
              card_family: cardFamily,
              bin_number: result.binNumber || '',
              status: 'active',
            }, { onConflict: 'customer_id,card_token' })

          console.log('💳 Card saved for future payments:', cardAlias)
        } catch (cardErr) {
          console.error('Card save failed (non-fatal):', cardErr)
        }
      }

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
        // --- Wallet bonus: check wallet_bonus_tiers for matching bracket ---
        let bonusAmount = 0
        try {
          const { data: tiers } = await supabaseClient
            .from('wallet_bonus_tiers')
            .select('*')
            .eq('is_active', true)
            .lte('min_amount', topUpAmount)
            .order('min_amount', { ascending: false })
            .limit(1)

          const tier = tiers?.[0]
          if (tier && (tier.max_amount === null || topUpAmount <= parseFloat(tier.max_amount))) {
            bonusAmount = tier.bonus_percentage > 0
              ? Math.round(topUpAmount * parseFloat(tier.bonus_percentage)) / 100
              : parseFloat(tier.bonus_fixed) || 0
          }
        } catch (bonusErr) {
          console.error('Bonus tier lookup failed (non-fatal):', bonusErr)
        }

        const totalCredit = topUpAmount + bonusAmount

        // Upsert customer_credit row and record a credit transaction
        const { data: existingCredit } = await supabaseClient
          .from('customer_credit')
          .select('*')
          .eq('customer_id', payment.customer_id)
          .maybeSingle()

        const currentBalance = parseFloat(existingCredit?.balance ?? '0')
        const newBalance = currentBalance + totalCredit

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
            description: `Bakiye yükleme (fatura ${payment.invoice.invoice_number})`,
            balance_after: currentBalance + topUpAmount,
          })

        // Record bonus as separate transaction
        if (bonusAmount > 0) {
          await supabaseClient
            .from('credit_transactions')
            .insert({
              customer_id: payment.customer_id,
              type: 'credit',
              amount: bonusAmount,
              currency: 'TRY',
              invoice_id: payment.invoice_id,
              description: `Bonus bakiye (%${Math.round(bonusAmount / topUpAmount * 100)})`,
              balance_after: newBalance,
            })
          console.log(`🎁 Wallet bonus: +${bonusAmount} TRY for ${topUpAmount} TRY top-up`)
        }
      }

      // --- Cashback: %5 of non-wallet payments credited to wallet ---
      const nonWalletTotal = items
        .filter((i: any) => i.type !== 'wallet_topup')
        .reduce((s: number, i: any) => s + parseFloat(i.amount), 0)

      if (nonWalletTotal > 0) {
        try {
          // Get cashback rate from system_settings
          const { data: cbSetting } = await supabaseClient
            .from('system_settings')
            .select('setting_value')
            .eq('setting_key', 'cashback_rate')
            .maybeSingle()

          const cashbackRate = parseFloat(cbSetting?.setting_value || '5')
          if (cashbackRate > 0) {
            const cashbackAmount = Math.round(nonWalletTotal * cashbackRate) / 100

            if (cashbackAmount > 0) {
              const { data: cbCredit } = await supabaseClient
                .from('customer_credit')
                .select('balance')
                .eq('customer_id', payment.customer_id)
                .maybeSingle()

              const cbBalance = parseFloat(cbCredit?.balance ?? '0') + cashbackAmount

              if (cbCredit) {
                await supabaseClient
                  .from('customer_credit')
                  .update({ balance: cbBalance })
                  .eq('customer_id', payment.customer_id)
              } else {
                await supabaseClient
                  .from('customer_credit')
                  .insert({ customer_id: payment.customer_id, balance: cbBalance, currency: 'TRY' })
              }

              await supabaseClient
                .from('credit_transactions')
                .insert({
                  customer_id: payment.customer_id,
                  type: 'credit',
                  amount: cashbackAmount,
                  currency: 'TRY',
                  invoice_id: payment.invoice_id,
                  description: `Cashback (%${cashbackRate}) - Fatura ${payment.invoice.invoice_number}`,
                  balance_after: cbBalance,
                })

              console.log(`💰 Cashback: +${cashbackAmount} TRY (${cashbackRate}% of ${nonWalletTotal})`)
            }
          }
        } catch (cbErr) {
          console.error('Cashback processing failed (non-fatal):', cbErr)
        }
      }

      // --- Referral reward: if payer has referred_by and this is first paid invoice ---
      try {
        // Find customer's profile_id from customer record
        const { data: customerRec } = await supabaseClient
          .from('customers')
          .select('profile_id')
          .eq('id', payment.customer_id)
          .single()

        if (customerRec?.profile_id) {
          const { data: payerProfile } = await supabaseClient
            .from('profiles')
            .select('id, referred_by')
            .eq('id', customerRec.profile_id)
            .single()

          if (payerProfile?.referred_by) {
            // Check if this is the first paid invoice for this customer
            const { count: paidCount } = await supabaseClient
              .from('invoices')
              .select('id', { count: 'exact', head: true })
              .eq('customer_id', payment.customer_id)
              .eq('status', 'paid')

            // paidCount will be 1 because we just updated this invoice to 'paid'
            if (paidCount === 1) {
              const invoiceTotal = parseFloat(payment.invoice?.total || payment.invoice?.total_amount || 0)
              const rewardAmount = Math.round(invoiceTotal * 10) / 100 // 10%

              if (rewardAmount > 0) {
                // Insert referral reward
                await supabaseClient.from('referral_rewards').insert({
                  referrer_id: payerProfile.referred_by,
                  referred_id: payerProfile.id,
                  invoice_id: payment.invoice_id,
                  invoice_total: invoiceTotal,
                  reward_amount: rewardAmount,
                  reward_status: 'credited',
                })

                // Credit referrer's wallet
                // Find referrer's customer_id
                const { data: referrerCustomer } = await supabaseClient
                  .from('customers')
                  .select('id')
                  .eq('profile_id', payerProfile.referred_by)
                  .maybeSingle()

                if (referrerCustomer) {
                  const { data: refCredit } = await supabaseClient
                    .from('customer_credit')
                    .select('balance')
                    .eq('customer_id', referrerCustomer.id)
                    .maybeSingle()

                  const refBalance = parseFloat(refCredit?.balance ?? '0') + rewardAmount

                  if (refCredit) {
                    await supabaseClient
                      .from('customer_credit')
                      .update({ balance: refBalance })
                      .eq('customer_id', referrerCustomer.id)
                  } else {
                    await supabaseClient
                      .from('customer_credit')
                      .insert({ customer_id: referrerCustomer.id, balance: refBalance, currency: 'TRY' })
                  }

                  await supabaseClient.from('credit_transactions').insert({
                    customer_id: referrerCustomer.id,
                    type: 'credit',
                    amount: rewardAmount,
                    currency: 'TRY',
                    description: `Referans ödülü (%10) - Fatura #${payment.invoice?.invoice_number || payment.invoice_id}`,
                    balance_after: refBalance,
                  })

                  console.log(`🎁 Referral reward: ${rewardAmount} TRY credited to referrer`)
                }
              }
            }
          }
        }
      } catch (refErr) {
        console.error('Referral reward error (non-fatal):', refErr)
      }

      const hasDomain = items.some((i: any) => i.type === 'domain')
      if (hasDomain) {
        await supabaseClient
          .from('domain_orders')
          .update({ register_status: 'paid_pending_register' })
          .eq('invoice_id', payment.invoice_id)
          .eq('register_status', 'pending')
      }

      // VDS/VPS siparişleri: ödeme sonrası admin onayı için kuyruğa al
      const hasVds = items.some((i: any) => i.type === 'vds')
      if (hasVds) {
        // Check if vds_orders row already exists (created at invoice time)
        const { data: existingVdsOrder } = await supabaseClient
          .from('vds_orders')
          .select('id')
          .eq('invoice_id', payment.invoice_id)
          .eq('order_status', 'pending')
          .maybeSingle()

        if (existingVdsOrder) {
          // Update existing order to paid_pending (awaiting admin approval)
          await supabaseClient
            .from('vds_orders')
            .update({ order_status: 'paid_pending', updated_at: new Date().toISOString() })
            .eq('invoice_id', payment.invoice_id)
            .eq('order_status', 'pending')
        } else {
          // Create vds_orders row from invoice items
          const vdsItems = items.filter((i: any) => i.type === 'vds')
          for (const item of vdsItems) {
            await supabaseClient
              .from('vds_orders')
              .insert({
                invoice_id: payment.invoice_id,
                customer_id: payment.customer_id,
                package_name: (item as any).description || 'VDS',
                monthly_price: parseFloat((item as any).amount) || 0,
                order_status: 'paid_pending',
              })
          }
        }
        console.log('📦 VDS order(s) queued for admin approval')
      }

      // Check if this is an email promo campaign invoice (extract domain from item description)
      let extraParams = ''
      const emailPromoItem = items.find((i: any) =>
        (i.description || '').includes('Kurumsal E-Posta')
      )
      if (emailPromoItem) {
        // Extract domain from description like "Kurumsal E-Posta Aktivasyon - example.com"
        const domainMatch = (emailPromoItem.description || '').match(/- (.+?)(?:\s*\(|$)/)
        if (domainMatch?.[1]) {
          extraParams = `&promo_domain=${encodeURIComponent(domainMatch[1].trim())}`
        }
      }

      // Redirect to success page
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': successUrl(payment.invoice_id, payment.id, extraParams),
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
