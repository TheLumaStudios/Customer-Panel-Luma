// Supabase Edge Function for checking domain transfer status
// Deploy: supabase functions deploy domain-transfer-status

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
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { transfer_id } = await req.json()
    if (!transfer_id) throw new Error('transfer_id is required')

    // Check ownership
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    const { data: transfer, error: transferError } = await supabaseClient
      .from('domain_transfers')
      .select('*')
      .eq('id', transfer_id)
      .single()

    if (transferError || !transfer) throw new Error('Transfer not found')
    if (!isAdmin && transfer.customer_id !== user.id) throw new Error('Unauthorized')

    // Optionally check Resellers Panel API for live status
    let apiStatus = null
    if (transfer.registrar_order_id) {
      const RP_USERNAME = Deno.env.get('RP_USERNAME')
      const RP_PASSWORD = Deno.env.get('RP_PASSWORD')
      const RP_API_URL = Deno.env.get('RP_API_URL') || 'https://api.duoservers.com'

      if (RP_USERNAME && RP_PASSWORD) {
        try {
          const params = new URLSearchParams({
            auth_username: RP_USERNAME,
            auth_password: RP_PASSWORD,
            section: 'domain',
            command: 'get_transfer_status',
            return_type: 'json',
            domain: transfer.domain_name,
          })

          const response = await fetch(`${RP_API_URL}/?${params.toString()}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          })

          if (response.ok) {
            const apiData = await response.json()
            apiStatus = apiData['1'] || apiData

            // Update local status if API provides one
            if (apiStatus.status && apiStatus.status !== transfer.status) {
              await supabaseClient
                .from('domain_transfers')
                .update({ status: apiStatus.status, updated_at: new Date().toISOString() })
                .eq('id', transfer_id)

              transfer.status = apiStatus.status
            }
          }
        } catch (apiError) {
          console.error('API status check failed:', apiError)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: transfer.id,
        domain_name: transfer.domain_name,
        status: transfer.status,
        details: {
          created_at: transfer.created_at,
          updated_at: transfer.updated_at,
          registrar_order_id: transfer.registrar_order_id,
          api_status: apiStatus,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Transfer status error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
