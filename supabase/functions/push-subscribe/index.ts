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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ success: false, error: 'Unauthorized' }, 401)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return json({ success: false, error: 'Unauthorized' }, 401)
    }

    const { endpoint, p256dh, auth_key, action } = await req.json()

    if (action === 'unsubscribe') {
      await supabaseAdmin
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('endpoint', endpoint)

      return json({ success: true, message: 'Unsubscribed' })
    }

    if (!endpoint || !p256dh || !auth_key) {
      return json({ success: false, error: 'Missing subscription data' }, 400)
    }

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint,
        p256dh,
        auth_key,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,endpoint' })

    if (error) {
      console.error('push-subscribe error:', error)
      return json({ success: false, error: error.message }, 500)
    }

    // Ensure notification preferences exist
    await supabaseAdmin
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
      }, { onConflict: 'user_id' })

    return json({ success: true })
  } catch (err) {
    return json({ success: false, error: (err as Error).message }, 400)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
