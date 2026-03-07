// Supabase Edge Function for creating invoices
// Deploy: supabase functions deploy invoice-create

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

    // Get user from auth token
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const {
      customer_id,
      items, // [{ type, description, quantity, unit_price, service_id?, service_type? }]
      due_date,
      currency = 'USD',
      notes,
      tax_rate = 0, // Tax percentage (e.g., 20 for 20%)
    } = await req.json()

    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error('customer_id and items are required')
    }

    // Calculate amounts
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity || 1) * item.unit_price
    }, 0)

    const tax = (subtotal * tax_rate) / 100
    const total = subtotal + tax

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .insert({
        customer_id,
        status: 'unpaid',
        due_date: due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default: 7 days
        subtotal,
        tax,
        total,
        currency,
        notes,
      })
      .select()
      .single()

    if (invoiceError) {
      throw invoiceError
    }

    // Create invoice items
    const invoiceItems = items.map(item => ({
      invoice_id: invoice.id,
      type: item.type,
      description: item.description,
      quantity: item.quantity || 1,
      unit_price: item.unit_price,
      amount: (item.quantity || 1) * item.unit_price,
      service_id: item.service_id,
      service_type: item.service_type,
    }))

    const { error: itemsError } = await supabaseClient
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      // Rollback invoice if items fail
      await supabaseClient.from('invoices').delete().eq('id', invoice.id)
      throw itemsError
    }

    // Fetch complete invoice with items
    const { data: completeInvoice } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        customer:profiles(id, full_name, email),
        items:invoice_items(*)
      `)
      .eq('id', invoice.id)
      .single()

    console.log('✅ Invoice created:', invoice.invoice_number)

    return new Response(
      JSON.stringify({
        success: true,
        invoice: completeInvoice,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Invoice creation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
