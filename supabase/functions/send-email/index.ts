// Supabase Edge Function - SMTP Email Sender Utility
// Deploy: supabase functions deploy send-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Authenticate: service role key or cron secret
    const authHeader = req.headers.get('Authorization')
    const cronSecret = req.headers.get('x-cron-secret')
    const isServiceRole = authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'NONE')
    const isCronSecret = cronSecret === Deno.env.get('CRON_SECRET')

    // Also allow authenticated admin users
    let isAdmin = false
    if (authHeader && !isServiceRole) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (user) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        isAdmin = profile?.role === 'admin'
      }
    }

    if (!isServiceRole && !isCronSecret && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      to,
      subject,
      html,
      template_key,
      template_vars,
      related_id,
      related_type,
    } = await req.json()

    if (!to) {
      throw new Error('Recipient email (to) is required')
    }

    let emailSubject = subject || ''
    let emailHtml = html || ''

    // If template_key provided, load template from email_templates
    if (template_key) {
      const { data: template } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('key', template_key)
        .eq('is_active', true)
        .maybeSingle()

      if (template) {
        emailSubject = emailSubject || template.subject || ''
        emailHtml = template.html_body || template.body || ''

        // Replace template variables
        if (template_vars && typeof template_vars === 'object') {
          for (const [key, value] of Object.entries(template_vars)) {
            const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
            emailSubject = emailSubject.replace(placeholder, String(value))
            emailHtml = emailHtml.replace(placeholder, String(value))
          }
        }
      } else {
        console.warn(`Email template not found: ${template_key}`)
        // Generate a basic email if template not found
        if (!emailHtml) {
          emailHtml = generateFallbackHtml(template_key, template_vars)
          emailSubject = emailSubject || generateFallbackSubject(template_key)
        }
      }
    }

    if (!emailSubject || !emailHtml) {
      throw new Error('Email subject and body are required (provide directly or via template_key)')
    }

    // Get SMTP settings
    const { data: smtpSettings } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', ['smtp_from_email', 'smtp_from_name'])

    const smtpMap: Record<string, string> = {}
    for (const s of smtpSettings || []) {
      smtpMap[s.key] = s.value
    }

    const fromEmail = smtpMap.smtp_from_email || Deno.env.get('SMTP_FROM_EMAIL') || 'noreply@example.com'
    const fromName = smtpMap.smtp_from_name || Deno.env.get('SMTP_FROM_NAME') || 'Customer Panel'

    let sendStatus = 'pending'
    let sendError = ''

    // Strategy 1: Resend API
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [to],
            subject: emailSubject,
            html: emailHtml,
          }),
        })

        const resendResult = await resendResponse.json()

        if (resendResponse.ok) {
          sendStatus = 'sent'
          console.log(`Email sent via Resend to ${to}: ${resendResult.id}`)
        } else {
          throw new Error(resendResult.message || 'Resend API error')
        }
      } catch (err) {
        console.error('Resend API failed:', err.message)
        sendError = err.message
      }
    }

    // Strategy 2: SMTP Webhook URL
    if (sendStatus !== 'sent') {
      const smtpWebhookUrl = Deno.env.get('SMTP_WEBHOOK_URL')
      if (smtpWebhookUrl) {
        try {
          const webhookResponse = await fetch(smtpWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: `${fromName} <${fromEmail}>`,
              to,
              subject: emailSubject,
              html: emailHtml,
            }),
          })

          if (webhookResponse.ok) {
            sendStatus = 'sent'
            console.log(`Email sent via webhook to ${to}`)
          } else {
            const webhookError = await webhookResponse.text()
            throw new Error(webhookError || 'Webhook error')
          }
        } catch (err) {
          console.error('SMTP webhook failed:', err.message)
          sendError = sendError ? `${sendError}; ${err.message}` : err.message
        }
      }
    }

    // Strategy 3: Fallback - log for manual review
    if (sendStatus !== 'sent') {
      sendStatus = 'pending'
      console.warn(`Email to ${to} could not be sent, logged for manual review`)
    }

    // Log email
    await supabaseAdmin.from('email_logs').insert({
      to_email: to,
      from_email: fromEmail,
      subject: emailSubject,
      template_key: template_key || null,
      status: sendStatus,
      error_message: sendError || null,
      related_id: related_id || null,
      related_type: related_type || null,
    })

    return new Response(JSON.stringify({
      success: sendStatus === 'sent',
      status: sendStatus,
      message: sendStatus === 'sent'
        ? `Email sent to ${to}`
        : `Email queued for manual review (${sendError || 'no mail provider configured'})`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Send email error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generateFallbackSubject(templateKey: string): string {
  const subjects: Record<string, string> = {
    invoice_reminder: 'Invoice Payment Reminder',
    invoice_overdue: 'Invoice Overdue Notice',
    welcome: 'Welcome!',
    password_reset: 'Password Reset Request',
    service_suspended: 'Service Suspended Notice',
    service_terminated: 'Service Termination Notice',
  }
  return subjects[templateKey] || 'Notification'
}

function generateFallbackHtml(templateKey: string, vars: Record<string, any> = {}): string {
  const name = vars.customer_name || 'Customer'

  if (templateKey === 'invoice_reminder') {
    return `
      <h2>Invoice Payment Reminder</h2>
      <p>Dear ${name},</p>
      <p>This is a reminder that invoice <strong>#${vars.invoice_number || ''}</strong>
      for <strong>${vars.total || '0'} ${vars.currency || 'TRY'}</strong>
      is due on <strong>${vars.due_date || ''}</strong>.</p>
      <p>Please make your payment before the due date to avoid any service interruptions.</p>
    `
  }

  if (templateKey === 'invoice_overdue') {
    return `
      <h2>Invoice Overdue Notice</h2>
      <p>Dear ${name},</p>
      <p>Invoice <strong>#${vars.invoice_number || ''}</strong>
      for <strong>${vars.total || '0'} ${vars.currency || 'TRY'}</strong>
      was due on <strong>${vars.due_date || ''}</strong> and is now
      <strong>${vars.days_overdue || '0'} day(s)</strong> overdue.</p>
      <p>Please make your payment immediately to avoid service suspension.</p>
    `
  }

  return `<p>Dear ${name},</p><p>You have a new notification.</p>`
}
