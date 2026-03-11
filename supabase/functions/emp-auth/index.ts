// Supabase Edge Function for creating employee auth accounts
// Deploy: supabase functions deploy employee-create-auth

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Log all requests
  console.log('🌐 Incoming request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    console.log('🔑 Auth header:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'MISSING')

    // Check env variables
    const hasUrl = !!Deno.env.get('SUPABASE_URL')
    const hasServiceKey = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const hasAnonKey = !!Deno.env.get('SUPABASE_ANON_KEY')
    console.log('🔧 Env check:', { hasUrl, hasServiceKey, hasAnonKey })

    if (!authHeader) {
      console.error('❌ No auth header provided')
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

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

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { employee_id, email, full_name } = await req.json()

    console.log('📝 Employee auth creation request:', { employee_id, email })

    if (!employee_id || !email || !full_name) {
      throw new Error('employee_id, email, and full_name are required')
    }

    // Check if employee exists
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, profile_id')
      .eq('id', employee_id)
      .single()

    if (employeeError || !employee) {
      console.error('❌ Employee not found:', employee_id, employeeError)
      throw new Error(`Employee not found: ${employee_id}`)
    }

    if (employee.profile_id) {
      throw new Error('Employee already has a login account')
    }

    console.log('✅ Employee found:', employee_id)

    // Generate random password
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '123!'

    console.log('🔐 Creating auth user...')
    // Create auth user
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'employee'
      }
    })

    if (createError) {
      console.error('❌ Auth user creation error:', createError)
      throw new Error(`Failed to create auth user: ${createError.message}`)
    }

    console.log('✅ Auth user created:', authUser.user.id)

    // Create profile
    console.log('📄 Creating profile...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        role: 'employee',
      })

    if (profileError) {
      console.error('❌ Profile creation error:', profileError)
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    console.log('✅ Profile created')

    // Update employee with profile_id
    console.log('🔗 Linking employee to profile...')
    const { error: updateError } = await supabaseAdmin
      .from('employees')
      .update({ profile_id: authUser.user.id })
      .eq('id', employee_id)

    if (updateError) {
      console.error('❌ Employee link error:', updateError)
      throw new Error(`Failed to link employee: ${updateError.message}`)
    }

    console.log('✅ Employee auth created successfully')
    console.log('📤 Returning result to client')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Employee account created successfully',
        email,
        password,
        profile_id: authUser.user.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Employee auth creation error:', error)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
