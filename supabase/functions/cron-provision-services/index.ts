// Supabase Edge Function - Process Provisioning Queue
// Deploy: supabase functions deploy cron-provision-services

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

    let itemsProcessed = 0

    // Get pending provisioning queue items
    const { data: queueItems, error: queueError } = await supabaseAdmin
      .from('provisioning_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (queueError) {
      throw new Error(`Failed to fetch provisioning queue: ${queueError.message}`)
    }

    console.log(`Provisioning queue: ${(queueItems || []).length} pending items`)

    for (const item of queueItems || []) {
      // Skip if max attempts exceeded
      const maxAttempts = item.max_attempts || 3
      if ((item.attempts || 0) >= maxAttempts) {
        console.log(`Skipping item ${item.id}: max attempts (${maxAttempts}) exceeded`)
        await supabaseAdmin.from('provisioning_queue').update({
          status: 'failed',
          error_message: `Max attempts (${maxAttempts}) exceeded`,
        }).eq('id', item.id)
        continue
      }

      // Mark as processing and increment attempts
      await supabaseAdmin.from('provisioning_queue').update({
        status: 'processing',
        attempts: (item.attempts || 0) + 1,
        last_attempt_at: new Date().toISOString(),
      }).eq('id', item.id)

      try {
        let functionName = ''
        let payload = {}

        if (item.service_type === 'hosting') {
          functionName = 'cpanel-create-account'
          payload = {
            hosting_id: item.service_id,
            domain: item.metadata?.domain,
            username: item.metadata?.username,
            password: item.metadata?.password,
            package_name: item.metadata?.package_name,
            email: item.metadata?.email,
            server_id: item.metadata?.server_id,
          }
        } else if (item.service_type === 'domain') {
          functionName = 'domain-register'
          payload = {
            domains: item.metadata?.domains || [{
              sld: item.metadata?.sld,
              tld: item.metadata?.tld,
              period: item.metadata?.period || 1,
              contacts: item.metadata?.contacts,
              nameservers: item.metadata?.nameservers,
            }],
            currency: item.metadata?.currency || 'USD',
          }
        } else {
          console.log(`Unknown service type: ${item.service_type}, skipping`)
          await supabaseAdmin.from('provisioning_queue').update({
            status: 'failed',
            error_message: `Unknown service type: ${item.service_type}`,
          }).eq('id', item.id)
          continue
        }

        console.log(`Provisioning ${item.service_type} via ${functionName} for item ${item.id}`)

        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify(payload),
          }
        )

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || `Function returned ${response.status}`)
        }

        // Mark as completed
        await supabaseAdmin.from('provisioning_queue').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: result,
        }).eq('id', item.id)

        console.log(`Provisioned item ${item.id} successfully`)
        itemsProcessed++
      } catch (err) {
        console.error(`Provisioning failed for item ${item.id}:`, err.message)

        const currentAttempts = (item.attempts || 0) + 1
        const maxAttempts = item.max_attempts || 3
        const newStatus = currentAttempts >= maxAttempts ? 'failed' : 'pending'

        await supabaseAdmin.from('provisioning_queue').update({
          status: newStatus,
          error_message: err.message,
        }).eq('id', item.id)
      }
    }

    console.log(`Provisioning completed: ${itemsProcessed} items processed`)

    return new Response(JSON.stringify({ success: true, items_processed: itemsProcessed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Provisioning error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
