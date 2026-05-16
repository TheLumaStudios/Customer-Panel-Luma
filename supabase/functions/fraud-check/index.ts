// Fraud Detection Edge Function
//
// Müşteri kaydı sırasında veya admin isteğiyle çalışır.
// Risk sinyalleri (0-100 arası skor biriktirir):
//   +30  Aynı IP'den son 24 saatte 3+ kayıt
//   +20  Türkiye dışı IP + yeni kayıt
//   +25  VPN/proxy/Tor tespiti (ip-api.com ücretsiz tier)
//   +15  Geçici/disposable e-posta adresi
//   +10  İsim veya e-posta alanında anormal karakter deseni
//
// Deploy: supabase functions deploy fraud-check

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Bilinen geçici e-posta domain'leri */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'temp-mail.org', 'throwam.com',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamail.net', 'guerrillamail.org', 'spam4.me', 'trashmail.com',
  'trashmail.me', 'trashmail.net', 'mailnull.com', 'spamgourmet.com',
  'dispostable.com', 'maildrop.cc', 'harakirimail.com', 'tempr.email',
  'fakeinbox.com', 'tempail.com', '10minutemail.com', 'throwam.com',
])

interface FraudFlag {
  type: string
  detail: string
  score: number
}

async function checkIpReputation(ip: string): Promise<{ isVpn: boolean; country: string; isp: string }> {
  try {
    // ip-api.com — ücretsiz tier, dakikada 45 istek
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,isp,proxy,hosting`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return { isVpn: false, country: '', isp: '' }
    const data = await res.json()
    if (data.status !== 'success') return { isVpn: false, country: '', isp: '' }
    return {
      isVpn: data.proxy === true || data.hosting === true,
      country: data.countryCode || '',
      isp: data.isp || '',
    }
  } catch {
    // API erişilemiyorsa sessizce devam et
    return { isVpn: false, country: '', isp: '' }
  }
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

    // Admin veya service role gerekli
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'employee'].includes(callerProfile?.role)) {
      throw new Error('Admin/employee access required')
    }

    const { profile_id, customer_id, ip } = await req.json()
    if (!profile_id) throw new Error('profile_id required')

    // Profili getir
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, created_at')
      .eq('id', profile_id)
      .single()

    if (profErr || !profile) throw new Error('Profile not found')

    // Müşteri kaydını al (kayıt IP'si için)
    let registrationIp = ip || null
    let registrationCountry = ''
    if (customer_id && !registrationIp) {
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('registration_ip, registration_country')
        .eq('id', customer_id)
        .single()
      registrationIp = customer?.registration_ip || null
      registrationCountry = customer?.registration_country || ''
    }

    const flags: FraudFlag[] = []
    let totalScore = 0

    // ─── Sinyal 1: Aynı IP'den 24 saatte 3+ kayıt ───
    if (registrationIp) {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count: ipCount } = await supabaseAdmin
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('registration_ip', registrationIp)
        .gte('created_at', since24h)

      if ((ipCount ?? 0) >= 3) {
        const flag = { type: 'ip_velocity', detail: `${registrationIp} adresinden 24 saatte ${ipCount} kayıt`, score: 30 }
        flags.push(flag)
        totalScore += flag.score
      }
    }

    // ─── Sinyal 2 & 3: IP itibar kontrolü (VPN/proxy, ülke) ───
    if (registrationIp) {
      const ipInfo = await checkIpReputation(registrationIp)

      if (ipInfo.isVpn) {
        const flag = { type: 'vpn_proxy', detail: `VPN/Proxy tespit edildi (ISP: ${ipInfo.isp || '?'})`, score: 25 }
        flags.push(flag)
        totalScore += flag.score
      }

      const country = ipInfo.country || registrationCountry
      if (country && country !== 'TR') {
        const flag = { type: 'foreign_ip', detail: `Türkiye dışı IP (${country})`, score: 20 }
        flags.push(flag)
        totalScore += flag.score
        registrationCountry = country
      }
    }

    // ─── Sinyal 4: Geçici/disposable e-posta ───
    if (profile.email) {
      const domain = profile.email.split('@')[1]?.toLowerCase()
      if (domain && DISPOSABLE_DOMAINS.has(domain)) {
        const flag = { type: 'disposable_email', detail: `Geçici e-posta domain'i: ${domain}`, score: 15 }
        flags.push(flag)
        totalScore += flag.score
      }
    }

    // ─── Sinyal 5: Anormal karakter deseni (e-posta veya isim) ───
    const randomPattern = /[0-9]{5,}|(.)\1{4,}/  // 5+ ardışık rakam veya aynı harf tekrarı
    if (
      profile.email && randomPattern.test(profile.email.split('@')[0]) ||
      profile.full_name && randomPattern.test(profile.full_name)
    ) {
      const flag = { type: 'pattern_anomaly', detail: 'E-posta/isimde anormal karakter deseni', score: 10 }
      flags.push(flag)
      totalScore += flag.score
    }

    // Skoru 0-100 arasında tut
    totalScore = Math.min(100, totalScore)

    const now = new Date().toISOString()

    // profiles tablosunu güncelle
    await supabaseAdmin
      .from('profiles')
      .update({
        fraud_risk_score: totalScore,
        fraud_risk_checked_at: now,
        fraud_flags: flags,
      })
      .eq('id', profile_id)

    // Eğer customer_id verilmişse kayıt bilgilerini de güncelle
    if (customer_id && (registrationCountry || registrationIp)) {
      await supabaseAdmin
        .from('customers')
        .update({
          registration_ip: registrationIp,
          registration_country: registrationCountry,
        })
        .eq('id', customer_id)
    }

    // Yüksek risk → audit log
    if (totalScore >= 50) {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'fraud_flagged',
        entity_type: 'profile',
        entity_id: profile_id,
        details: { fraud_risk_score: totalScore, flags, checked_at: now },
      })
    }

    console.log(`[fraud-check] Profile ${profile_id}: score=${totalScore}, flags=${flags.length}`)

    return new Response(
      JSON.stringify({ success: true, fraud_risk_score: totalScore, flags }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[fraud-check] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
