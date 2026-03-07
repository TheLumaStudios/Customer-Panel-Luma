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

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    // Check if already paid
    if (invoice.status === 'paid') {
      throw new Error('Invoice already paid')
    }

    // Check authorization (admin or own invoice)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    if (!isAdmin && invoice.customer_id !== user.id) {
      throw new Error('Unauthorized to pay this invoice')
    }

    // Handle wallet payment
    if (payment_method === 'wallet') {
      // Get customer credit
      const { data: credit } = await supabaseClient
        .from('customer_credit')
        .select('*')
        .eq('customer_id', invoice.customer_id)
        .single()

      if (!credit || credit.balance < invoice.total) {
        throw new Error('Insufficient wallet balance')
      }

      // Deduct from wallet
      const newBalance = credit.balance - invoice.total

      const { error: creditError } = await supabaseClient
        .from('customer_credit')
        .update({ balance: newBalance })
        .eq('customer_id', invoice.customer_id)

      if (creditError) {
        throw creditError
      }

      // Record credit transaction
      await supabaseClient
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

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
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
      throw paymentError
    }

    // Update invoice status
    const { error: updateError } = await supabaseClient
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
    const { data: updatedInvoice } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        customer:profiles(id, full_name, email),
        items:invoice_items(*)
      `)
      .eq('id', invoice.id)
      .single()

    console.log('✅ Invoice paid:', invoice.invoice_number, 'Method:', payment_method)

    return new Response(
      JSON.stringify({
        success: true,
        invoice: updatedInvoice,
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
