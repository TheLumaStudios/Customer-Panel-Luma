// Supabase Edge Function for sending SMS via TopluSMS
// Deploy: supabase functions deploy send-sms
// Secrets: supabase secrets set VATANSMS_API_KEY=xxx VATANSMS_SENDER=xxx

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify caller is admin or employee
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'employee'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin or employee access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { phone, message } = await req.json()

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'phone and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('VATANSMS_API_KEY')
    const sender = 'LUMAYAZILIM'
    const apiUrl = 'https://api.toplusms.app/api/v1'

    if (!apiKey) {
      // Simulate in dev
      console.warn('TopluSMS credentials not configured. Simulating SMS send...')

      await supabaseAdmin.from('sms_logs').insert({
        phone,
        message,
        status: 'simulated',
        cost: Math.ceil(message.length / 160) * 0.05,
        sent_at: new Date().toISOString(),
      })

      return new Response(
        JSON.stringify({ success: true, message: 'SMS simulated', messageId: `sim_${Date.now()}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '')

    const requestBody = {
      api_key: apiKey,
      sender,
      message_type: 'normal',
      message_content_type: 'bilgi',
      message,
      phones: [cleanPhone],
    }
    console.log('SMS Request:', JSON.stringify({ sender, phone: cleanPhone, apiUrl }))

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    let result: Record<string, unknown>
    try {
      const response = await fetch(`${apiUrl}/1toN`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const responseText = await response.text()
      console.log('SMS Response status:', response.status, 'body:', responseText)

      try {
        result = JSON.parse(responseText)
      } catch {
        result = { raw: responseText }
      }

      if (!response.ok) {
        const errMsg = (result as Record<string, unknown>).message as string || `TopluSMS HTTP ${response.status}`
        console.error('TopluSMS API error:', errMsg)
        return new Response(
          JSON.stringify({ success: false, error: `SMS sağlayıcı hatası: ${errMsg}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId)
      const isTimeout = (fetchErr as Error).name === 'AbortError'
      const errMsg = isTimeout ? 'SMS sağlayıcı zaman aşımı' : `Bağlantı hatası: ${(fetchErr as Error).message}`
      console.error('TopluSMS fetch error:', errMsg)
      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const smsCount = Math.ceil(message.length / 160) || 1

    // Log to DB — ignore errors so SMS success isn't blocked by logging failure
    await supabaseAdmin.from('sms_logs').insert({
      phone: cleanPhone,
      message,
      status: 'sent',
      cost: smsCount * 0.05,
      sent_at: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({ success: true, message: 'SMS sent', messageId: (result as Record<string, unknown>)?.id || `msg_${Date.now()}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-sms error:', error)
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
