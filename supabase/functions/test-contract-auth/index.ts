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
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    console.log('URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('Anon Key:', supabaseAnonKey ? 'Set' : 'Missing')

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader || '' } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    console.log('User:', user ? user.email : 'None')
    console.log('Error:', userError ? userError.message : 'None')

    // Check role
    let profileRole = null
    if (user) {
      const supabaseAdmin = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      profileRole = profile?.role || null
      console.log('Profile role:', profileRole)
    }

    return new Response(
      JSON.stringify({
        success: true,
        hasAuthHeader: !!authHeader,
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        user: user ? { id: user.id, email: user.email } : null,
        profileRole: profileRole,
        userError: userError ? userError.message : null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
