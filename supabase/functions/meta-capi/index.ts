// Meta Conversions API (CAPI) - Sunucu tarafı event gönderimi
// Browser pixel ile birlikte çalışır, event_id ile tekrar sayımı önler
//
// Deploy: supabase functions deploy meta-capi
// Secrets: supabase secrets set META_CAPI_TOKEN=EAAo... META_PIXEL_ID=1640464277232430

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SHA-256 hash (Meta'nın gerektirdiği format: lowercase trim → hex)
async function sha256(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase()
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Telefon numarasını E.164 formatına normalize et
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '90' + digits.slice(1)
  if (!digits.startsWith('90') && digits.length === 10) return '90' + digits
  return digits
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const accessToken = Deno.env.get('META_CAPI_TOKEN')
    const pixelId = Deno.env.get('META_PIXEL_ID') || '1640464277232430'

    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'META_CAPI_TOKEN not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()

    const {
      event_name,          // 'Purchase', 'AddToCart', 'ViewContent', vs.
      event_id,            // Tarayıcı pixel ile dedup için aynı ID
      event_source_url,    // Sayfa URL'si
      // Kullanıcı bilgileri (hash'lenecek)
      email,
      phone,
      first_name,
      last_name,
      gender,              // 'm' veya 'f'
      // Tarayıcı bilgileri (hash'lenmez)
      client_user_agent,
      client_ip_address,
      fbp,                 // _fbp cookie
      fbc,                 // _fbc cookie
      // Event'e özel veriler
      custom_data = {},
    } = body

    if (!event_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'event_name required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Kullanıcı verisini hash'le
    const user_data: Record<string, unknown> = {}

    if (email) user_data.em = [await sha256(email)]
    if (phone) user_data.ph = [await sha256(normalizePhone(phone))]
    if (first_name) user_data.fn = [await sha256(first_name)]
    if (last_name) user_data.ln = [await sha256(last_name)]
    if (gender) user_data.ge = [await sha256(gender.toLowerCase().charAt(0))]

    // Hash'lenmeyenler
    if (client_user_agent) user_data.client_user_agent = client_user_agent
    if (client_ip_address) user_data.client_ip_address = client_ip_address
    if (fbp) user_data.fbp = fbp
    if (fbc) user_data.fbc = fbc

    const eventPayload = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: event_source_url || 'https://lumayazilim.com',
      event_id: event_id || crypto.randomUUID(),
      user_data,
      ...(Object.keys(custom_data).length > 0 ? { custom_data } : {}),
    }

    const metaRes = await fetch(
      `https://graph.facebook.com/v25.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [eventPayload],
          access_token: accessToken,
        }),
      }
    )

    const result = await metaRes.json()
    console.log(`CAPI ${event_name}:`, JSON.stringify(result))

    if (result.error) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, events_received: result.events_received }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('meta-capi error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
