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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { code, subtotal = 0, customer_id } = await req.json()

    if (!code) {
      return json({ valid: false, error: 'Promosyon kodu gerekli' })
    }

    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .ilike('code', code.trim())
      .single()

    if (error || !promo) {
      return json({ valid: false, error: 'Geçersiz promosyon kodu' })
    }

    if (!promo.is_active) {
      return json({ valid: false, error: 'Bu promosyon kodu aktif değil' })
    }

    const now = new Date()
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return json({ valid: false, error: 'Bu promosyon kodu henüz aktif değil' })
    }
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return json({ valid: false, error: 'Bu promosyon kodunun süresi dolmuş' })
    }

    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return json({ valid: false, error: 'Bu promosyon kodu kullanım limitine ulaşmış' })
    }

    if (customer_id && promo.max_uses_per_customer !== null) {
      const { count } = await supabase
        .from('promo_code_usage')
        .select('id', { count: 'exact', head: true })
        .eq('promo_code_id', promo.id)
        .eq('customer_id', customer_id)

      if ((count || 0) >= promo.max_uses_per_customer) {
        return json({ valid: false, error: 'Bu promosyon kodunu daha fazla kullanamazsınız' })
      }
    }

    if (promo.min_order_amount > 0 && subtotal < promo.min_order_amount) {
      return json({ valid: false, error: `Minimum sipariş tutarı: ${promo.min_order_amount}₺` })
    }

    let calculated_discount = 0
    if (promo.discount_type === 'percentage') {
      calculated_discount = Math.min(subtotal, Math.round(subtotal * promo.discount_value / 100 * 100) / 100)
    } else {
      calculated_discount = Math.min(subtotal, promo.discount_value)
    }

    return json({
      valid: true,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      calculated_discount,
      is_first_month_free: promo.is_first_month_free || false,
      promo_code_id: promo.id,
    })
  } catch (err) {
    return json({ valid: false, error: (err as Error).message }, 400)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
