// Ödeme Raporu Oluşturma - Günlük özet rapor
// Deploy: supabase functions deploy payment-report-generate

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
    const authHeader = req.headers.get('Authorization')!
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Only admins can generate payment reports')
    }

    const { report_date } = await req.json()
    const targetDate = report_date || new Date().toISOString().split('T')[0]

    console.log('📊 Generating payment report for date:', targetDate)

    // Tarih aralığını belirle
    const startDate = new Date(targetDate)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(targetDate)
    endDate.setHours(23, 59, 59, 999)

    // Ödemeleri getir
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (!payments) {
      throw new Error('Failed to fetch payments')
    }

    // İstatistikleri hesapla
    const stats = {
      total_transactions: payments.length,
      total_amount: 0,
      total_commission: 0,
      successful_transactions: 0,
      successful_amount: 0,
      failed_transactions: 0,
      failed_amount: 0,
      refunded_transactions: 0,
      refunded_amount: 0,
      cancelled_transactions: 0,
    }

    payments.forEach((payment: any) => {
      const amount = parseFloat(payment.amount) || 0

      if (payment.status === 'completed') {
        stats.successful_transactions++
        stats.successful_amount += amount
        stats.total_amount += amount
        // iyzico komisyon oranı yaklaşık %2.9 + 0.25 TL
        stats.total_commission += amount * 0.029 + 0.25
      } else if (payment.status === 'failed') {
        stats.failed_transactions++
        stats.failed_amount += amount
      } else if (payment.status === 'refunded') {
        stats.refunded_transactions++
        stats.refunded_amount += amount
      } else if (payment.status === 'cancelled') {
        stats.cancelled_transactions++
      }
    })

    // İadeleri getir
    const { data: refunds } = await supabaseAdmin
      .from('refunds')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'success')

    if (refunds) {
      stats.refunded_transactions = refunds.length
      stats.refunded_amount = refunds.reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0)
    }

    // İptalleri getir
    const { data: cancellations } = await supabaseAdmin
      .from('cancellations')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'success')

    if (cancellations) {
      stats.cancelled_transactions = cancellations.length
    }

    console.log('📈 Statistics calculated:', stats)

    // Raporu database'e kaydet
    const { data: report, error: reportError } = await supabaseAdmin
      .from('payment_reports')
      .upsert({
        report_date: targetDate,
        total_transactions: stats.total_transactions,
        total_amount: stats.total_amount.toFixed(2),
        total_commission: stats.total_commission.toFixed(2),
        successful_transactions: stats.successful_transactions,
        successful_amount: stats.successful_amount.toFixed(2),
        failed_transactions: stats.failed_transactions,
        failed_amount: stats.failed_amount.toFixed(2),
        refunded_transactions: stats.refunded_transactions,
        refunded_amount: stats.refunded_amount.toFixed(2),
        cancelled_transactions: stats.cancelled_transactions,
        iyzico_report: {
          payments,
          refunds,
          cancellations,
          generated_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (reportError) throw reportError

    console.log('✅ Report saved to database')

    return new Response(
      JSON.stringify({
        success: true,
        report,
        statistics: stats,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Report generation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
