// Supabase Edge Function for iyzico payment initialization
// Deploy: supabase functions deploy payment-iyzico-init

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

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

    // Admin client bypasses RLS — needed because `invoices.customer_id` FKs
    // to `customers.id`, not auth uid, so the "customers can view own
    // invoices" RLS policy (auth.uid() = customer_id) doesn't match and
    // the user-scoped client returns null. We use the admin client to fetch
    // and then verify ownership via the customers table.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth token
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const {
      invoice_id,
      return_url,
      language = 'tr',
    } = await req.json()

    if (!invoice_id) {
      throw new Error('invoice_id is required')
    }

    // Get invoice details (admin client bypasses RLS)
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    // Verify ownership: invoice.customer_id references customers.id; link
    // through customers.profile_id (or email) to ensure this auth user
    // actually owns the invoice before we initialise a payment for it.
    const { data: invoiceCustomer } = await supabaseAdmin
      .from('customers')
      .select('id, profile_id, email')
      .eq('id', invoice.customer_id)
      .maybeSingle()

    const ownsViaProfile = invoiceCustomer?.profile_id === user.id
    const ownsViaEmail = invoiceCustomer?.email && invoiceCustomer.email === user.email
    if (!invoiceCustomer || (!ownsViaProfile && !ownsViaEmail)) {
      throw new Error('Bu fatura size ait değil')
    }

    // Get user profile (admin client for RLS bypass)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    // Get default billing address
    const { data: billingAddress } = await supabaseAdmin
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', user.id)
      .eq('type', 'billing')
      .eq('is_default', true)
      .maybeSingle()

    // Get default shipping address (fallback to billing if not exists)
    const { data: shippingAddress } = await supabaseAdmin
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', user.id)
      .eq('type', 'shipping')
      .eq('is_default', true)
      .maybeSingle()

    // iyzico configuration
    const IYZICO_API_KEY = Deno.env.get('IYZICO_API_KEY')
    const IYZICO_SECRET_KEY = Deno.env.get('IYZICO_SECRET_KEY')
    const IYZICO_BASE_URL = Deno.env.get('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com'

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      throw new Error('iyzico credentials not configured')
    }

    // Generate conversation ID
    const conversationId = `${invoice_id}-${Date.now()}`

    // Prepare basket items
    const basketItems = invoice.items.map((item: any) => ({
      id: item.id,
      name: item.description.substring(0, 100), // Max 100 chars
      category1: item.type,
      itemType: 'VIRTUAL',
      price: item.amount.toFixed(2),
    }))

    // Wallet top-ups must be single-payment only: taksitli olarak cüzdana
    // para yüklemek mantıksız (komisyon + iade riski). Sunucu tarafında
    // zorla kapatıyoruz, client bayrağıyla açılamaz.
    const isWalletTopUp = invoice.items.some((i: any) => i.type === 'wallet_topup')
    const enabledInstallments = isWalletTopUp ? [1] : [1, 2, 3, 6, 9]

    // Calculate price (iyzico requires string with 2 decimals)
    const price = invoice.total.toFixed(2)
    const paidPrice = invoice.total.toFixed(2) // Including fees

    // Safe fallbacks so missing profile/address rows never crash the buyer block
    const safeProfile = {
      id: profile?.id || user.id,
      email: profile?.email || user.email || 'noreply@example.com',
      full_name: profile?.full_name || invoiceCustomer?.email || 'Müşteri',
      phone: (profile as any)?.phone || '',
    }

    // Build request payload
    const requestPayload = {
      locale: language.toUpperCase(),
      conversationId,
      price,
      paidPrice,
      currency: invoice.currency || 'TRY',
      basketId: invoice.invoice_number,
      paymentGroup: 'PRODUCT',
      callbackUrl: return_url || `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-iyzico-callback`,
      enabledInstallments,
      buyer: {
        id: safeProfile.id,
        name: (billingAddress?.contact_name || safeProfile.full_name)?.split(' ')[0] || 'Ad',
        surname: (billingAddress?.contact_name || safeProfile.full_name)?.split(' ').slice(1).join(' ') || 'Soyad',
        gsmNumber: billingAddress?.phone || safeProfile.phone || '+905350000000',
        email: safeProfile.email,
        identityNumber: billingAddress?.identity_number || '11111111111', // TR kimlik no
        registrationAddress: billingAddress?.address_line1 || 'Adres bilgisi yok',
        ip: req.headers.get('x-forwarded-for') || '85.34.78.112',
        city: billingAddress?.city || 'Istanbul',
        country: billingAddress?.country || 'Turkey',
        zipCode: billingAddress?.postal_code || '34732',
      },
      shippingAddress: {
        contactName: shippingAddress?.contact_name || billingAddress?.contact_name || safeProfile.full_name || 'Müşteri',
        city: shippingAddress?.city || billingAddress?.city || 'Istanbul',
        country: shippingAddress?.country || billingAddress?.country || 'Turkey',
        address: shippingAddress?.address_line1 || billingAddress?.address_line1 || 'Adres bilgisi yok',
        zipCode: shippingAddress?.postal_code || billingAddress?.postal_code || '34732',
      },
      billingAddress: {
        contactName: billingAddress?.contact_name || safeProfile.full_name || 'Müşteri',
        city: billingAddress?.city || 'Istanbul',
        country: billingAddress?.country || 'Turkey',
        address: billingAddress?.address_line1 || 'Adres bilgisi yok',
        zipCode: billingAddress?.postal_code || '34732',
      },
      basketItems,
    }

    console.log('🔐 Initializing iyzico payment:', conversationId)

    // --- iyzico v2 auth signature ---
    // Spec:
    //   signature = HMAC-SHA256(secret, randomKey + uri + requestBody).hex()
    //   authString = `apiKey:<key>&randomKey:<rnd>&signature:<hex>`
    //   header     = `IYZWSv2 ` + base64(authString)
    const iyzicoUri = '/payment/iyzipos/checkoutform/initialize/auth/ecom'
    const randomString = crypto.randomUUID().replace(/-/g, '')
    const requestString = JSON.stringify(requestPayload)
    const dataToSign = randomString + iyzicoUri + requestString

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(IYZICO_SECRET_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBytes = new Uint8Array(
      await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign))
    )
    const signatureHex = Array.from(signatureBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const authString = `apiKey:${IYZICO_API_KEY}&randomKey:${randomString}&signature:${signatureHex}`
    const authorization = `IYZWSv2 ${base64Encode(encoder.encode(authString))}`

    // Call iyzico API
    const response = await fetch(`${IYZICO_BASE_URL}${iyzicoUri}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'x-iyzi-rnd': randomString,
      },
      body: requestString,
    })

    const result = await response.json()

    console.log('📥 iyzico Response:', JSON.stringify(result))

    if (result.status !== 'success') {
      // Surface every bit of context iyzico gave us so we can debug auth /
      // signature / param issues from the client-side toast.
      const detail = [result.errorCode, result.errorMessage, result.errorGroup]
        .filter(Boolean)
        .join(' | ')
      throw new Error(`iyzico: ${detail || 'payment initialization failed'}`)
    }

    // Save payment record (admin client to avoid RLS gotchas)
    await supabaseAdmin
      .from('payments')
      .insert({
        customer_id: user.id,
        invoice_id: invoice.id,
        amount: invoice.total,
        currency: invoice.currency,
        payment_method: 'iyzico',
        gateway_transaction_id: result.token,
        status: 'pending',
        notes: `iyzico conversation: ${conversationId}`,
      })

    return new Response(
      JSON.stringify({
        success: true,
        paymentPageUrl: result.paymentPageUrl,
        token: result.token,
        checkoutFormContent: result.checkoutFormContent, // HTML iframe content
        conversationId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('iyzico payment init error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
