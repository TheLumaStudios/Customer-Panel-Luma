// Supabase Edge Function for self-service customer invoice creation
// Deploy: supabase functions deploy invoice-create-self
//
// Differences from invoice-create (admin):
//  - No admin check: anyone authenticated may create an invoice for themselves
//  - customer_id is ALWAYS forced to user.id (client value ignored)
//  - Item type whitelist: hosting | vds | domain | wallet_topup
//  - Server-side re-pricing from product_packages for hosting/vds
//  - Tax rate forced server-side (hosting/vds/domain = 20, wallet_topup = 0)
//  - Currency forced to 'TRY'
//  - wallet_topup bounds: 50 - 10000 TRY
//  - Max 10 items per invoice
//  - Domain: price clamped to safety bounds (10 - 20000 TRY)
//  - On domain items, a row is inserted into domain_orders with contacts + NS

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_TYPES = new Set(['hosting', 'vds', 'domain', 'wallet_topup'])
const BILLING_PERIODS = new Set(['monthly', 'quarterly', 'semi_annual', 'annual'])

const PERIOD_LABEL: Record<string, string> = {
  monthly: 'Aylık',
  quarterly: '3 Aylık',
  semi_annual: '6 Aylık',
  annual: 'Yıllık',
}

const PERIOD_FIELD: Record<string, string> = {
  monthly: 'price_monthly',
  quarterly: 'price_quarterly',
  semi_annual: 'price_semi_annual',
  annual: 'price_annual',
}

