// Supabase Edge Function - Apply Late Fees to Overdue Invoices
// Deploy: supabase functions deploy cron-late-fees

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Validate cron secret or service role
    const cronSecret = req.headers.get('x-cron-secret')
    const authHeader = req.headers.get('Authorization')
    const isServiceRole = authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'NONE')
    if (cronSecret !== Deno.env.get('CRON_SECRET') && !isServiceRole) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get system settings
    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', ['late_fee_enabled', 'late_fee_type', 'late_fee_amount', 'late_fee_grace_days'])

    const settingsMap: Record<string, string> = {}
    for (const s of settings || []) {
      settingsMap[s.key] = s.value
    }

    if (settingsMap.late_fee_enabled !== 'true') {
      return new Response(JSON.stringify({ success: true, items_processed: 0, message: 'Late fees disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const feeType = settingsMap.late_fee_type || 'fixed' // 'fixed' or 'percentage'
    const feeAmount = parseFloat(settingsMap.late_fee_amount || '0')
    const graceDays = parseInt(settingsMap.late_fee_grace_days || '3')

    if (feeAmount <= 0) {
      return new Response(JSON.stringify({ success: true, items_processed: 0, message: 'Late fee amount is 0' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const cutoffDate = new Date(Date.now() - graceDays * 24 * 60 * 60 * 1000).toISOString()
    let itemsProcessed = 0

    console.log(`Late fees: checking invoices overdue before ${cutoffDate}, fee: ${feeType} ${feeAmount}`)

    // Find overdue invoices without late fee applied
    const { data: overdueInvoices } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('status', 'unpaid')
      .lt('due_date', cutoffDate)
      .or('late_fee.is.null,late_fee.eq.0')

    for (const invoice of overdueInvoices || []) {
      try {
        // Save original_total if not already saved
        const originalTotal = invoice.original_total || invoice.total || 0

        // Calculate late fee
        let lateFee = 0
        if (feeType === 'percentage') {
          lateFee = Math.round((originalTotal * feeAmount / 100) * 100) / 100
        } else {
          lateFee = feeAmount
        }

        const newTotal = Math.round((originalTotal + lateFee) * 100) / 100

        // Update invoice with late fee
        await supabaseAdmin.from('invoices').update({
          original_total: originalTotal,
          late_fee: lateFee,
          total: newTotal,
          total_amount: newTotal,
        }).eq('id', invoice.id)

        console.log(`Applied late fee ${lateFee} to invoice ${invoice.id} (total: ${originalTotal} -> ${newTotal})`)
        itemsProcessed++
      } catch (err) {
        console.error(`Error applying late fee to invoice ${invoice.id}:`, err.message)
      }
    }

    console.log(`Late fees completed: ${itemsProcessed} invoices updated`)

    return new Response(JSON.stringify({ success: true, items_processed: itemsProcessed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Late fees error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
