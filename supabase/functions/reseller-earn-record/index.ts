/**
 * reseller-earn-record
 *
 * Bir fatura ödendiğinde çağrılır (subscription-webhook veya iyzico callback'ten).
 * Müşterinin bayisi varsa, fatura tutarına göre kazanç kaydı oluşturur.
 *
 * POST body: { invoice_id: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { invoice_id } = await req.json()
    if (!invoice_id) return new Response(JSON.stringify({ error: 'invoice_id required' }), { status: 400, headers: corsHeaders })

    // Faturayı çek
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('id, customer_id, total_amount, status')
      .eq('id', invoice_id)
      .maybeSingle()
    if (invErr || !invoice) return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404, headers: corsHeaders })
    if (invoice.status !== 'paid') return new Response(JSON.stringify({ skipped: 'invoice not paid' }), { status: 200, headers: corsHeaders })

    // Müşterinin bayisi var mı?
    const { data: customer } = await supabase
      .from('customers')
      .select('reseller_id')
      .eq('id', invoice.customer_id)
      .maybeSingle()
    if (!customer?.reseller_id) return new Response(JSON.stringify({ skipped: 'no reseller' }), { status: 200, headers: corsHeaders })

    // Daha önce kaydedilmiş mi?
    const { data: existing } = await supabase
      .from('reseller_earnings')
      .select('id')
      .eq('invoice_id', invoice_id)
      .maybeSingle()
    if (existing) return new Response(JSON.stringify({ skipped: 'already recorded' }), { status: 200, headers: corsHeaders })

    // Bayi marjını al
    const { data: reseller } = await supabase
      .from('resellers')
      .select('id, margin_type, margin_value, status, wallet_balance, total_earned')
      .eq('id', customer.reseller_id)
      .maybeSingle()
    if (!reseller || reseller.status !== 'active') {
      return new Response(JSON.stringify({ skipped: 'reseller inactive' }), { status: 200, headers: corsHeaders })
    }

    const gross = Number(invoice.total_amount)
    const marginPct = reseller.margin_type === 'percent'
      ? Number(reseller.margin_value) / 100
      : null
    const earned = marginPct !== null
      ? gross * marginPct
      : Math.min(Number(reseller.margin_value), gross)

    // Kazanç kaydı oluştur
    const { error: earnErr } = await supabase.from('reseller_earnings').insert({
      reseller_id: reseller.id,
      invoice_id: invoice.id,
      customer_id: invoice.customer_id,
      gross_amount: gross,
      margin_pct: marginPct !== null ? marginPct : (earned / gross),
      earned_amount: earned,
      status: 'pending',
    })
    if (earnErr) throw earnErr

    // Bayi cüzdan bakiyesini güncelle
    await supabase.from('resellers').update({
      wallet_balance: reseller.wallet_balance + earned,
      total_earned: reseller.total_earned + earned,
    }).eq('id', reseller.id)

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'reseller_earning_recorded',
      table_name: 'reseller_earnings',
      new_values: { invoice_id, reseller_id: reseller.id, earned_amount: earned },
    })

    return new Response(
      JSON.stringify({ success: true, earned_amount: earned }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
