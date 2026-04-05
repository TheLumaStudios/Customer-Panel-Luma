// Supabase Edge Function - Auto Invoice Creation for Renewal Services
// Deploy: supabase functions deploy cron-auto-invoice

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
      .in('key', ['auto_invoice_enabled', 'invoice_days_before_renewal'])

    const settingsMap: Record<string, string> = {}
    for (const s of settings || []) {
      settingsMap[s.key] = s.value
    }

    if (settingsMap.auto_invoice_enabled !== 'true') {
      return new Response(JSON.stringify({ success: true, items_processed: 0, message: 'Auto invoice disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const daysBefore = parseInt(settingsMap.invoice_days_before_renewal || '14')
    const cutoffDate = new Date(Date.now() + daysBefore * 24 * 60 * 60 * 1000).toISOString()
    let itemsProcessed = 0

    console.log(`Auto-invoice: checking services with next_invoice_date <= ${cutoffDate}`)

    // Find hosting services nearing renewal
    const { data: hostingServices } = await supabaseAdmin
      .from('hosting')
      .select('*, customer:customers(id, full_name, email, customer_code)')
      .eq('status', 'active')
      .lte('next_invoice_date', cutoffDate)

    for (const hosting of hostingServices || []) {
      try {
        // Check if unpaid invoice already exists for this service
        const { data: existingInvoice } = await supabaseAdmin
          .from('invoices')
          .select('id')
          .eq('related_service_id', hosting.id)
          .eq('related_service_type', 'hosting')
          .eq('status', 'unpaid')
          .maybeSingle()

        if (existingInvoice) {
          console.log(`Skipping hosting ${hosting.id} - unpaid invoice already exists`)
          continue
        }

        const amount = hosting.price || hosting.monthly_price || 0
        const dueDate = hosting.next_invoice_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabaseAdmin
          .from('invoices')
          .insert({
            customer_id: hosting.customer_id,
            status: 'unpaid',
            due_date: dueDate,
            subtotal: amount,
            tax: 0,
            total: amount,
            total_amount: amount,
            currency: hosting.currency || 'TRY',
            notes: `Auto-generated renewal invoice for hosting: ${hosting.domain || hosting.label || hosting.id}`,
            related_service_id: hosting.id,
            related_service_type: 'hosting',
          })
          .select()
          .single()

        if (invoiceError) {
          console.error(`Failed to create invoice for hosting ${hosting.id}:`, invoiceError.message)
          continue
        }

        // Create invoice item
        await supabaseAdmin.from('invoice_items').insert({
          invoice_id: invoice.id,
          type: 'hosting',
          description: `Hosting Renewal - ${hosting.domain || hosting.label || 'Hosting Service'}`,
          quantity: 1,
          unit_price: amount,
          amount: amount,
          total_price: amount,
          total: amount,
          service_id: hosting.id,
          service_type: 'hosting',
        })

        console.log(`Created invoice ${invoice.id} for hosting ${hosting.id}`)
        itemsProcessed++
      } catch (err) {
        console.error(`Error processing hosting ${hosting.id}:`, err.message)
      }
    }

    // Find domain services nearing renewal
    const { data: domainServices } = await supabaseAdmin
      .from('domains')
      .select('*, customer:customers(id, full_name, email, customer_code)')
      .eq('status', 'active')
      .lte('next_invoice_date', cutoffDate)

    for (const domain of domainServices || []) {
      try {
        // Check if unpaid invoice already exists
        const { data: existingInvoice } = await supabaseAdmin
          .from('invoices')
          .select('id')
          .eq('related_service_id', domain.id)
          .eq('related_service_type', 'domain')
          .eq('status', 'unpaid')
          .maybeSingle()

        if (existingInvoice) {
          console.log(`Skipping domain ${domain.id} - unpaid invoice already exists`)
          continue
        }

        const amount = domain.price || domain.renewal_price || 0
        const dueDate = domain.next_invoice_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

        const { data: invoice, error: invoiceError } = await supabaseAdmin
          .from('invoices')
          .insert({
            customer_id: domain.customer_id,
            status: 'unpaid',
            due_date: dueDate,
            subtotal: amount,
            tax: 0,
            total: amount,
            total_amount: amount,
            currency: domain.currency || 'TRY',
            notes: `Auto-generated renewal invoice for domain: ${domain.domain_name || domain.name}`,
            related_service_id: domain.id,
            related_service_type: 'domain',
          })
          .select()
          .single()

        if (invoiceError) {
          console.error(`Failed to create invoice for domain ${domain.id}:`, invoiceError.message)
          continue
        }

        await supabaseAdmin.from('invoice_items').insert({
          invoice_id: invoice.id,
          type: 'domain',
          description: `Domain Renewal - ${domain.domain_name || domain.name}`,
          quantity: 1,
          unit_price: amount,
          amount: amount,
          total_price: amount,
          total: amount,
          service_id: domain.id,
          service_type: 'domain',
        })

        console.log(`Created invoice ${invoice.id} for domain ${domain.id}`)
        itemsProcessed++
      } catch (err) {
        console.error(`Error processing domain ${domain.id}:`, err.message)
      }
    }

    console.log(`Auto-invoice completed: ${itemsProcessed} invoices created`)

    return new Response(JSON.stringify({ success: true, items_processed: itemsProcessed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Auto-invoice error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
