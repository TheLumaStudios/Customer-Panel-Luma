// Tami Sanal POS (Garanti BBVA) — Ödeme, İptal, İade, BIN/Taksit Sorgulama
// Endpoint: POST /functions/v1/tami-payment
//
// Actions:
//   auth           — NonSecure direkt ödeme
//   auth_3ds       — 3D Secure ödeme başlat (HTML form döner)
//   reverse        — İptal / İade
//   bin_info       — BIN sorgulama
//   installment_info — Taksit seçenekleri

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

// Base64URL encode
function b64url(input: ArrayBuffer | string): string {
  let bytes: Uint8Array
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input)
  } else {
    bytes = new Uint8Array(input)
  }
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Base64URL decode
function b64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, c => c.charCodeAt(0))
}

// PG-Auth-Token: SHA-256(merchantNumber + terminalNumber + apiKey) → hex
// Format: "MerchantNumber:TerminalNumber:HexHash"
async function buildAuthToken(merchantNumber: string, terminalNumber: string, apiKey: string): Promise<string> {
  const data = merchantNumber + terminalNumber + apiKey
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  const hashHex = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${merchantNumber}:${terminalNumber}:${hashHex}`
}

// securityHash: JWT HS512 ile imzalanmış request body (securityHash alanı hariç)
async function buildSecurityHash(payload: object, k: string, kid: string): Promise<string> {
  const header = { alg: 'HS512', typ: 'JWT', kid }
  const headerB64 = b64url(JSON.stringify(header))
  const payloadB64 = b64url(JSON.stringify(payload))
  const sigInput = `${headerB64}.${payloadB64}`

  const keyBytes = b64urlDecode(k)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(sigInput))
  return `${sigInput}.${b64url(sig)}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    // Auth kontrolü
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Yetkisiz' }, 401)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) return json({ error: 'Yetkisiz' }, 401)

    const body = await req.json()
    const {
      action = 'auth_3ds',
      invoice_id,
      card_pan,
      card_expiry_month,
      card_expiry_year,
      card_cvv,
      card_holder,
      installment_count = 1,
      callback_url,
      refund_amount,
      bin_number,
    } = body

    // Tami kimlik bilgilerini system_settings'ten çek
    const { data: settingsRows } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'tami_merchant_number',
        'tami_terminal_number',
        'tami_api_key',
        'tami_key_id',
        'tami_test_mode',
      ])

    const cfg: Record<string, string> = {}
    settingsRows?.forEach(r => { cfg[r.setting_key] = r.setting_value })

    const merchantNumber = cfg['tami_merchant_number'] || ''
    const terminalNumber = cfg['tami_terminal_number'] || ''
    const apiKey = cfg['tami_api_key'] || ''       // JWK "k" değeri (base64url)
    const keyId = cfg['tami_key_id'] || ''          // JWK "kid" değeri
    const testMode = cfg['tami_test_mode'] !== 'false'

    if (!merchantNumber || !terminalNumber || !apiKey || !keyId) {
      return json({ error: 'Tami kimlik bilgileri eksik. Ödeme Yöntemleri sayfasından doldurun.' }, 400)
    }

    const baseUrl = testMode
      ? 'https://sandbox-paymentapi.tami.com.tr'
      : 'https://paymentapi.tami.com.tr'

    const correlationId = `Correlation${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    const authToken = await buildAuthToken(merchantNumber, terminalNumber, apiKey)

    const tamiHeaders = {
      'Content-Type': 'application/json',
      'PG-Api-Version': 'v3',
      'PG-Auth-Token': authToken,
      'correlationId': correlationId,
    }

    // ─── BIN Sorgulama ────────────────────────────────────────────────────────
    if (action === 'bin_info') {
      if (!bin_number) return json({ error: 'bin_number gerekli' }, 400)
      const reqBody = { binNumber: parseInt(String(bin_number).slice(0, 8)), securityHash: '' }
      reqBody.securityHash = await buildSecurityHash(
        { binNumber: reqBody.binNumber },
        apiKey, keyId
      )
      const resp = await fetch(`${baseUrl}/installment/bin-info`, {
        method: 'POST',
        headers: tamiHeaders,
        body: JSON.stringify(reqBody),
      })
      const result = await resp.json()
      return json(result)
    }

    // ─── Taksit Sorgulama ─────────────────────────────────────────────────────
    if (action === 'installment_info') {
      if (!bin_number) return json({ error: 'bin_number gerekli' }, 400)
      const reqPayload = { binNumber: parseInt(String(bin_number).slice(0, 8)) }
      const securityHash = await buildSecurityHash(reqPayload, apiKey, keyId)
      const resp = await fetch(`${baseUrl}/installment/installment-info`, {
        method: 'POST',
        headers: tamiHeaders,
        body: JSON.stringify({ ...reqPayload, securityHash }),
      })
      const result = await resp.json()
      return json(result)
    }

    // Fatura gerektiren işlemler için invoice_id zorunlu
    if (!invoice_id) return json({ error: 'invoice_id gerekli' }, 400)

    const { data: invoice, error: invError } = await supabaseAdmin
      .from('invoices')
      .select('*, customers(profile_id, email)')
      .eq('id', invoice_id)
      .single()

    if (invError || !invoice) return json({ error: 'Fatura bulunamadı' }, 404)

    // Sahiplik kontrolü
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin' || profile?.role === 'employee'
    if (!isAdmin && invoice.customers?.profile_id !== user.id) {
      return json({ error: 'Bu faturaya erişim izniniz yok' }, 403)
    }

    const amount = parseFloat(invoice.total ?? invoice.total_amount ?? 0)
    const orderId = invoice.id.replace(/-/g, '').slice(0, 36)

    // ─── İptal / İade (Reverse) ───────────────────────────────────────────────
    if (action === 'reverse') {
      const reqPayload: Record<string, unknown> = {
        orderId,
        reason: 'Müşteri talebi',
      }
      if (refund_amount) reqPayload.amount = parseFloat(refund_amount).toString()

      const securityHash = await buildSecurityHash(reqPayload, apiKey, keyId)
      const resp = await fetch(`${baseUrl}/payment/reverse`, {
        method: 'POST',
        headers: tamiHeaders,
        body: JSON.stringify({ ...reqPayload, securityHash }),
      })
      const result = await resp.json()
      const success = result.success === true

      if (success) {
        const isPartial = refund_amount && parseFloat(refund_amount) < amount
        await supabaseAdmin.from('invoices').update({
          status: isPartial ? 'partial_refund' : 'refunded',
        }).eq('id', invoice_id)
        await supabaseAdmin.from('payments').update({ status: 'refunded' }).eq('invoice_id', invoice_id)
      }
      return json({ success, result, error: success ? null : (result.errorMessage || 'İşlem başarısız') })
    }

    // Mükerrer ödeme kontrolü
    if (invoice.status === 'paid') return json({ error: 'Bu fatura zaten ödenmiş' }, 400)
    if (!card_pan || !card_expiry_month || !card_expiry_year) {
      return json({ error: 'Kart bilgileri eksik' }, 400)
    }

    const buyerIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '85.34.78.112'

    const baseReqPayload: Record<string, unknown> = {
      orderId,
      amount: amount.toString(),
      currency: invoice.currency || 'TRY',
      installmentCount,
      card: {
        number: card_pan.replace(/\s/g, ''),
        cvv: card_cvv || '',
        expireMonth: String(card_expiry_month).padStart(2, '0'),
        expireYear: String(card_expiry_year),
        holderName: card_holder || 'Kart Sahibi',
      },
      buyer: {
        ip: buyerIp,
        id: user.id,
        name: invoice.customers?.email || user.email || 'musteri',
        email: user.email || invoice.customers?.email || 'noreply@example.com',
        phone: '',
      },
    }

    // ─── NonSecure Ödeme (auth) ───────────────────────────────────────────────
    if (action === 'auth') {
      const securityHash = await buildSecurityHash(baseReqPayload, apiKey, keyId)
      const resp = await fetch(`${baseUrl}/payment/auth`, {
        method: 'POST',
        headers: tamiHeaders,
        body: JSON.stringify({ ...baseReqPayload, securityHash }),
      })
      const result = await resp.json()
      const success = result.success === true

      if (success) {
        const { data: customerRow } = await supabaseAdmin
          .from('customers').select('id').eq('profile_id', user.id).maybeSingle()
        await supabaseAdmin.from('payments').insert({
          customer_id: customerRow?.id ?? invoice.customer_id,
          invoice_id,
          amount,
          payment_method: 'tami',
          gateway_transaction_id: result.bankReferenceNumber,
          status: 'completed',
          metadata: {
            bank_auth_code: result.bankAuthCode,
            bank_ref: result.bankReferenceNumber,
            correlation_id: correlationId,
          },
        })
        await supabaseAdmin.from('invoices').update({
          status: 'paid',
          payment_date: new Date().toISOString(),
          payment_method: 'tami',
          transaction_id: result.bankReferenceNumber,
        }).eq('id', invoice_id)
      }

      return json({
        success,
        bank_auth_code: result.bankAuthCode,
        bank_ref: result.bankReferenceNumber,
        error: success ? null : (result.errorMessage || 'Ödeme başarısız'),
      })
    }

    // ─── 3D Secure Ödeme (auth_3ds) ───────────────────────────────────────────
    const callbackEndpoint = callback_url
      || `${Deno.env.get('SUPABASE_URL')}/functions/v1/tami-callback`

    const req3dsPayload = {
      ...baseReqPayload,
      callbackUrl: callbackEndpoint,
    }
    const securityHash = await buildSecurityHash(req3dsPayload, apiKey, keyId)

    const resp = await fetch(`${baseUrl}/payment/auth`, {
      method: 'POST',
      headers: tamiHeaders,
      body: JSON.stringify({ ...req3dsPayload, securityHash }),
    })
    const result = await resp.json()

    if (!result.success && !result.htmlContent) {
      return json({
        success: false,
        error: result.errorMessage || 'Tami 3D başlatılamadı',
      })
    }

    // HTML içeriği Base64 decode edip döndür
    let htmlContent = ''
    if (result.htmlContent) {
      try {
        htmlContent = atob(result.htmlContent)
      } catch {
        htmlContent = result.htmlContent
      }
    }

    // Pending payment kaydı
    const { data: customerRow } = await supabaseAdmin
      .from('customers').select('id').eq('profile_id', user.id).maybeSingle()
    await supabaseAdmin.from('payments').insert({
      customer_id: customerRow?.id ?? invoice.customer_id,
      invoice_id,
      amount,
      payment_method: 'tami',
      gateway_transaction_id: orderId,
      status: 'pending',
      notes: `Tami 3DS başlatıldı: ${correlationId}`,
    })

    return json({
      success: true,
      htmlContent,
      orderId,
      correlationId,
    })

  } catch (err) {
    console.error('tami-payment error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
