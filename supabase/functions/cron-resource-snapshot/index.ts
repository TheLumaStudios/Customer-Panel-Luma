// Saatlik Resource Monitoring Cron
//
// Tüm aktif hosting hesapları için cPanel'den disk ve bandwidth
// kullanımını çeker, resource_snapshots tablosuna kaydeder.
// Yüksek kullanım tespit edilirse audit_logs'a uyarı yazar.
//
// Deploy: supabase functions deploy cron-resource-snapshot
// Cron: Her saat başı (0 * * * *)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DISK_ALERT_PCT = 90   // %90 üzeri disk → uyarı
const BW_ALERT_PCT   = 80   // %80 üzeri bandwidth → uyarı

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Tüm aktif hosting hesaplarını getir (cpanel_username + server bilgisi ile)
    const { data: accounts, error: accErr } = await supabase
      .from('hosting')
      .select(`
        id, customer_id, cpanel_username, server_id,
        servers:server_id ( id, hostname, port, username, password, use_ssl )
      `)
      .in('status', ['active', 'enabled'])
      .not('cpanel_username', 'is', null)

    if (accErr) throw accErr
    if (!accounts || accounts.length === 0) {
      console.log('[cron-resource-snapshot] No active accounts')
      return new Response(JSON.stringify({ success: true, snapshots: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[cron-resource-snapshot] Processing ${accounts.length} accounts`)

    const baseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const functionsUrl = `${baseUrl.replace('/rest/v1', '')}/functions/v1`
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    let saved = 0
    let failed = 0
    const alerts: string[] = []

    for (const account of accounts) {
      const server = (account as any).servers
      if (!server) {
        console.warn(`[cron-resource-snapshot] No server for hosting ${account.id}`)
        continue
      }

      try {
        // Disk kullanımı
        const diskRes = await fetch(`${functionsUrl}/cpanel-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            server,
            endpoint: '/get_disk_usage',
            method: 'GET',
            params: { 'api.version': 1, user: account.cpanel_username },
          }),
        })
        const diskData = diskRes.ok ? await diskRes.json() : null

        // Bandwidth kullanımı
        const bwRes = await fetch(`${functionsUrl}/cpanel-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            server,
            endpoint: '/showbw',
            method: 'GET',
            params: {
              'api.version': 1,
              searchtype: 'user',
              search: account.cpanel_username,
            },
          }),
        })
        const bwData = bwRes.ok ? await bwRes.json() : null

        // cPanel WHM yanıtını parse et
        const diskInfo = diskData?.data?.disk_usage?.[account.cpanel_username]
          ?? diskData?.disk_usage?.[account.cpanel_username]
        const bwInfo = bwData?.data?.bandwidth?.[account.cpanel_username]
          ?? bwData?.bandwidth?.[account.cpanel_username]

        const diskUsedMb  = diskInfo ? parseFloat(diskInfo.diskused ?? 0) : null
        const diskLimitMb = diskInfo ? parseFloat(diskInfo.disklimit ?? 0) : null
        const inodeUsed   = diskInfo ? parseInt(diskInfo.inodesused ?? 0) : null
        const inodeLimit  = diskInfo ? parseInt(diskInfo.inodeslimit ?? 0) : null

        const bwUsedMb  = bwInfo ? parseFloat(bwInfo.totalbytes ?? 0) / (1024 * 1024) : null
        const bwLimitMb = bwInfo ? parseFloat(bwInfo.limit ?? 0) / (1024 * 1024) : null

        // Snapshot kaydet
        const { error: snapErr } = await supabase
          .from('resource_snapshots')
          .insert({
            hosting_id: account.id,
            customer_id: account.customer_id,
            cpanel_username: account.cpanel_username,
            disk_used_mb: diskUsedMb,
            disk_limit_mb: diskLimitMb,
            bw_used_mb: bwUsedMb,
            bw_limit_mb: bwLimitMb,
            inodes_used: inodeUsed,
            inodes_limit: inodeLimit,
          })

        if (snapErr) {
          console.error(`[cron-resource-snapshot] Snapshot failed for ${account.cpanel_username}:`, snapErr)
          failed++
          continue
        }
        saved++

        // Yüksek kullanım uyarısı
        if (diskUsedMb && diskLimitMb && diskLimitMb > 0) {
          const pct = (diskUsedMb / diskLimitMb) * 100
          if (pct >= DISK_ALERT_PCT) {
            alerts.push(`${account.cpanel_username}: disk %${pct.toFixed(0)}`)
            await supabase.from('audit_logs').insert({
              action: 'resource_alert',
              entity_type: 'hosting',
              entity_id: account.id,
              details: {
                type: 'disk_high',
                cpanel_username: account.cpanel_username,
                disk_pct: pct.toFixed(1),
                disk_used_mb: diskUsedMb,
                disk_limit_mb: diskLimitMb,
              },
            })
          }
        }

        if (bwUsedMb && bwLimitMb && bwLimitMb > 0) {
          const pct = (bwUsedMb / bwLimitMb) * 100
          if (pct >= BW_ALERT_PCT) {
            alerts.push(`${account.cpanel_username}: bandwidth %${pct.toFixed(0)}`)
            await supabase.from('audit_logs').insert({
              action: 'resource_alert',
              entity_type: 'hosting',
              entity_id: account.id,
              details: {
                type: 'bandwidth_high',
                cpanel_username: account.cpanel_username,
                bw_pct: pct.toFixed(1),
                bw_used_mb: bwUsedMb,
                bw_limit_mb: bwLimitMb,
              },
            })
          }
        }
      } catch (err) {
        console.error(`[cron-resource-snapshot] Error for ${account.cpanel_username}:`, err)
        failed++
      }
    }

    const summary = {
      success: true,
      snapshots: saved,
      failed,
      alerts: alerts.length,
      alert_details: alerts,
    }
    console.log('[cron-resource-snapshot] ✅ Done:', summary)

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[cron-resource-snapshot] Fatal error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
