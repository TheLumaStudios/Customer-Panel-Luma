import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('Admin access required')

    const { customer_id } = await req.json()
    if (!customer_id) throw new Error('customer_id gerekli')

    // Get customer's auth user
    const { data: customer } = await supabaseAdmin.from('customers').select('id, email, full_name').eq('id', customer_id).single()
    if (!customer) throw new Error('Müşteri bulunamadı')

    // Find the auth user for this customer (by email in profiles)
    const { data: customerProfile } = await supabaseAdmin.from('profiles').select('id, email').eq('email', customer.email).single()
    if (!customerProfile) throw new Error('Müşterinin hesabı bulunamadı')

    // Create ghost session record
    const { data: ghostSession } = await supabaseAdmin.from('ghost_sessions').insert({
      admin_id: user.id,
      customer_id: customerProfile.id,
    }).select().single()

    // Generate a magic link for the customer's account
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: customerProfile.email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.supabase.co').replace('https://', 'https://')}/auth/v1/callback?ghost_session=${ghostSession.id}`,
      },
    })

    if (linkError) throw linkError

    return new Response(JSON.stringify({
      success: true,
      // Return the hashed_token so frontend can sign in
      ghost_session_id: ghostSession.id,
      customer_name: customer.full_name,
      customer_email: customer.email,
      magic_link: linkData?.properties?.action_link,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Ghost login error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
