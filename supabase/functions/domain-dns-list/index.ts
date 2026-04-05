// Supabase Edge Function for listing DNS records
// Deploy: supabase functions deploy domain-dns-list

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

    const { domain_name } = await req.json()
    if (!domain_name) throw new Error('domain_name is required')

    // Check domain ownership
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    const { data: domain } = await supabaseClient.from('domains').select('id, customer_id').eq('domain_name', domain_name).single()
    if (!isAdmin && domain?.customer_id !== user.id) throw new Error('Unauthorized')

    // Resellers Panel API credentials
    const RP_USERNAME = Deno.env.get('RP_USERNAME')
    const RP_PASSWORD = Deno.env.get('RP_PASSWORD')
    const RP_API_URL = Deno.env.get('RP_API_URL') || 'https://api.duoservers.com'

    if (!RP_USERNAME || !RP_PASSWORD) throw new Error('Resellers Panel credentials not configured')

    // Fetch DNS zone from Resellers Panel API
    const params = new URLSearchParams({
      auth_username: RP_USERNAME,
      auth_password: RP_PASSWORD,
      section: 'domain',
      command: 'get_dns_zone',
      return_type: 'json',
      domain: domain_name,
    })

    const response = await fetch(`${RP_API_URL}/?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) throw new Error(`API returned ${response.status}: ${response.statusText}`)

    const apiData = await response.json()
    const responseData = apiData['1'] || apiData

    if (responseData.error_code && responseData.error_code !== 0) {
      throw new Error(`API Error ${responseData.error_code}: ${responseData.error_msg}`)
    }

    // Fetch local DNS records
    const { data: localRecords } = await supabaseClient
      .from('dns_records')
      .select('*')
      .eq('domain_id', domain?.id)

    return new Response(
      JSON.stringify({
        success: true,
        domain_name,
        api_records: responseData.records || responseData,
        local_records: localRecords || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('DNS list error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
