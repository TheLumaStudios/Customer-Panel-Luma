// Supabase Edge Function for creating iyzico subscriptions
// Otomatik abonelik başlatma - hosting satın alındığında çağrılır
// Deploy: supabase functions deploy subscription-create

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// iyzico API helper
async function iyzicoRequest(endpoint: string, payload: any) {
  const IYZICO_API_KEY = Deno.env.get('IYZICO_API_KEY')
  const IYZICO_SECRET_KEY = Deno.env.get('IYZICO_SECRET_KEY')
  const IYZICO_BASE_URL = Deno.env.get('IYZICO_BASE_URL') || 'https://api.iyzipay.com'

  const randomString = crypto.randomUUID()
  const requestString = JSON.stringify(payload)
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

    const {
      customer_id,
      hosting_id,
      hosting_package_id,
      billing_cycle = 'monthly', // monthly, quarterly, semi_annual, annual
    } = await req.json()

    console.log('📦 Creating subscription for:', { customer_id, hosting_id, hosting_package_id })

    // Müşteri bilgilerini al
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single()

    if (!customer) throw new Error('Customer not found')

    // Hosting paketi bilgilerini al
    const { data: hostingPackage } = await supabaseAdmin
      .from('hosting_packages')
      .select('*')
      .eq('id', hosting_package_id)
      .single()

    if (!hostingPackage) throw new Error('Hosting package not found')

    // Dönem bilgilerini hesapla
    const cycleConfig = {
      monthly: { count: 1, name: 'Aylık', priceField: 'monthly_price' },
      quarterly: { count: 3, name: '3 Aylık', priceField: 'quarterly_price' },
      semi_annual: { count: 6, name: '6 Aylık', priceField: 'semi_annual_price' },
      annual: { count: 12, name: 'Yıllık', priceField: 'annual_price' },
    }

    const cycle = cycleConfig[billing_cycle] || cycleConfig.monthly
    const packagePrice = hostingPackage[cycle.priceField] || hostingPackage.monthly_price

    if (!packagePrice) {
      throw new Error(`${cycle.name} fiyat bilgisi bulunamadı`)
    }

    // Abonelik planını kontrol et veya oluştur (dönem bazında)
    let { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('hosting_package_id', hosting_package_id)
      .eq('payment_interval_count', cycle.count)
      .single()

    if (!plan) {
      console.log('🆕 Creating new subscription plan in iyzico...')

      // 1. iyzico'da Product oluştur
      const productReferenceCode = `PLAN-${hostingPackage.id.substring(0, 8).toUpperCase()}`
      const productResult = await iyzicoRequest('/v2/subscription/products', {
        locale: 'tr',
        name: hostingPackage.name,
        description: hostingPackage.description || hostingPackage.name,
        productReferenceCode,
      })

      if (productResult.status !== 'success') {
        throw new Error(`iyzico product creation failed: ${productResult.errorMessage}`)
      }

      console.log('✅ Product created:', productReferenceCode)

      // 2. iyzico'da Pricing Plan oluştur
      const pricingPlanReferenceCode = `PRICE-${hostingPackage.id.substring(0, 8).toUpperCase()}-${cycle.count}M`
      const pricingResult = await iyzicoRequest('/v2/subscription/pricing-plans', {
        locale: 'tr',
        productReferenceCode,
        name: `${hostingPackage.name} - ${cycle.name}`,
        price: packagePrice.toFixed(2),
        currencyCode: 'TRY',
        paymentInterval: 'MONTHLY',
        paymentIntervalCount: cycle.count,
        trialPeriodDays: 0,
        pricingPlanReferenceCode,
        recurrenceCount: 0, // Sınırsız (0 = infinite)
      })

      if (pricingResult.status !== 'success') {
        throw new Error(`iyzico pricing plan creation failed: ${pricingResult.errorMessage}`)
      }

      console.log('✅ Pricing plan created:', pricingPlanReferenceCode)

      // 3. Database'e plan kaydet
      const { data: newPlan, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .insert({
          hosting_package_id,
          iyzico_product_reference_code: productReferenceCode,
          iyzico_pricing_plan_reference_code: pricingPlanReferenceCode,
          name: `${hostingPackage.name} - ${cycle.name}`,
          description: hostingPackage.description,
          price: packagePrice,
          currency: 'TRY',
          payment_interval: 'MONTHLY',
          payment_interval_count: cycle.count,
          trial_days: 0,
          status: 'active',
        })
        .select()
        .single()

      if (planError) throw planError
      plan = newPlan
    }

    console.log('📋 Using subscription plan:', plan.iyzico_pricing_plan_reference_code)

    // 4. Müşteri için iyzico'da abonelik başlat
    const subscriptionReferenceCode = `SUB-${customer_id.substring(0, 8).toUpperCase()}-${Date.now()}`
    const customerReferenceCode = customer.customer_code || `CUST-${customer_id.substring(0, 8).toUpperCase()}`

    const subscriptionResult = await iyzicoRequest('/v2/subscription/subscriptions', {
      locale: 'tr',
      pricingPlanReferenceCode: plan.iyzico_pricing_plan_reference_code,
      subscriptionInitialStatus: 'ACTIVE',
      subscriptionReferenceCode,
      customer: {
        name: customer.full_name?.split(' ')[0] || 'Ad',
        surname: customer.full_name?.split(' ').slice(1).join(' ') || 'Soyad',
        identityNumber: '11111111111', // Gerekli ama zorunlu değil
        email: customer.email,
        gsmNumber: customer.phone || '+905350000000',
        billingAddress: {
          contactName: customer.full_name || 'Müşteri',
          city: customer.billing_city || 'Istanbul',
          country: 'Turkey',
          address: customer.billing_address || 'Adres bilgisi yok',
          zipCode: customer.billing_postal_code || '34000',
        },
        shippingAddress: {
          contactName: customer.full_name || 'Müşteri',
          city: customer.shipping_city || customer.billing_city || 'Istanbul',
          country: 'Turkey',
          address: customer.shipping_address || customer.billing_address || 'Adres bilgisi yok',
          zipCode: customer.shipping_postal_code || customer.billing_postal_code || '34000',
        },
        customerReferenceCode,
      },
    })

    if (subscriptionResult.status !== 'success') {
      throw new Error(`iyzico subscription creation failed: ${subscriptionResult.errorMessage}`)
    }

    console.log('✅ Subscription created:', subscriptionReferenceCode)

    // 5. Database'e abonelik kaydet
    const nextPaymentDate = new Date()
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + cycle.count)

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        customer_id,
        subscription_plan_id: plan.id,
        hosting_id,
        iyzico_subscription_reference_code: subscriptionReferenceCode,
        iyzico_customer_reference_code: customerReferenceCode,
        status: 'active',
        start_date: new Date().toISOString(),
        next_payment_date: nextPaymentDate.toISOString(),
        amount: plan.price,
        currency: 'TRY',
      })
      .select()
      .single()

    if (subError) throw subError

    // 6. Hosting kaydına subscription_id ekle
    await supabaseAdmin
      .from('hosting')
      .update({ subscription_id: subscription.id })
      .eq('id', hosting_id)

    console.log('✅ Subscription saved to database')

    return new Response(
      JSON.stringify({
        success: true,
        subscription,
        iyzico_data: subscriptionResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Subscription creation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
