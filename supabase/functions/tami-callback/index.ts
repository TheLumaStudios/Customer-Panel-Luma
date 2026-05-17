// Tami 3D Secure Callback
// Banka, 3D doğrulaması tamamlandıktan sonra bu endpoint'e POST eder.
// Tami'ye complete-3ds gönderilir, sonuç DB'ye yazılır, kullanıcı yönlendirilir.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://panel.lumahosting.com.tr'

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

function b64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, c => c.charCodeAt(0))
}

async function buildSecurityHash(payload: object, k: string, kid: string): Promise<string> {
  const header = { alg: 'HS512', typ: 'JWT', kid }
  const headerB64 = b64url(JSON.stringify(header))
  const payloadB64 = b64url(JSON.stringify(payload))
  const sigInput = `${headerB64}.${payloadB64}`
  const keyBytes = b64urlDecode(k)
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(sigInput))
  return `${sigInput}.${b64url(sig)}`
}

async function buildAuthToken(merchantNumber: string, terminalNumber: string, apiKey: string): Promise<string> {
  const data = merchantNumber + terminalNumber + apiKey
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  const hashHex = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${merchantNumber}:${terminalNumber}:${hashHex}`
}

serve(async (req) => {
  // Banka hem GET hem POST gönderebilir
  let orderId = ''
  let bankStatus = ''

  if (req.method === 'POST') {
    try {
      const ct = req.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const body = await req.json()
        orderId = body.orderId || body.order_id || ''
        bankStatus = body.status || ''
      } else {
        const form = await req.formData()
        orderId = form.get('orderId')?.toString() || form.get('order_id')?.toString() || ''
        bankStatus = form.get('status')?.toString() || ''
      }
    } catch {
      const text = await req.text().catch(() => '')
      const params = new URLSearchParams(text)
      orderId = params.get('orderId') || params.get('order_id') || ''
      bankStatus = params.get('status') || ''
    }
  } else {
    const url = new URL(req.url)
    orderId = url.searchParams.get('orderId') || url.searchParams.get('order_id') || ''
    bankStatus = url.searchParams.get('status') || ''
  }

  const redirectFail = () => Response.redirect(`${FRONTEND_URL}/payment-failed`, 302)
  const redirectOk = () => Response.redirect(`${FRONTEND_URL}/payment-success`, 302)

  if (!orderId) return redirectFail()

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // OrderId = invoice_id'nin UUID kısmı (tirelersiz, ilk 32 karakter)
    // Önce payment kaydından invoice'ı bul
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('invoice_id, amount')
      .eq('gateway_transaction_id', orderId)
      .eq('status', 'pending')
      .maybeSingle()

    if (!payment) {
      console.error('tami-callback: payment not found for orderId', orderId)
      return redirectFail()
    }

    // Tami credentials
    const { data: settingsRows } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['tami_merchant_number', 'tami_terminal_number', 'tami_api_key', 'tami_key_id', 'tami_test_mode'])

    const cfg: Record<string, string> = {}
    settingsRows?.forEach(r => { cfg[r.setting_key] = r.setting_value })

    const merchantNumber = cfg['tami_merchant_number'] || ''
    const terminalNumber = cfg['tami_terminal_number'] || ''
    const apiKey = cfg['tami_api_key'] || ''
    const keyId = cfg['tami_key_id'] || ''
    const testMode = cfg['tami_test_mode'] !== 'false'
    const baseUrl = testMode ? 'https://sandbox-paymentapi.tami.com.tr' : 'https://paymentapi.tami.com.tr'

    const correlationId = `Correlation${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    const authToken = await buildAuthToken(merchantNumber, terminalNumber, apiKey)

    // complete-3ds çağrısı
    const completePayload = { orderId }
    const securityHash = await buildSecurityHash(completePayload, apiKey, keyId)

    const resp = await fetch(`${baseUrl}/payment/complete-3ds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PG-Api-Version': 'v3',
        'PG-Auth-Token': authToken,
        'correlationId': correlationId,
      },
      body: JSON.stringify({ ...completePayload, securityHash }),
    })

    const result = await resp.json()
    const success = result.success === true

    if (success) {
      await supabaseAdmin.from('payments').update({
        status: 'completed',
        metadata: {
          bank_auth_code: result.bankAuthCode,
          bank_ref: result.bankReferenceNumber,
          correlation_id: correlationId,
        },
      }).eq('gateway_transaction_id', orderId)

      await supabaseAdmin.from('invoices').update({
        status: 'paid',
        payment_date: new Date().toISOString(),
        payment_method: 'tami',
        transaction_id: result.bankReferenceNumber,
      }).eq('id', payment.invoice_id)

      return redirectOk()
    } else {
      await supabaseAdmin.from('payments').update({ status: 'failed' })
        .eq('gateway_transaction_id', orderId)
      return redirectFail()
    }

  } catch (err) {
    console.error('tami-callback error:', err)
    return redirectFail()
  }
})
