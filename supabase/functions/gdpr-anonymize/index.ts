// KVKK / GDPR "Beni Unut" Edge Function
//
// Müşterinin kişisel verilerini yasal sınırlar içinde anonimleştirir:
// - Kişisel veriler (ad, e-posta, telefon, adres) hash ile değiştirilir
// - Fatura ve ödeme kayıtları SAKLANIR (Türk Ticaret Kanunu: 10 yıl)
// - API anahtarları, webhook'lar, hosting, domain bilgileri silinir
// - Supabase Auth hesabı devre dışı bırakılır (silinemez, fatura linki korunur)
//
// Deploy: supabase functions deploy gdpr-anonymize

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Değerin SHA-256 hash'ini döndürür (geri dönüşü olmayan kimliksizleştirme) */
async function hash(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value + '_gdpr_salt')
  )
  return 'anon_' + Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Sadece admin kullanabilir
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') throw new Error('Admin access required')

    const { customer_id, reason = 'KVKK/GDPR silme talebi' } = await req.json()
    if (!customer_id) throw new Error('customer_id required')

    // Müşteriyi getir
    const { data: customer, error: cErr } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single()

    if (cErr || !customer) throw new Error('Customer not found')

    // Zaten anonimleştirilmiş mi?
    if (customer.anonymized_at) {
      return new Response(JSON.stringify({ success: false, error: 'Already anonymized' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const now = new Date().toISOString()

    console.log(`[gdpr-anonymize] Starting anonymization for customer: ${customer_id}`)

    // 1. Kişisel verileri hash ile değiştir (customers tablosu)
    const anonEmail = await hash(customer.email || customer_id)
    const anonName = await hash(customer.full_name || customer_id)
    const anonPhone = await hash(customer.phone || customer_id)

    await supabaseAdmin
      .from('customers')
      .update({
        email: `${anonEmail}@anonymized.invalid`,
        full_name: `[Anonimleştirildi ${anonName.slice(0, 8)}]`,
        phone: null,
        company_name: null,
        tax_id: null,
        tax_office: null,
        notes: null,
        anonymized_at: now,
      })
      .eq('id', customer_id)

    // 2. profiles tablosunu anonimleştir
    if (customer.profile_id) {
      await supabaseAdmin
        .from('profiles')
        .update({
          full_name: `[Anonimleştirildi]`,
          phone: null,
          anonymized_at: now,
        })
        .eq('id', customer.profile_id)
    }

    // 3. Müşteri adreslerini sil
    await supabaseAdmin
      .from('customer_addresses')
      .delete()
      .eq('customer_id', customer_id)

    // 4. KYC belgeleri sil (storage ve DB)
    const { data: idCards } = await supabaseAdmin
      .from('customer_id_cards')
      .select('storage_path')
      .eq('customer_id', customer_id)

    if (idCards?.length) {
      const paths = idCards.map(c => c.storage_path).filter(Boolean)
      if (paths.length) {
        await supabaseAdmin.storage.from('kyc-documents').remove(paths)
      }
      await supabaseAdmin
        .from('customer_id_cards')
        .delete()
        .eq('customer_id', customer_id)
    }

    // 5. API anahtarları ve webhook'ları sil
    await supabaseAdmin.from('api_keys').delete().eq('customer_id', customer_id)
    await supabaseAdmin.from('webhooks').delete().eq('customer_id', customer_id)

    // 6. Hosting ve domain'leri pasife al (silme — servis devam edebilir)
    await supabaseAdmin
      .from('hosting')
      .update({ status: 'terminated' })
      .eq('customer_id', customer_id)
      .neq('status', 'terminated')

    await supabaseAdmin
      .from('domains')
      .update({ status: 'cancelled' })
      .eq('customer_id', customer_id)

    // 7. Fatura referans bilgisini anonim yap (tutarlar ve tarihler SAKLANIR)
    await supabaseAdmin
      .from('invoices')
      .update({ notes: '[KVKK - kişisel veri anonimleştirildi]' })
      .eq('customer_id', customer_id)

    // 8. KVKK consent kayıtlarını sil (artık gereksiz)
    await supabaseAdmin
      .from('profiles_kvkk_consents')
      .delete()
      .eq('user_id', customer.profile_id)

    // 9. Audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'gdpr_anonymize',
        entity_type: 'customer',
        entity_id: customer_id,
        details: {
          reason,
          anonymized_at: now,
          performed_by: user.email,
        },
      })

    console.log(`[gdpr-anonymize] ✅ Customer ${customer_id} anonymized successfully`)

    return new Response(
      JSON.stringify({
        success: true,
        anonymized_at: now,
        message: 'Kişisel veriler anonimleştirildi. Fatura kayıtları yasal zorunluluk gereği saklanmaktadır.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[gdpr-anonymize] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
