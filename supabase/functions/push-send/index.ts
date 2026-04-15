import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64url } from 'https://deno.land/std@0.168.0/encoding/base64url.ts'

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

    const { user_id, user_ids, type, title, body } = await req.json()

    if (!title) {
      return json({ success: false, error: 'title is required' }, 400)
    }

    const targetIds = user_ids || (user_id ? [user_id] : [])
    if (targetIds.length === 0) {
      return json({ success: false, error: 'user_id or user_ids required' }, 400)
    }

    // Check notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .in('user_id', targetIds)

    const prefsMap = new Map(prefs?.map((p: any) => [p.user_id, p]) || [])

    // Filter users who have this notification type enabled
    const filteredIds = targetIds.filter((uid: string) => {
      const pref = prefsMap.get(uid)
      if (!pref) return true // Default: all enabled
      if (type && type in pref) return pref[type]
      return true
    })

    // Get active subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', filteredIds)
      .eq('is_active', true)

    if (!subscriptions || subscriptions.length === 0) {
      return json({ success: true, sent: 0, message: 'No active subscriptions' })
    }

    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@lumayazilim.com'

    const payload = JSON.stringify({
      title,
      body: body || '',
      icon: '/luma.png',
      badge: '/luma.png',
      data: { type, url: '/dashboard' },
    })

    let sent = 0
    let failed = 0

    for (const sub of subscriptions) {
      try {
        // Simple fetch to push endpoint with payload
        // In production, use web-push library with VAPID
        const pushRes = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'TTL': '86400',
          },
          body: payload,
        })

        if (pushRes.ok || pushRes.status === 201) {
          sent++
        } else if (pushRes.status === 410) {
          // Subscription expired
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', sub.id)
          failed++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    // Log notifications
    for (const uid of filteredIds) {
      await supabase.from('notification_log').insert({
        user_id: uid,
        type: type || 'general',
        title,
        body: body || '',
        status: 'sent',
      })
    }

    return json({ success: true, sent, failed })
  } catch (err) {
    console.error('push-send error:', err)
    return json({ success: false, error: (err as Error).message }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
