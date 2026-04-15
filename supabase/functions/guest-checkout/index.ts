// Misafir checkout: Hesap oluştur, müşteri kaydı yap, SMS ile bilgileri gönder
// Deploy: supabase functions deploy guest-checkout

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function generatePassword(length = 12) {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
  let pass = ''
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  for (const b of arr) pass += chars[b % chars.length]
  return pass
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { full_name, email, phone, company_name, billing_address, billing_city } = await req.json()

    if (!full_name || !email || !phone) {
      return json({ success: false, error: 'Ad soyad, e-posta ve telefon zorunludur' }, 400)
    }

    // Email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ success: false, error: 'Geçersiz e-posta adresi' }, 400)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    )

    let userId: string
    let password: string
    let isNewUser = false

    if (existingUser) {
      // User exists - return session token
      userId = existingUser.id
      password = '' // don't generate new password for existing users

      // Sign in existing user
      // We'll return a magic link or just the user ID for the frontend to handle
      return json({
        success: true,
        existing_user: true,
        user_id: userId,
        message: 'Bu e-posta ile kayıtlı bir hesap var. Lütfen giriş yapın.',
      })
    }

    // Create new user
    password = generatePassword()
    isNewUser = true

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        role: 'customer',
      },
    })

    if (authError) {
      return json({ success: false, error: `Hesap oluşturulamadı: ${authError.message}` }, 400)
    }

    userId = authData.user.id

    // Create profile
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name,
      email,
      phone,
      role: 'customer',
    })

    // Create customer record
    const customerCode = `MUS-${Date.now().toString(36).toUpperCase()}`
    await supabaseAdmin.from('customers').insert({
      profile_id: userId,
      customer_code: customerCode,
      full_name,
      email,
      phone,
      company_name: company_name || null,
      billing_address: billing_address || null,
      billing_city: billing_city || null,
      billing_country: 'Türkiye',
      status: 'active',
      customer_type: 'host',
    })

    // Send SMS with credentials
    const VATANSMS_API_URL = Deno.env.get('VATANSMS_API_URL') || 'https://api.vatansms.net/api/v1'
    const VATANSMS_API_ID = Deno.env.get('VATANSMS_API_ID')
    const VATANSMS_API_KEY = Deno.env.get('VATANSMS_API_KEY')
    const VATANSMS_SENDER = Deno.env.get('VATANSMS_SENDER') || 'LUMAHOST'

    const smsMessage = `Luma Yazilim - Hesap bilgileriniz\nE-posta: ${email}\nSifre: ${password}\nPanel: lumayazilim.com/login`

    if (VATANSMS_API_ID && VATANSMS_API_KEY) {
      try {
        await fetch(`${VATANSMS_API_URL}/1toN`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_id: VATANSMS_API_ID,
            api_key: VATANSMS_API_KEY,
            sender: VATANSMS_SENDER,
            message_type: 'normal',
            message: smsMessage,
            phones: [phone.replace(/\s/g, '')],
          }),
        })
      } catch (smsErr) {
        console.error('SMS gönderilemedi:', smsErr)
      }
    }

    // Log SMS
    try {
      await supabaseAdmin.from('sms_logs').insert({
        phone,
        message: smsMessage,
        status: VATANSMS_API_ID ? 'sent' : 'simulated',
        cost: 1,
      })
    } catch {
      // ignore sms log errors
    }

    // Generate session via admin API (no anon key needed)
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    // Use admin signInWithPassword on behalf of user
    // Create a user-scoped client to get proper session
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Direct token generation via admin
    const signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ email, password }),
    })

    let session = null
    if (signInRes.ok) {
      session = await signInRes.json()
    } else {
      console.error('Session creation failed:', await signInRes.text())
    }

    return json({
      success: true,
      existing_user: false,
      user_id: userId,
      email,
      password,
      customer_code: customerCode,
      session,
      message: 'Hesap oluşturuldu, bilgiler SMS ile gönderildi.',
    })
  } catch (error) {
    console.error('Guest checkout error:', error)
    return json({ success: false, error: (error as Error).message }, 500)
  }
})
