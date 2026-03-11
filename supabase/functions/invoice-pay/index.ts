// Supabase Edge Function for paying invoices
// Deploy: supabase functions deploy invoice-pay

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

    const {
      invoice_id,
      payment_method, // 'wallet', 'iyzico', 'paytr', 'bank_transfer'
      transaction_id,
      gateway_response,
      notes,
    } = await req.json()

    if (!invoice_id || !payment_method) {
      throw new Error('invoice_id and payment_method are required')
    }

    // Get invoice using admin client
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      console.error('❌ Invoice not found:', invoice_id, invoiceError)
      throw new Error('Invoice not found')
    }

    console.log('📄 Found invoice:', invoice.invoice_number, 'customer_id:', invoice.customer_id)

    // Verify customer exists in customers table
    const { data: customerData, error: customerCheckError } = await supabaseAdmin
      .from('customers')
      .select('id, full_name, email, customer_code')
      .eq('id', invoice.customer_id)
      .single()

    if (customerCheckError || !customerData) {
      console.error('❌ Customer not found for customer_id:', invoice.customer_id, customerCheckError)
      throw new Error(`Customer not found: ${invoice.customer_id}`)
    }

    console.log('✅ Customer found:', customerData.full_name, customerData.email)

    // Check if already paid
    if (invoice.status === 'paid') {
      throw new Error('Invoice already paid')
    }

    // Check authorization (admin or own invoice)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    if (!isAdmin && invoice.customer_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized to pay this invoice' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle wallet payment
    if (payment_method === 'wallet') {
      // Get customer credit
      const { data: credit } = await supabaseAdmin
        .from('customer_credit')
        .select('*')
        .eq('customer_id', invoice.customer_id)
        .single()

      if (!credit || credit.balance < invoice.total) {
        throw new Error('Insufficient wallet balance')
      }

      // Deduct from wallet
      const newBalance = credit.balance - invoice.total

      const { error: creditError } = await supabaseAdmin
        .from('customer_credit')
        .update({ balance: newBalance })
        .eq('customer_id', invoice.customer_id)

      if (creditError) {
        throw creditError
      }

      // Record credit transaction
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          customer_id: invoice.customer_id,
          type: 'debit',
          amount: invoice.total,
          currency: invoice.currency,
          invoice_id: invoice.id,
          description: `Payment for invoice ${invoice.invoice_number}`,
          balance_after: newBalance,
        })
    }

    // Create payment record using admin client
    console.log('💳 Creating payment record for customer_id:', invoice.customer_id)
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        customer_id: invoice.customer_id,
        invoice_id: invoice.id,
        amount: invoice.total,
        currency: invoice.currency,
        payment_method,
        gateway_transaction_id: transaction_id,
        gateway_response,
        status: 'completed',
        notes,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('❌ Payment creation error:', paymentError)
      throw paymentError
    }

    console.log('✅ Payment created successfully:', payment.id)

    // Update invoice status using admin client
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        payment_method,
        transaction_id,
      })
      .eq('id', invoice.id)

    if (updateError) {
      throw updateError
    }

    // Fetch updated invoice
    const { data: updatedInvoice } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .eq('id', invoice.id)
      .single()

    // Fetch customer details
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, full_name, email, customer_code')
      .eq('id', updatedInvoice.customer_id)
      .single()

    const invoiceWithCustomer = {
      ...updatedInvoice,
      items: updatedInvoice.invoice_items,
      customer
    }

    console.log('✅ Invoice paid:', invoice.invoice_number, 'Method:', payment_method)

    return new Response(
      JSON.stringify({
        success: true,
        invoice: invoiceWithCustomer,
        payment,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Invoice payment error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
