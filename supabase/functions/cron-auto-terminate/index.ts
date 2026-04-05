// Supabase Edge Function - Auto Terminate Long-Suspended Services
// Deploy: supabase functions deploy cron-auto-terminate

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
      .in('key', ['auto_terminate_enabled', 'auto_terminate_days_suspended'])

    const settingsMap: Record<string, string> = {}
    for (const s of settings || []) {
      settingsMap[s.key] = s.value
    }

    if (settingsMap.auto_terminate_enabled === 'false') {
      return new Response(JSON.stringify({ success: true, items_processed: 0, message: 'Auto terminate disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const daysSuspended = parseInt(settingsMap.auto_terminate_days_suspended || '30')
    const cutoffDate = new Date(Date.now() - daysSuspended * 24 * 60 * 60 * 1000).toISOString()
    let itemsProcessed = 0

    console.log(`Auto-terminate: checking hosting suspended before ${cutoffDate}`)

    // Find long-suspended hosting services
    const { data: suspendedHosting } = await supabaseAdmin
      .from('hosting')
      .select('*, server:servers(*)')
      .eq('status', 'suspended')
      .lt('suspended_at', cutoffDate)

    for (const hosting of suspendedHosting || []) {
      try {
        if (!hosting.cpanel_username) {
          console.log(`Hosting ${hosting.id} has no cPanel username, marking as terminated`)
          await supabaseAdmin.from('hosting').update({
            status: 'terminated',
          }).eq('id', hosting.id)
          itemsProcessed++
          continue
        }

        // WHM API to terminate account
        const WHM_HOST = hosting.server?.hostname || Deno.env.get('WHM_HOST')
        const WHM_USER = hosting.server?.username || Deno.env.get('WHM_USERNAME') || 'root'
        const WHM_TOKEN = hosting.server?.api_token || Deno.env.get('WHM_API_TOKEN')

        if (!WHM_HOST || !WHM_TOKEN) {
          console.error(`WHM credentials not configured for hosting ${hosting.id}`)
          continue
        }

        const params = new URLSearchParams({
          user: hosting.cpanel_username,
          keepdns: '0',
        })

        const whmUrl = `https://${WHM_HOST}:2087/json-api/removeacct?${params.toString()}`

        console.log(`Terminating cPanel account: ${hosting.cpanel_username}`)

        const response = await fetch(whmUrl, {
          method: 'GET',
          headers: {
            'Authorization': `WHM ${WHM_USER}:${WHM_TOKEN}`,
          },
        })

        const result = await response.json()

        if (result.metadata?.result !== 1) {
          console.error(`WHM terminate failed for ${hosting.cpanel_username}:`, result.metadata?.reason)
          continue
        }

        // Update hosting status
        await supabaseAdmin.from('hosting').update({
          status: 'terminated',
          cpanel_username: null,
          cpanel_password: null,
        }).eq('id', hosting.id)

        console.log(`Terminated hosting ${hosting.id} (${hosting.cpanel_username})`)
        itemsProcessed++
      } catch (err) {
        console.error(`Error terminating hosting ${hosting.id}:`, err.message)
      }
    }

    console.log(`Auto-terminate completed: ${itemsProcessed} services terminated`)

    return new Response(JSON.stringify({ success: true, items_processed: itemsProcessed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Auto-terminate error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
