// Webhook Delivery Engine
// Müşterinin aktif webhook'larına HMAC-SHA256 imzalı event gönderir.
// Diğer Edge Function'lar tarafından service-to-service olarak çağrılır.
// Deploy: supabase functions deploy webhook-deliver

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_ATTEMPTS = 5
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000, 3_600_000, 10_800_000] // 1m, 5m, 15m, 1h, 3h

/** HMAC-SHA256 imzası oluşturur (hex string) */
async function sign(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Tek bir webhook endpoint'ine gönderim yapar */
async function deliverToEndpoint(
  url: string,
  secret: string,
  event: string,
  payload: Record<string, unknown>,
  webhookLogId: string
): Promise<{ status: number; body: string }> {
  const bodyStr = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  })

  const signature = await sign(secret, bodyStr)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000) // 10s timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Luma-Signature': `sha256=${signature}`,
        'X-Luma-Event': event,
        'X-Luma-Delivery': webhookLogId,
      },
      body: bodyStr,
      signal: controller.signal,
    })
    const responseBody = await res.text().catch(() => '')
    return { status: res.status, body: responseBody.slice(0, 1000) }
  } catch (err) {
    return { status: 0, body: String(err).slice(0, 1000) }
  } finally {
    clearTimeout(timeout)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Bu endpoint sadece service-to-service çağrılar için (service role key)
  // Kimlik doğrulama: SUPABASE_SERVICE_ROLE_KEY veya internal secret
  const authHeader = req.headers.get('Authorization') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!authHeader.includes(serviceRoleKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    serviceRoleKey
  )

  const { customer_id, event, payload } = await req.json() as {
    customer_id: string
    event: string
    payload: Record<string, unknown>
  }

  if (!customer_id || !event || !payload) {
    return new Response(JSON.stringify({ error: 'customer_id, event, payload required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Bu olaya abone aktif webhook'ları getir
  const { data: webhooks, error: wErr } = await supabase
    .from('webhooks')
    .select('id, url, secret, events')
    .eq('customer_id', customer_id)
    .eq('is_active', true)

  if (wErr || !webhooks?.length) {
    return new Response(JSON.stringify({ delivered: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Yalnızca bu event'e abone olanları filtrele
  const matched = webhooks.filter(w => w.events?.includes(event))
  if (!matched.length) {
    return new Response(JSON.stringify({ delivered: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const results: { webhook_id: string; status: number; success: boolean }[] = []

  for (const webhook of matched) {
    // Log kaydı oluştur (pending)
    const { data: logRow } = await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhook.id,
        event,
        payload,
        attempts: 1,
        status: 'pending',
      })
      .select('id')
      .single()

    const logId = logRow?.id ?? crypto.randomUUID()

    // Gönder
    const { status, body } = await deliverToEndpoint(
      webhook.url,
      webhook.secret,
      event,
      payload,
      logId
    )

    const success = status >= 200 && status < 300

    // Log'u güncelle
    await supabase
      .from('webhook_logs')
      .update({
        response_status: status,
        response_body: body,
        status: success ? 'delivered' : 'failed',
        delivered_at: success ? new Date().toISOString() : null,
        next_retry_at: !success
          ? new Date(Date.now() + RETRY_DELAYS_MS[0]).toISOString()
          : null,
      })
      .eq('id', logId)

    results.push({ webhook_id: webhook.id, status, success })
    console.log(`[webhook-deliver] ${event} → ${webhook.url}: ${status} (${success ? 'OK' : 'FAIL'})`)
  }

  return new Response(JSON.stringify({ delivered: results.filter(r => r.success).length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