const PERIOD_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  semi_annual: 6,
  annual: 12,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ success: false, error: 'Unauthorized' }, 401)
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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return json({ success: false, error: 'Unauthorized' }, 401)
    }

    // Resolve the customers.id for this auth user. Invoices FK to customers(id),
    // NOT profiles/auth. Existing app convention: link by email (see
    // CustomerDashboard). If the customer row doesn't exist yet, auto-create
    // a minimal one so self-service checkout is never blocked.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user.id)
      .maybeSingle()

    const customerEmail = profile?.email || user.email || ''
    let customerRow: { id: string } | null = null

    if (customerEmail) {
      const { data: existing } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle()
      customerRow = existing
    }

    if (!customerRow) {
      // Try lookup by profile_id as a secondary path
      const { data: byProfile } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()
      customerRow = byProfile
    }

    if (!customerRow) {
      // Auto-create a minimal customer row tied to the profile
      const code = `CUST-${Date.now().toString(36).toUpperCase()}`
      const { data: created, error: createErr } = await supabaseAdmin
        .from('customers')
        .insert({
          profile_id: user.id,
          customer_code: code,
          email: customerEmail,
          full_name: profile?.full_name || user.email || 'Müşteri',
          status: 'active',
        })
        .select('id')
        .single()
      if (createErr || !created) {
        console.error('invoice-create-self: auto-create customer failed', createErr)
        return json({ success: false, error: 'Müşteri kaydı oluşturulamadı' }, 500)
      }
      customerRow = created
    }

    const customerId = customerRow.id

    const body = await req.json()
    const rawItems = Array.isArray(body.items) ? body.items : []
    const notesJson = body.notes_json ?? null

    if (rawItems.length === 0) {
      return json({ success: false, error: 'items is required' }, 400)
    }
    if (rawItems.length > 10) {
      return json({ success: false, error: 'max 10 items per invoice' }, 400)
    }

    // --- Build validated invoice items (server-side re-pricing) ---
    const validatedItems: Array<{
      type: string
      description: string
      quantity: number
      unit_price: number
      amount: number
      service_type: string
      package_id?: string
    }> = []

    let hasWalletTopUp = false
    let hasDomain = false
    let hasProduct = false // hosting / vds

    for (const raw of rawItems) {
      const type = String(raw.type || '').toLowerCase()
      if (!ALLOWED_TYPES.has(type)) {
        return json({ success: false, error: `invalid item type: ${type}` }, 400)
      }
      const quantity = Math.max(1, Math.min(10, parseInt(raw.quantity) || 1))

      if (type === 'wallet_topup') {
        hasWalletTopUp = true
        const amount = parseFloat(raw.unit_price)
        if (!Number.isFinite(amount) || amount < 50 || amount > 10000) {
          return json({ success: false, error: 'wallet_topup amount must be 50-10000 TRY' }, 400)
        }
        validatedItems.push({
          type: 'wallet_topup',
          description: raw.description || 'Cüzdana Bakiye Yükleme',
          quantity: 1,
          unit_price: amount,
          amount: amount,
          service_type: 'wallet_topup',
        })
        continue
      }

      if (type === 'domain') {
        hasDomain = true
        const clientPrice = parseFloat(raw.unit_price)
        if (!Number.isFinite(clientPrice) || clientPrice < 10 || clientPrice > 20000) {
          return json({ success: false, error: 'domain price out of allowed range' }, 400)
        }
        // TODO: call reseller pricing API to tighten this (out of scope for M1).
        // For now we clamp to safety bounds and trust client.
        validatedItems.push({
          type: 'domain',
          description: raw.description || 'Domain Kaydı',
          quantity,
          unit_price: clientPrice,
          amount: clientPrice * quantity,
          service_type: 'domain',
        })
        continue
      }

      // hosting / vds → re-price from product_packages
      hasProduct = true
      const packageId = raw.package_id
      const period = String(raw.billing_period || 'monthly')
      if (!packageId) {
        return json({ success: false, error: `${type} item requires package_id` }, 400)
      }
      if (!BILLING_PERIODS.has(period)) {
        return json({ success: false, error: `invalid billing_period: ${period}` }, 400)
      }

      const { data: pkg, error: pkgError } = await supabaseAdmin
        .from('product_packages')
        .select('id, name, product_type, price_monthly, price_quarterly, price_semi_annual, price_annual, is_active')
        .eq('id', packageId)
        .single()

      if (pkgError || !pkg) {
        return json({ success: false, error: `package not found: ${packageId}` }, 400)
      }
      if (!pkg.is_active) {
        return json({ success: false, error: `package inactive: ${pkg.name}` }, 400)
      }

      const priceField = PERIOD_FIELD[period]
      let unitPrice = Number(pkg[priceField as keyof typeof pkg])
      if (!unitPrice || !Number.isFinite(unitPrice)) {
        // Fallback: compute from monthly × months if period column is empty
        const months = PERIOD_MONTHS[period]
        unitPrice = Number(pkg.price_monthly) * months
      }
      if (!unitPrice || unitPrice <= 0) {
        return json({ success: false, error: `no price defined for ${pkg.name}` }, 400)
      }

      // Normalize invoice type: 'vds'/'vps'/'dedicated' → 'vds', anything containing 'hosting' → 'hosting'
      const normalizedType =
        pkg.product_type === 'vds' || pkg.product_type === 'vps' || pkg.product_type === 'dedicated'
          ? 'vds'
          : pkg.product_type?.includes('hosting')
            ? 'hosting'
            : type

      if (normalizedType !== type) {
        return json({
          success: false,
          error: `item type mismatch: requested ${type} but package is ${pkg.product_type}`,
        }, 400)
      }

      validatedItems.push({
        type: normalizedType,
        description: `${pkg.name} — ${PERIOD_LABEL[period]}`,
        quantity,
        unit_price: unitPrice,
        amount: unitPrice * quantity,
        service_type: normalizedType,
        package_id: pkg.id,
      })
    }

    // Mutually-exclusive sanity: wallet_topup must be sole item
    if (hasWalletTopUp && (hasDomain || hasProduct || validatedItems.length > 1)) {
      return json({ success: false, error: 'wallet_topup cannot be combined with other items' }, 400)
    }

    // Tax: hosting/vds/domain = 20, wallet_topup = 0
    const taxRate = hasWalletTopUp ? 0 : 20
    const subtotal = validatedItems.reduce((s, it) => s + it.amount, 0)
    const tax = Math.round((subtotal * taxRate) / 100 * 100) / 100
    const total = Math.round((subtotal + tax) * 100) / 100

    if (total <= 0) {
      return json({ success: false, error: 'invoice total must be positive' }, 400)
    }

    // --- Create invoice ---
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        customer_id: customerId, // resolved from customers table, FK-safe
        status: 'unpaid',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal,
        tax,
        total,
        total_amount: total, // legacy NOT NULL column kept in sync with total
        currency: 'TRY', // forced
        notes: notesJson ? JSON.stringify(notesJson) : null,
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      console.error('invoice-create-self: insert invoice failed', invoiceError)
      return json({ success: false, error: invoiceError?.message || 'insert failed' }, 500)
    }

    const invoiceItemsRows = validatedItems.map(it => ({
      invoice_id: invoice.id,
      type: it.type,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      amount: it.amount,
      // Legacy NOT NULL mirror columns kept in sync with `amount`
      total_price: it.amount,
      total: it.amount,
      service_type: it.service_type,
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .insert(invoiceItemsRows)

    if (itemsError) {
      console.error('invoice-create-self: insert items failed', itemsError)
      await supabaseAdmin.from('invoices').delete().eq('id', invoice.id)
      return json({ success: false, error: itemsError.message }, 500)
    }

    // --- Domain: insert domain_orders row ---
    if (hasDomain && notesJson?.contacts && notesJson?.nameservers) {
      const { error: doError } = await supabaseAdmin
        .from('domain_orders')
        .insert({
          invoice_id: invoice.id,
          customer_id: user.id,
          contacts: notesJson.contacts,
          nameservers: notesJson.nameservers,
          domains: notesJson.domains || validatedItems
            .filter(i => i.type === 'domain')
            .map(i => ({ description: i.description, unit_price: i.unit_price })),
          register_status: 'pending',
        })

      if (doError) {
        console.error('invoice-create-self: domain_orders insert failed', doError)
        // Non-fatal: invoice still valid, admin can inspect logs
      }
    }

    const { data: completeInvoice } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoice.id)
      .single()

    return json({ success: true, invoice: completeInvoice })
  } catch (error) {
    console.error('invoice-create-self error:', error)
    return json({ success: false, error: (error as Error).message }, 400)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
