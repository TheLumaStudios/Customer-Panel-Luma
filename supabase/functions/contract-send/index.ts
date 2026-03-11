// Supabase Edge Function for sending contracts
// Deploy: supabase functions deploy contract-send

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SHA-256 hash hesaplama
async function calculateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!

    // Create admin client for operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user with auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user from auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user is admin or employee
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'employee'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin or employee access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const {
      customer_id,
      template_id,
      service_type, // Optional: hosting, domain, vds, vps
      service_id, // Optional: related service ID
      expires_in_days = 30, // Default 30 days
    } = await req.json()

    console.log('📧 Sending contract to customer:', customer_id)

    if (!customer_id || !template_id) {
      throw new Error('customer_id and template_id are required')
    }

    // Get template (active or draft)
    const { data: template, error: templateError } = await supabaseAdmin
      .from('contract_templates')
      .select('*')
      .eq('id', template_id)
      .in('status', ['active', 'draft'])
      .single()

    if (templateError || !template) {
      console.error('❌ Template not found:', template_id, templateError)
      throw new Error('Template not found or archived')
    }

    console.log('✅ Template found:', template.name)

    // Verify customer exists
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, full_name, email')
      .eq('id', customer_id)
      .single()

    if (customerError || !customer) {
      console.error('❌ Customer not found:', customer_id, customerError)
      throw new Error('Customer not found')
    }

    console.log('✅ Customer found:', customer.full_name)

    // Calculate contract content hash
    const contractHash = await calculateSHA256(template.content)

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expires_in_days)

    // Send contract to customer
    const { data: customerContract, error: contractError } = await supabaseAdmin
      .from('customer_contracts')
      .insert({
        customer_id,
        template_id,
        contract_content: template.content,
        contract_hash: contractHash,
        version: template.version,
        service_type: service_type || null,
        service_id: service_id || null,
        status: 'pending',
        is_mandatory: template.is_mandatory,
        sent_by: user.id,
        sent_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (contractError) {
      console.error('❌ Failed to insert contract:', contractError)
      throw contractError
    }

    console.log('✅ Contract sent successfully:', customerContract.id)

    // Create history record
    await supabaseAdmin
      .from('contract_history')
      .insert({
        customer_contract_id: customerContract.id,
        action: 'sent',
        old_status: null,
        new_status: 'pending',
        performed_by: user.id,
        details: {
          template_name: template.name,
          sent_to: customer.email,
          expires_at: expiresAt.toISOString(),
        },
      })

    return new Response(
      JSON.stringify({
        success: true,
        contract: customerContract,
        message: 'Contract sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Contract send error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
