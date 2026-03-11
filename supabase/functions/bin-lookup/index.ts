// BIN Numarası Sorgulama - Kart bilgilerini getir
// Deploy: supabase functions deploy bin-lookup

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

    const { bin_number } = await req.json()

    if (!bin_number || bin_number.length !== 6) {
      throw new Error('Valid 6-digit BIN number required')
    }

    console.log('🔍 Looking up BIN:', bin_number)

    // Cache'den kontrol et
    const { data: cachedBin } = await supabaseAdmin
      .from('bin_lookups')
      .select('*')
      .eq('bin_number', bin_number)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cachedBin) {
      console.log('✅ Returning cached BIN data')
      return new Response(
        JSON.stringify({
          success: true,
          bin_data: cachedBin,
          from_cache: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // iyzico'dan sorgula
    const binResult = await iyzicoRequest('/payment/bin/check', {
      locale: 'tr',
      conversationId: crypto.randomUUID(),
      binNumber: bin_number,
    })

    if (binResult.status !== 'success') {
      throw new Error(binResult.errorMessage || 'BIN lookup failed')
    }

    console.log('✅ BIN data retrieved from iyzico')

    // Cache'e kaydet
    const { data: savedBin } = await supabaseAdmin
      .from('bin_lookups')
      .upsert({
        bin_number: bin_number,
        card_type: binResult.cardType,
        card_association: binResult.cardAssociation,
        card_family: binResult.cardFamily,
        bank_name: binResult.bankName,
        bank_code: binResult.bankCode,
        commercial: binResult.commercial,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 gün
      })
      .select()
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        bin_data: savedBin,
        iyzico_data: binResult,
        from_cache: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ BIN lookup error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
