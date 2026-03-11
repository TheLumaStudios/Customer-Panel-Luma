// Supabase Edge Function for listing invoices
// Deploy: supabase functions deploy invoice-list

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

    // Check user role using admin client
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isEmployee = profile?.role === 'employee'
    const isCustomer = profile?.role === 'customer'

    // Parse query parameters
    const url = new URL(req.url)
    const customer_id = url.searchParams.get('customer_id')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Build query using admin client (bypasses RLS)
    let query = supabaseAdmin
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `, { count: 'exact' })

    // Filter by customer
    if ((isAdmin || isEmployee) && customer_id) {
      // Admins and employees can filter by specific customer
      query = query.eq('customer_id', customer_id)
    } else if (isCustomer) {
      // Regular customers can only see their own invoices
      query = query.eq('customer_id', user.id)
    }
    // If admin/employee without customer_id filter, show all invoices

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    }

    // Pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: invoices, error, count } = await query

    if (error) {
      throw error
    }

    // Fetch customer details for each invoice from customers table
    const customerIds = [...new Set(invoices?.map(inv => inv.customer_id) || [])]
    const { data: customers } = await supabaseAdmin
      .from('customers')
      .select('id, full_name, email, customer_code')
      .in('id', customerIds)

    // Map customers to invoices
    const invoicesWithCustomers = invoices?.map(invoice => ({
      ...invoice,
      items: invoice.invoice_items,
      customer: customers?.find(c => c.id === invoice.customer_id) || null
    })) || []

    return new Response(
      JSON.stringify({
        success: true,
        invoices: invoicesWithCustomers,
        total: count,
        limit,
        offset,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Invoice list error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
