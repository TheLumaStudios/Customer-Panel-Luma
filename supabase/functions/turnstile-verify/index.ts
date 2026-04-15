// Cloudflare Turnstile server-side verification
// Deploy: supabase functions deploy turnstile-verify

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY') || '0x4AAAAAAC-G4CYCLe9SrAJYc58GqCgy0vI'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()

    if (!token) {
      return json({ success: false, error: 'Token gerekli' }, 400)
    }

    // Verify with Cloudflare
    const formData = new URLSearchParams()
    formData.append('secret', TURNSTILE_SECRET)
    formData.append('response', token)

    // Optionally include the connecting IP
    const connectingIp = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')
    if (connectingIp) {
      formData.append('remoteip', connectingIp)
    }

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })

    const outcome = await result.json()

    if (outcome.success) {
      return json({ success: true })
    } else {
      console.error('Turnstile verification failed:', outcome['error-codes'])
      return json({ success: false, error: 'Doğrulama başarısız' }, 403)
    }
  } catch (err) {
    console.error('turnstile-verify error:', err)
    return json({ success: false, error: (err as Error).message }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
