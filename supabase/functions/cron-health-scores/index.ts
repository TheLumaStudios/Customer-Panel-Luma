// Günlük çalışan cron: Müşteri sağlık skorunu hesaplar ve günceller
//
// Skorlama (0-100, başlangıç: 50):
//   Son 90 günde ticket açtı mı?            -10
//   Son fatura zamanında ödendi mi?          +15 (evet) / -20 (hayır)
//   Aktif servis sayısı                      +5/servis, max +20
//   Panel giriş sıklığı (son 30 gün)        +10 (aktif)
//   Gecikmiş (overdue) fatura var mı?        -25
//   Sözleşme imzaladı mı?                   +10
//
// Deploy: supabase functions deploy cron-health-scores
// Cron: Her gün 02:00 UTC (supabase.toml veya cron trigger)

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const now = new Date()
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const ago90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()

  try {
    // Anonimleştirilmemiş tüm müşterileri al
    const { data: customers, error: custErr } = await supabase
      .from('customers')
      .select('id, profile_id')
      .is('anonymized_at', null)

    if (custErr) throw custErr

    console.log(`[cron-health-scores] Processing ${customers?.length ?? 0} customers`)

    let updated = 0
    let failed = 0

    for (const customer of customers ?? []) {
      try {
        let score = 50 // Başlangıç skoru

        // 1. Son 90 günde ticket açtı mı? (-10)
        const { count: ticketCount } = await supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
          .gte('created_at', ago90)

        if ((ticketCount ?? 0) > 0) {
          score -= 10
        }

        // 2. Gecikmiş (overdue) fatura var mı? (-25)
        const { count: overdueCount } = await supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
          .eq('status', 'overdue')

        if ((overdueCount ?? 0) > 0) {
          score -= 25
        }

        // 3. Son fatura zamanında ödendi mi? (+15 / -20)
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('status, due_date, paid_at')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (lastInvoice) {
          if (lastInvoice.status === 'paid') {
            // Zamanında mı ödendi?
            const paidOnTime =
              lastInvoice.paid_at && lastInvoice.due_date
                ? new Date(lastInvoice.paid_at) <= new Date(lastInvoice.due_date)
                : lastInvoice.status === 'paid'
            score += paidOnTime ? 15 : -20
          } else if (lastInvoice.status === 'unpaid' || lastInvoice.status === 'pending') {
            // Ödenmemiş son fatura varsa ve vadesi geçmişse
            if (lastInvoice.due_date && new Date(lastInvoice.due_date) < now) {
              score -= 20
            }
          }
        }

        // 4. Aktif servis sayısı (+5/servis, max +20)
        const { count: hostingCount } = await supabase
          .from('hosting')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
          .eq('status', 'active')

        const { count: domainCount } = await supabase
          .from('domains')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
          .eq('status', 'active')

        const activeServices = (hostingCount ?? 0) + (domainCount ?? 0)
        score += Math.min(activeServices * 5, 20)

        // 5. Panel giriş sıklığı (son 30 gün, aktif kullanıcı +10)
        if (customer.profile_id) {
          const { data: auditActivity } = await supabase
            .from('audit_logs')
            .select('id')
            .eq('user_id', customer.profile_id)
            .gte('created_at', ago30)
            .limit(1)
            .maybeSingle()

          if (auditActivity) {
            score += 10
          }
        }

        // 6. Sözleşme imzaladı mı? (+10)
        const { count: contractCount } = await supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
          .eq('status', 'signed')

        if ((contractCount ?? 0) > 0) {
          score += 10
        }

        // Skoru 0-100 aralığına sınırla
        score = Math.max(0, Math.min(100, score))

        // customers tablosunu güncelle
        const { error: updateErr } = await supabase
          .from('customers')
          .update({
            health_score: score,
            health_score_updated_at: now.toISOString(),
          })
          .eq('id', customer.id)

        if (updateErr) {
          console.error(`[cron-health-scores] Failed to update ${customer.id}:`, updateErr)
          failed++
        } else {
          updated++
        }
      } catch (customerErr) {
        console.error(`[cron-health-scores] Error processing customer ${customer.id}:`, customerErr)
        failed++
      }
    }

    const summary = { updated, failed, total: customers?.length ?? 0 }
    console.log('[cron-health-scores] ✅ Done:', summary)

    return new Response(JSON.stringify({ success: true, ...summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[cron-health-scores] Fatal error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
