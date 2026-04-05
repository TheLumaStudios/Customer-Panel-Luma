// Supabase Edge Function - Cron Runner (Main Dispatcher)
// Deploy: supabase functions deploy cron-runner

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Validate cron secret
    const cronSecret = req.headers.get('x-cron-secret')
    if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get active jobs that need to run
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('cron_jobs')
      .select('*')
      .eq('is_active', true)

    if (jobsError) {
      throw new Error(`Failed to fetch cron jobs: ${jobsError.message}`)
    }

    const now = new Date()
    const results = []

    for (const job of jobs || []) {
      // Check if job needs to run: next_run_at <= now OR last_run_at is null
      if (job.next_run_at && new Date(job.next_run_at) > now && job.last_run_at !== null) {
        continue
      }

      console.log(`Running cron job: ${job.job_name}`)

      // Create log entry
      const { data: log, error: logError } = await supabaseAdmin
        .from('cron_job_logs')
        .insert({ job_id: job.id, job_name: job.job_name, status: 'running' })
        .select()
        .single()

      if (logError) {
        console.error(`Failed to create log for ${job.job_name}:`, logError.message)
        results.push({ job: job.job_name, status: 'log_error', error: logError.message })
        continue
      }

      try {
        // Call the corresponding function
        const functionName = `cron-${job.job_name.replace(/_/g, '-')}`
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'x-cron-secret': Deno.env.get('CRON_SECRET') || '',
            },
            body: JSON.stringify({ triggered_by: 'cron-runner' }),
          }
        )

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `Function returned ${response.status}`)
        }

        // Update log
        await supabaseAdmin.from('cron_job_logs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          items_processed: result.items_processed || 0,
          details: result,
        }).eq('id', log.id)

        // Update job timing
        const nextRun = calculateNextRun(job.schedule, job.interval_minutes)
        await supabaseAdmin.from('cron_jobs').update({
          last_run_at: new Date().toISOString(),
          next_run_at: nextRun,
        }).eq('id', job.id)

        results.push({ job: job.job_name, status: 'completed', items: result.items_processed || 0 })
      } catch (err) {
        console.error(`Cron job ${job.job_name} failed:`, err.message)

        await supabaseAdmin.from('cron_job_logs').update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: err.message,
        }).eq('id', log.id)

        results.push({ job: job.job_name, status: 'failed', error: err.message })
      }
    }

    return new Response(JSON.stringify({ success: true, results, ran_at: now.toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Cron runner error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function calculateNextRun(schedule: string | null, intervalMinutes: number | null): string {
  const now = new Date()
  if (intervalMinutes) {
    return new Date(now.getTime() + intervalMinutes * 60 * 1000).toISOString()
  }
  // Default: run again in 60 minutes
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
}
