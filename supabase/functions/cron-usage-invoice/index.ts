// Aylık Usage-Based Billing Cron
//
// Her ayın 1'inde çalışır, önceki aya ait faturalandırılmamış
// kullanım metriklerini toplayarak aşım faturaları oluşturur.
//
// Mantık:
//  1. Önceki aya ait invoiced=false metrikleri getir
//  2. usage_billing_rules'tan dahil edilen miktarı çıkar
//  3. Aşım varsa invoice-create endpoint'ini çağırarak fatura oluştur
//  4. Metrikleri invoiced=true olarak işaretle
//
// Deploy: supabase functions deploy cron-usage-invoice
// Cron: Her ayın 1. günü 03:00 UTC

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UsageRow {
  id: string
  customer_id: string
  service_id: string | null
  service_type: string
  metric_type: string
  quantity: number
  period_start: string
  period_end: string
}

interface BillingRule {
  service_type: string
  metric_type: string
  unit_price: number
  included_units: number
  currency: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Önceki ayın dönemini hesapla
    const now = new Date()
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const periodStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1).toISOString()
    const periodEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 23, 59, 59).toISOString()

    console.log(`[cron-usage-invoice] Processing period: ${periodStart} → ${periodEnd}`)

    // Billing kurallarını getir
    const { data: rules, error: rulesErr } = await supabase
      .from('usage_billing_rules')
      .select('service_type, metric_type, unit_price, included_units, currency')
      .eq('is_active', true)

    if (rulesErr) throw rulesErr

    const ruleMap = new Map<string, BillingRule>()
    for (const rule of rules ?? []) {
      // Hem service_type specific hem de '*' wildcard
      const key = `${rule.service_type}:${rule.metric_type}`
      ruleMap.set(key, rule)
    }

    // Faturalandırılmamış metrikleri getir (önceki ay)
    const { data: metrics, error: metErr } = await supabase
      .from('usage_metrics')
      .select('id, customer_id, service_id, service_type, metric_type, quantity, period_start, period_end')
      .eq('invoiced', false)
      .gte('period_start', periodStart)
      .lte('period_end', periodEnd)

    if (metErr) throw metErr

    if (!metrics || metrics.length === 0) {
      console.log('[cron-usage-invoice] No pending metrics — nothing to invoice')
      return new Response(JSON.stringify({ success: true, invoiced: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[cron-usage-invoice] Found ${metrics.length} pending metric rows`)

    // Müşteri bazında grupla
    const byCustomer = new Map<string, UsageRow[]>()
    for (const m of metrics as UsageRow[]) {
      const arr = byCustomer.get(m.customer_id) ?? []
      arr.push(m)
      byCustomer.set(m.customer_id, arr)
    }

    let invoicedCount = 0
    let skippedCount = 0

    for (const [customerId, rows] of byCustomer) {
      const invoiceItems: Array<{
        type: string
        description: string
        quantity: number
        unit_price: number
      }> = []
      const invoicedIds: string[] = []

      for (const row of rows) {
        const specificKey = `${row.service_type}:${row.metric_type}`
        const wildcardKey = `*:${row.metric_type}`
        const rule = ruleMap.get(specificKey) ?? ruleMap.get(wildcardKey)

        if (!rule) {
          console.warn(`[cron-usage-invoice] No rule for ${specificKey}, skipping`)
          skippedCount++
          continue
        }

        const overage = row.quantity - rule.included_units
        if (overage <= 0) {
          // Aşım yok — yine de işaretliyoruz
          invoicedIds.push(row.id)
          continue
        }

        const unitLabel = row.metric_type === 'bandwidth_gb' ? 'GB'
          : row.metric_type === 'storage_gb' ? 'GB'
          : row.metric_type === 'api_calls' ? 'istek'
          : 'birim'

        invoiceItems.push({
          type: 'addon',
          description: `${row.service_type.toUpperCase()} ${row.metric_type.replace('_', ' ')} aşımı (${overage.toFixed(2)} ${unitLabel})`,
          quantity: Math.ceil(overage),
          unit_price: rule.unit_price,
        })
        invoicedIds.push(row.id)
      }

      if (invoiceItems.length === 0) {
        // Sadece işaretleme yap
        if (invoicedIds.length > 0) {
          await supabase
            .from('usage_metrics')
            .update({ invoiced: true })
            .in('id', invoicedIds)
        }
        continue
      }

      // Faturayı oluştur — invoice-create Edge Function'ını çağır
      try {
        const baseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const functionsUrl = `${baseUrl.replace('/rest/v1', '')}/functions/v1`

        const invoiceRes = await fetch(`${functionsUrl}/invoice-create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Service role key kullanıcı kontrolünü bypass eder
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            customer_id: customerId,
            items: invoiceItems,
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            currency: 'TRY',
            tax_rate: 20,
            notes: `Otomatik usage-based fatura — ${prevMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}`,
          }),
        })

        const invoiceResult = await invoiceRes.json()
        if (!invoiceResult.success) {
          console.error(`[cron-usage-invoice] Invoice failed for ${customerId}:`, invoiceResult.error)
          continue
        }

        // Metrikleri fatura ID ile işaretle
        const invoiceId = invoiceResult.invoice?.id
        await supabase
          .from('usage_metrics')
          .update({ invoiced: true, invoice_id: invoiceId })
          .in('id', invoicedIds)

        invoicedCount++
        console.log(`[cron-usage-invoice] ✅ Invoice ${invoiceId} created for customer ${customerId}`)
      } catch (invErr) {
        console.error(`[cron-usage-invoice] Error creating invoice for ${customerId}:`, invErr)
      }
    }

    const summary = { success: true, invoiced: invoicedCount, skipped: skippedCount, total_customers: byCustomer.size }
    console.log('[cron-usage-invoice] ✅ Done:', summary)

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[cron-usage-invoice] Fatal error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
