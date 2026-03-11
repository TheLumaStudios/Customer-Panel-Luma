// Kayıtlı Kart Ekleme - Tek tıkla ödeme için kart kaydet
// Deploy: supabase functions deploy saved-card-add

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
      card_alias,
      card_holder_name,
      card_number,
      expire_month,
      expire_year,
      cvc,
    } = await req.json()

    console.log('💳 Saving card for user:', user.id)

    // Müşteri bilgilerini al
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!customer) throw new Error('Customer not found')

    // Müşterinin cardUserKey'i var mı kontrol et
    let cardUserKey = customer.card_user_key

    if (!cardUserKey) {
      // İlk kart kaydı - cardUserKey oluştur
      cardUserKey = `CARD-USER-${user.id.substring(0, 8).toUpperCase()}`
      await supabaseAdmin
        .from('customers')
        .update({ card_user_key: cardUserKey })
        .eq('id', user.id)
    }

    // iyzico'ya kartı kaydet
    const cardResult = await iyzicoRequest('/cardstorage/card', {
      locale: 'tr',
      conversationId: crypto.randomUUID(),
      email: customer.email,
      externalId: cardUserKey,
      card: {
        cardAlias: card_alias,
        cardHolderName: card_holder_name,
        cardNumber: card_number,
        expireMonth: expire_month,
        expireYear: expire_year,
        cvc: cvc,
      },
    })

    if (cardResult.status !== 'success') {
      throw new Error(cardResult.errorMessage || 'Card registration failed')
    }

    console.log('✅ Card saved to iyzico')

    // Database'e kart bilgilerini kaydet
    const { data: savedCard, error: cardError } = await supabaseAdmin
      .from('saved_cards')
      .insert({
        customer_id: user.id,
        card_token: cardResult.cardToken,
        card_user_key: cardUserKey,
        card_alias: cardResult.cardAlias,
        bin_number: cardResult.binNumber,
        last_four_digits: cardResult.lastFourDigits,
        card_type: cardResult.cardType,
        card_association: cardResult.cardAssociation,
        card_family: cardResult.cardFamily,
        bank_name: cardResult.bankName,
        is_default: false,
        status: 'active',
      })
      .select()
      .single()

    if (cardError) throw cardError

    console.log('✅ Card saved to database')

    return new Response(
      JSON.stringify({
        success: true,
        card: savedCard,
        iyzico_data: cardResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Card save error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
