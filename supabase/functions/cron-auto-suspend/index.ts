// Supabase Edge Function - Auto Suspend Services with Overdue Invoices
// Deploy: supabase functions deploy cron-auto-suspend

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
      .in('key', ['auto_suspend_enabled', 'auto_suspend_days_overdue'])

    const settingsMap: Record<string, string> = {}
    for (const s of settings || []) {
      settingsMap[s.key] = s.value
    }

    if (settingsMap.auto_suspend_enabled !== 'true') {
      return new Response(JSON.stringify({ success: true, items_processed: 0, message: 'Auto suspend disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const daysOverdue = parseInt(settingsMap.auto_suspend_days_overdue || '7')
    const cutoffDate = new Date(Date.now() - daysOverdue * 24 * 60 * 60 * 1000).toISOString()
    let itemsProcessed = 0

    console.log(`Auto-suspend: checking invoices overdue before ${cutoffDate}`)

    // Find overdue invoices linked to services
    const { data: overdueInvoices } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('status', 'unpaid')
      .lt('due_date', cutoffDate)
      .not('related_service_id', 'is', null)
      .eq('related_service_type', 'hosting')

    for (const invoice of overdueInvoices || []) {
      try {
        // Get hosting record with server details
        const { data: hosting, error: hostingError } = await supabaseAdmin
          .from('hosting')
          .select('*, server:servers(*)')
          .eq('id', invoice.related_service_id)
          .eq('status', 'active')
          .maybeSingle()

        if (hostingError || !hosting) {
          console.log(`Hosting ${invoice.related_service_id} not found or not active, skipping`)
          continue
        }

        if (!hosting.cpanel_username) {
          console.log(`Hosting ${hosting.id} has no cPanel username, skipping WHM call`)
          // Still mark as suspended in DB
          await supabaseAdmin.from('hosting').update({
            status: 'suspended',
            suspended_at: new Date().toISOString(),
          }).eq('id', hosting.id)
          itemsProcessed++
          continue
        }

        // WHM API to suspend account
        const WHM_HOST = hosting.server?.hostname || Deno.env.get('WHM_HOST')
        const WHM_USER = hosting.server?.username || Deno.env.get('WHM_USERNAME') || 'root'
        const WHM_TOKEN = hosting.server?.api_token || Deno.env.get('WHM_API_TOKEN')

        if (!WHM_HOST || !WHM_TOKEN) {
          console.error(`WHM credentials not configured for hosting ${hosting.id}`)
          continue
        }

        const params = new URLSearchParams({
          user: hosting.cpanel_username,
          reason: `Payment overdue - Invoice #${invoice.invoice_number || invoice.id}`,
        })

        const whmUrl = `https://${WHM_HOST}:2087/json-api/suspendacct?${params.toString()}`

        console.log(`Suspending cPanel account: ${hosting.cpanel_username}`)

        const response = await fetch(whmUrl, {
          method: 'GET',
          headers: {
            'Authorization': `WHM ${WHM_USER}:${WHM_TOKEN}`,
          },
        })

        const result = await response.json()

        if (result.metadata?.result !== 1) {
          console.error(`WHM suspend failed for ${hosting.cpanel_username}:`, result.metadata?.reason)
          continue
        }

        // Update hosting status
        await supabaseAdmin.from('hosting').update({
          status: 'suspended',
          suspended_at: new Date().toISOString(),
        }).eq('id', hosting.id)

        console.log(`Suspended hosting ${hosting.id} (${hosting.cpanel_username})`)
        itemsProcessed++
      } catch (err) {
        console.error(`Error suspending service for invoice ${invoice.id}:`, err.message)
      }
    }

    console.log(`Auto-suspend completed: ${itemsProcessed} services suspended`)

    return new Response(JSON.stringify({ success: true, items_processed: itemsProcessed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Auto-suspend error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
