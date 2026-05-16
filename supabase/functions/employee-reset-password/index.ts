// Supabase Edge Function for resetting employee passwords
// Deploy: supabase functions deploy employee-reset-password

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
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

    // Verify caller is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { employee_id } = await req.json()

    if (!employee_id) {
      throw new Error('employee_id is required')
    }

    // Get employee with profile_id
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, email, full_name, phone, profile_id')
      .eq('id', employee_id)
      .single()

    if (employeeError || !employee) {
      throw new Error(`Employee not found: ${employee_id}`)
    }

    if (!employee.profile_id) {
      throw new Error('Bu çalışanın henüz giriş hesabı yok. Önce hesap oluşturun.')
    }

    // Generate new random password
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '123!'

    // Update auth user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      employee.profile_id,
      { password }
    )

    if (updateError) {
      throw new Error(`Şifre güncellenemedi: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        email: employee.email,
        full_name: employee.full_name,
        password,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('employee-reset-password error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
