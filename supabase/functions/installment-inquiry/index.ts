// Taksit Sorgulama - Kart için taksit seçeneklerini getir
// Deploy: supabase functions deploy installment-inquiry

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      bin_number,
      price,
    } = await req.json()

    if (!bin_number || bin_number.length !== 6) {
      throw new Error('Valid 6-digit BIN number required')
    }

    if (!price || price <= 0) {
      throw new Error('Valid price required')
    }

    console.log('🔢 Querying installment options for BIN:', bin_number)

    // Cache'den kontrol et
    const { data: cachedPlans } = await supabaseAdmin
      .from('installment_plans')
      .select('*')
      .eq('bin_number', bin_number)
      .eq('base_amount', price)
      .gt('expires_at', new Date().toISOString())

    if (cachedPlans && cachedPlans.length > 0) {
      console.log('✅ Returning cached installment plans')
      return new Response(
        JSON.stringify({
          success: true,
          installment_plans: cachedPlans,
          from_cache: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // iyzico'dan sorgula
    const installmentResult = await iyzicoRequest('/payment/iyzipos/installment', {
      locale: 'tr',
      conversationId: crypto.randomUUID(),
      binNumber: bin_number,
      price: price.toFixed(2),
    })

    if (installmentResult.status !== 'success') {
      throw new Error(installmentResult.errorMessage || 'Installment query failed')
    }

    console.log('✅ Installment plans retrieved from iyzico')

    // Cache'e kaydet
    const installmentDetails = installmentResult.installmentDetails?.[0]
    if (installmentDetails && installmentDetails.installmentPrices) {
      const plansToInsert = installmentDetails.installmentPrices.map((plan: any) => ({
        bank_name: installmentDetails.bankName,
        bin_number: bin_number,
        card_family: installmentDetails.cardFamilyName,
        installment_count: plan.installmentNumber,
        installment_price: parseFloat(plan.installmentPrice),
        total_price: parseFloat(plan.totalPrice),
        base_amount: price,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 gün
      }))

      await supabaseAdmin
        .from('installment_plans')
        .insert(plansToInsert)
    }

    return new Response(
      JSON.stringify({
        success: true,
        installment_details: installmentResult.installmentDetails,
        from_cache: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Installment inquiry error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
