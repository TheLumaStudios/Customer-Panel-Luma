// Supabase Edge Function for iyzico subscription webhook
// Otomatik ödeme bildirimleri - her aylık ödemede otomatik fatura oluşturur
// Deploy: supabase functions deploy subscription-webhook

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // iyzico webhook verisini al
    const webhookData = await req.json()

    console.log('📥 Subscription webhook received:', webhookData.event)

    const {
      subscriptionReferenceCode,
      paidPrice,
      currency,
      paymentStatus,
      iyziEventType,
      iyziEventTime,
    } = webhookData

    // Aboneliği bul
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        customer:customers(*),
        plan:subscription_plans(*),
        hosting:hosting(*)
      `)
      .eq('iyzico_subscription_reference_code', subscriptionReferenceCode)
      .single()

    if (subError || !subscription) {
      console.error('❌ Subscription not found:', subscriptionReferenceCode)
      throw new Error('Subscription not found')
    }

    console.log('✅ Subscription found:', subscription.id)

    // Ödeme durumuna göre işlem yap
    if (iyziEventType === 'subscription.order.success' && paymentStatus === 'SUCCESS') {
      console.log('💰 Processing successful payment...')

      // Sistem ayarlarını al
      const { data: settings } = await supabaseAdmin
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

      // 1. Fatura oluştur
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert({
          customer_id: subscription.customer_id,
          status: 'paid',
          subtotal: parseFloat(paidPrice),
          tax: 0,
          total: parseFloat(paidPrice),
          total_amount: parseFloat(paidPrice),
          currency: currency || 'TRY',
          invoice_type: isOfficialInvoice ? 'official' : 'proforma',
          payment_method: paymentMethod,
          paid_date: new Date().toISOString(),
          notes: `${invoiceType} - Otomatik abonelik ödemesi: ${subscription.plan.name}`,
          due_date: new Date().toISOString(),
        })
        .select()
        .single()

      if (invoiceError) {
        console.error('❌ Invoice creation failed:', invoiceError)
        throw invoiceError
      }

      // 2. Fatura kalemleri ekle
      await supabaseAdmin
        .from('invoice_items')
        .insert({
          invoice_id: invoice.id,
          type: 'subscription',
          description: `${subscription.plan.name} - Abonelik Ödemesi`,
          quantity: 1,
          unit_price: parseFloat(paidPrice),
          amount: parseFloat(paidPrice),
          total_price: parseFloat(paidPrice),
          total: parseFloat(paidPrice),
          service_id: subscription.hosting_id,
          service_type: 'hosting',
        })

      console.log('✅ Invoice created:', invoice.invoice_number)

      // 3. Ödeme kaydı oluştur
      await supabaseAdmin
        .from('subscription_payments')
        .insert({
          subscription_id: subscription.id,
          invoice_id: invoice.id,
          iyzico_payment_id: webhookData.paymentId,
          amount: parseFloat(paidPrice),
          currency: currency || 'TRY',
          status: 'success',
          payment_date: new Date(iyziEventTime).toISOString(),
          webhook_data: webhookData,
        })

      // 4. Abonelik istatistiklerini güncelle
      const nextPaymentDate = new Date()
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + (subscription.plan.payment_interval_count || 1))

      await supabaseAdmin
        .from('subscriptions')
        .update({
          successful_payment_count: (subscription.successful_payment_count || 0) + 1,
          total_paid: (subscription.total_paid || 0) + parseFloat(paidPrice),
          next_payment_date: nextPaymentDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      console.log('✅ Subscription updated, next payment:', nextPaymentDate.toISOString())

      // 5. Müşteriye e-posta gönder (opsiyonel - daha sonra eklenebilir)
      // await sendEmail(subscription.customer.email, 'Ödeme Başarılı', ...)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment processed successfully',
          invoice_number: invoice.invoice_number,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )

    } else if (iyziEventType === 'subscription.order.fail' || paymentStatus === 'FAILURE') {
      console.log('❌ Processing failed payment...')

      // 1. Başarısız ödeme kaydı
      await supabaseAdmin
        .from('subscription_payments')
        .insert({
          subscription_id: subscription.id,
          iyzico_payment_id: webhookData.paymentId,
          amount: parseFloat(paidPrice || 0),
          currency: currency || 'TRY',
          status: 'failed',
          payment_date: new Date(iyziEventTime).toISOString(),
          error_message: webhookData.errorMessage || 'Payment failed',
          error_code: webhookData.errorCode,
          webhook_data: webhookData,
        })

      // 2. Abonelik durumunu güncelle
      await supabaseAdmin
        .from('subscriptions')
        .update({
          failed_payment_count: (subscription.failed_payment_count || 0) + 1,
          status: (subscription.failed_payment_count || 0) >= 2 ? 'payment_failed' : subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      console.log('⚠️ Failed payment recorded')

      // 3. Müşteriye uyarı e-postası gönder
      // await sendEmail(subscription.customer.email, 'Ödeme Başarısız', ...)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Failed payment recorded',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )

    } else if (iyziEventType === 'subscription.cancelled') {
      console.log('🚫 Subscription cancelled')

      // Abonelik iptal edilmiş
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'cancelled',
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Subscription cancelled',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Diğer event tipleri için sadece log
    console.log('ℹ️ Event processed:', iyziEventType)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Event received',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
