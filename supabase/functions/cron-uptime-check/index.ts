import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get active servers
    const { data: servers } = await supabase
      .from('servers')
      .select('id, name, ip_address, hostname')
      .eq('status', 'active')

    if (!servers || servers.length === 0) {
      return json({ success: true, message: 'No active servers to check' })
    }

    const results = []

    for (const server of servers) {
      const target = server.hostname || server.ip_address
      if (!target) continue

      let status = 'down'
      let responseTime = 0

      try {
        const start = Date.now()
        const res = await fetch(`http://${target}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000),
        })
        responseTime = Date.now() - start
        status = res.ok ? 'up' : 'degraded'
      } catch {
        status = 'down'
        responseTime = 0
      }

      // Record check
      await supabase.from('uptime_checks').insert({
        server_id: server.id,
        status,
        response_time_ms: responseTime,
        check_location: 'eu-west',
      })

      // Update server_status
      const statusMap: Record<string, string> = {
        up: 'operational',
        degraded: 'degraded',
        down: 'major_outage',
      }

      await supabase
        .from('server_status')
        .upsert({
          server_id: server.id,
          server_name: server.name,
          status: statusMap[status] || 'operational',
          message: status === 'down' ? `${server.name} yanıt vermiyor` : null,
          last_checked: new Date().toISOString(),
        }, { onConflict: 'server_id' })

      // Auto-create incident on downtime
      if (status === 'down') {
        // Check if there's already an active incident for this server
        const { data: existingIncident } = await supabase
          .from('incidents')
          .select('id')
          .contains('affected_servers', [server.id])
          .neq('status', 'resolved')
          .maybeSingle()

        if (!existingIncident) {
          await supabase.from('incidents').insert({
            title: `${server.name} Kesintisi`,
            description: `${server.name} sunucusu yanıt vermiyor. Otomatik tespit edildi.`,
            status: 'investigating',
            severity: 'major',
            affected_servers: [server.id],
          })
        }
      }

      results.push({ server: server.name, status, responseTime })
    }

    return json({ success: true, checks: results })
  } catch (err) {
    console.error('cron-uptime-check error:', err)
    return json({ success: false, error: (err as Error).message }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
