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
    const sender = Deno.env.get('VATANSMS_SENDER') || 'LUMAYAZILIM'
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

    const response = await fetch(`${apiUrl}/1toN`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        sender,
        message_type: 'turkce',
        message,
        phones: [cleanPhone],
      }),
    })

    const result = await response.json()

    const smsCount = Math.ceil(message.length / 160) || 1

    await supabaseAdmin.from('sms_logs').insert({
      phone: cleanPhone,
      message,
      status: 'sent',
      cost: smsCount * 0.05,
      sent_at: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({ success: true, message: 'SMS sent', messageId: result?.id || `msg_${Date.now()}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-sms error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
