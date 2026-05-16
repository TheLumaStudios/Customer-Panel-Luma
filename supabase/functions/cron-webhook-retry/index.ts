// Webhook Retry Cron Job
// Başarısız webhook'ları üstel geri çekilme ile yeniden dener (max 5 deneme).
// Supabase cron'u tarafından her 5 dakikada bir çağrılmalı.
// Deploy: supabase functions deploy cron-webhook-retry

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_ATTEMPTS = 5
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000, 3_600_000, 10_800_000]

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

serve(async (req) => {
  // Cron runner veya service-role çağrısı kontrolü
  const authHeader = req.headers.get('Authorization') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!authHeader.includes(serviceRoleKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    serviceRoleKey
  )

  const now = new Date().toISOString()

  // Yeniden deneme zamanı gelmiş başarısız logları getir
  const { data: pendingLogs, error } = await supabase
    .from('webhook_logs')
    .select(`
      id, event, payload, attempts, webhook_id,
      webhook:webhooks(id, url, secret, events, is_active, customer_id)
    `)
    .eq('status', 'failed')
    .lte('next_retry_at', now)
    .lt('attempts', MAX_ATTEMPTS)
    .limit(50)

  if (error) {
    console.error('[cron-webhook-retry] DB error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!pendingLogs?.length) {
    return new Response(JSON.stringify({ retried: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let retried = 0

  for (const log of pendingLogs) {
    const webhook = log.webhook as {
      id: string; url: string; secret: string; is_active: boolean; customer_id: string
    }

    if (!webhook?.is_active) {
      // Webhook devre dışı, daha fazla deneme yapma
      await supabase
        .from('webhook_logs')
        .update({ status: 'failed', next_retry_at: null })
        .eq('id', log.id)
      continue
    }

    const newAttempts = (log.attempts ?? 1) + 1
    const bodyStr = JSON.stringify({
      event: log.event,
      timestamp: new Date().toISOString(),
      data: log.payload,
    })
    const signature = await sign(webhook.secret, bodyStr)

    let responseStatus = 0
    let responseBody = ''

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Luma-Signature': `sha256=${signature}`,
          'X-Luma-Event': log.event,
          'X-Luma-Delivery': log.id,
          'X-Luma-Attempt': String(newAttempts),
        },
        body: bodyStr,
        signal: controller.signal,
      })
      clearTimeout(timeout)
      responseStatus = res.status
      responseBody = (await res.text().catch(() => '')).slice(0, 1000)
    } catch (err) {
      responseBody = String(err).slice(0, 1000)
    }

    const success = responseStatus >= 200 && responseStatus < 300

    const nextRetry = !success && newAttempts < MAX_ATTEMPTS
      ? new Date(Date.now() + RETRY_DELAYS_MS[Math.min(newAttempts - 1, RETRY_DELAYS_MS.length - 1)]).toISOString()
      : null

    await supabase
      .from('webhook_logs')
      .update({
        response_status: responseStatus,
        response_body: responseBody,
        attempts: newAttempts,
        status: success ? 'delivered' : 'failed',
        delivered_at: success ? new Date().toISOString() : null,
        next_retry_at: nextRetry,
      })
      .eq('id', log.id)

    console.log(
      `[cron-webhook-retry] attempt ${newAttempts}/${MAX_ATTEMPTS} → ${webhook.url}: ` +
      `${responseStatus} (${success ? 'OK' : 'FAIL'})`
    )
    if (success) retried++
  }

  return new Response(JSON.stringify({ retried, checked: pendingLogs.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
