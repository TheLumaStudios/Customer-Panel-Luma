// Supabase Edge Function - Email Reminders for Upcoming/Overdue Invoices
// Deploy: supabase functions deploy cron-email-reminders

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

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    let itemsProcessed = 0

    // --- Upcoming invoice reminders (due within 3 days) ---
    const { data: upcomingInvoices } = await supabaseAdmin
      .from('invoices')
      .select('*, customer:customers(id, full_name, email)')
      .eq('status', 'unpaid')
      .gte('due_date', now.toISOString())
      .lte('due_date', threeDaysFromNow)

    for (const invoice of upcomingInvoices || []) {
      try {
        if (!invoice.customer?.email) continue

        // Check if reminder already sent today
        const { data: existingLog } = await supabaseAdmin
          .from('email_logs')
          .select('id')
          .eq('related_id', invoice.id)
          .eq('template_key', 'invoice_reminder')
          .gte('created_at', `${todayStr}T00:00:00`)
          .maybeSingle()

        if (existingLog) continue

        // Send reminder via send-email function
        const emailResult = await sendEmailInternal(supabaseAdmin, {
          to: invoice.customer.email,
          template_key: 'invoice_reminder',
          template_vars: {
            customer_name: invoice.customer.full_name,
            invoice_number: invoice.invoice_number || invoice.id,
            due_date: invoice.due_date,
            total: invoice.total,
            currency: invoice.currency || 'TRY',
          },
          related_id: invoice.id,
          related_type: 'invoice',
        })

        if (emailResult.success) {
          itemsProcessed++
          console.log(`Sent reminder for invoice ${invoice.id} to ${invoice.customer.email}`)
        }
      } catch (err) {
        console.error(`Error sending reminder for invoice ${invoice.id}:`, err.message)
      }
    }

    // --- Overdue invoice notifications (overdue by 1+ day) ---
    const { data: overdueInvoices } = await supabaseAdmin
      .from('invoices')
      .select('*, customer:customers(id, full_name, email)')
      .eq('status', 'unpaid')
      .lt('due_date', yesterday)

    for (const invoice of overdueInvoices || []) {
      try {
        if (!invoice.customer?.email) continue

        // Check if overdue notice already sent today
        const { data: existingLog } = await supabaseAdmin
          .from('email_logs')
          .select('id')
          .eq('related_id', invoice.id)
          .eq('template_key', 'invoice_overdue')
          .gte('created_at', `${todayStr}T00:00:00`)
          .maybeSingle()

        if (existingLog) continue

        const emailResult = await sendEmailInternal(supabaseAdmin, {
          to: invoice.customer.email,
          template_key: 'invoice_overdue',
          template_vars: {
            customer_name: invoice.customer.full_name,
            invoice_number: invoice.invoice_number || invoice.id,
            due_date: invoice.due_date,
            total: invoice.total,
            currency: invoice.currency || 'TRY',
            days_overdue: Math.floor((now.getTime() - new Date(invoice.due_date).getTime()) / (24 * 60 * 60 * 1000)),
          },
          related_id: invoice.id,
          related_type: 'invoice',
        })

        if (emailResult.success) {
          itemsProcessed++
          console.log(`Sent overdue notice for invoice ${invoice.id} to ${invoice.customer.email}`)
        }
      } catch (err) {
        console.error(`Error sending overdue notice for invoice ${invoice.id}:`, err.message)
      }
    }

    console.log(`Email reminders completed: ${itemsProcessed} emails sent`)

    return new Response(JSON.stringify({ success: true, items_processed: itemsProcessed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Email reminders error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Internal helper to call send-email function
async function sendEmailInternal(
  supabaseAdmin: any,
  params: {
    to: string
    template_key: string
    template_vars: Record<string, any>
    related_id?: string
    related_type?: string
  }
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify(params),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      console.error('send-email error:', err)
      return { success: false }
    }

    return { success: true }
  } catch (err) {
    console.error('Failed to call send-email:', err.message)

    // Fallback: log email in email_logs for manual review
    await supabaseAdmin.from('email_logs').insert({
      to_email: params.to,
      template_key: params.template_key,
      subject: params.template_key === 'invoice_reminder' ? 'Invoice Payment Reminder' : 'Invoice Overdue Notice',
      status: 'pending',
      related_id: params.related_id,
      related_type: params.related_type,
      details: params.template_vars,
    })

    return { success: false }
  }
}
