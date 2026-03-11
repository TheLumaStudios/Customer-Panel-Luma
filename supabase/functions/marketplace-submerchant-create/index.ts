// Pazaryeri Alt Üye İşyeri Oluşturma
// Deploy: supabase functions deploy marketplace-submerchant-create

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

    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Only admins can create submerchants')
    }

    const {
      name,
      email,
      type, // PERSONAL, PRIVATE_COMPANY, LIMITED_OR_JOINT_STOCK_COMPANY
      contact_name,
      contact_surname,
      phone,
      address,
      iban,
      identity_number,
      tax_office,
      tax_number,
      commission_rate = 0,
    } = await req.json()

    console.log('🏢 Creating submerchant:', name)

    // iyzico'ya alt üye işyeri oluştur
    const submerchantKey = `SUBM-${crypto.randomUUID().substring(0, 8).toUpperCase()}`

    const submerchantPayload: any = {
      locale: 'tr',
      conversationId: crypto.randomUUID(),
      subMerchantExternalId: submerchantKey,
      subMerchantType: type || 'PRIVATE_COMPANY',
      address: address,
      contactName: contact_name,
      contactSurname: contact_surname,
      email: email,
      gsmNumber: phone,
      name: name,
      iban: iban,
    }

    // Tip'e göre gerekli alanları ekle
    if (type === 'PERSONAL') {
      submerchantPayload.identityNumber = identity_number
    } else if (type === 'PRIVATE_COMPANY' || type === 'LIMITED_OR_JOINT_STOCK_COMPANY') {
      submerchantPayload.taxOffice = tax_office
      submerchantPayload.taxNumber = tax_number || identity_number
    }

    const submerchantResult = await iyzicoRequest('/onboarding/submerchant', submerchantPayload)

    if (submerchantResult.status !== 'success') {
      throw new Error(submerchantResult.errorMessage || 'Submerchant creation failed')
    }

    console.log('✅ Submerchant created in iyzico')

    // Database'e kaydet
    const { data: submerchant, error: subError } = await supabaseAdmin
      .from('marketplace_submerchants')
      .insert({
        name,
        email,
        iyzico_submerchant_key: submerchantKey,
        iyzico_submerchant_type: type,
        commission_rate,
        iban,
        contact_name,
        contact_surname,
        phone,
        address,
        identity_number,
        tax_office,
        tax_number,
        status: 'active',
        iyzico_response: submerchantResult,
      })
      .select()
      .single()

    if (subError) throw subError

    console.log('✅ Submerchant saved to database')

    return new Response(
      JSON.stringify({
        success: true,
        submerchant,
        iyzico_data: submerchantResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Submerchant creation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
