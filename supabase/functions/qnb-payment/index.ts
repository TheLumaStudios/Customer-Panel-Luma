// QNB Sanal POS — Satış (Auth) + İptal (Void) + İade (Refund) + Günsonu (BatchClose)
// Endpoint: POST /functions/v1/qnb-payment
//
// Body:
//   action:  'auth' | 'void' | 'refund' | 'batch_close'
//   invoice_id: UUID                   (auth, void, refund için)
//   card_pan: string                   (auth için)
//   card_expiry: string                (auth için, MMYY)
//   card_cvv: string                   (auth için)
//   installment_count: number          (auth için, varsayılan 0)
//   refund_amount: number              (refund + kısmi iade için, opsiyonel)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

// QNB response parser: "Key=Value;;Key2=Value2;;..."
function parseQnbResponse(raw: string): Record<string, string> {
  const result: Record<string, string> = {}
  raw.split(';;').forEach(pair => {
    const idx = pair.indexOf('=')
    if (idx > -1) {
      result[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim()
    }
  })
  return result
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Auth kontrolü
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Yetkisiz' }, 401)

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) return json({ error: 'Yetkisiz' }, 401)

    const body = await req.json()
    const { action = 'auth', invoice_id, card_pan, card_expiry, card_cvv, installment_count = 0, refund_amount } = body

    // QNB kimlik bilgilerini system_settings'ten çek
    const { data: settingsRows } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['qnb_mbr_id', 'qnb_merchant_id', 'qnb_user_code', 'qnb_user_pass', 'qnb_test_mode', 'qnb_currency'])

    const cfg: Record<string, string> = {}
    settingsRows?.forEach(r => { cfg[r.setting_key] = r.setting_value })

    const mbrId       = cfg['qnb_mbr_id']       || '5'
    const merchantId  = cfg['qnb_merchant_id']   || ''
    const userCode    = cfg['qnb_user_code']      || ''
    const userPass    = cfg['qnb_user_pass']      || ''
    const currency    = cfg['qnb_currency']       || '949'
    const testMode    = cfg['qnb_test_mode'] !== 'false'

    if (!merchantId || !userCode || !userPass) {
      return json({ error: 'QNB kimlik bilgileri eksik. Sistem Ayarları > Ödeme Yöntemleri kısmından doldurun.' }, 400)
    }

    const gatewayUrl = testMode
      ? 'https://vpostest.qnb.com.tr/Gateway/Default.aspx'
      : 'https://vpos.qnb.com.tr/Gateway/Default.aspx'

    // ─── GÜNSONU (BatchClose) ─────────────────────────────────────────────
    if (action === 'batch_close') {
      const params = new URLSearchParams({
        MbrId: mbrId,
        MerchantID: merchantId,
        UserCode: userCode,
        UserPass: userPass,
        SecureType: 'NonSecure',
        TxnType: 'BatchClose',
        Currency: currency,
        Lang: 'TR',
      })
      const resp = await fetch(gatewayUrl, { method: 'POST', body: params.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      const raw = await resp.text()
      const result = parseQnbResponse(raw)
      const success = result['ProcReturnCode'] === '00'
      return json({ success, result, raw })
    }

    // Fatura bilgilerini çek
    if (!invoice_id) return json({ error: 'invoice_id gerekli' }, 400)
    const { data: invoice, error: invError } = await supabaseAdmin
      .from('invoices')
      .select('*, customers(profile_id)')
      .eq('id', invoice_id)
      .single()

    if (invError || !invoice) return json({ error: 'Fatura bulunamadı' }, 404)

    // Müşteri sahiplik kontrolü (admin bypass)
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin' || profile?.role === 'employee'
    if (!isAdmin && invoice.customers?.profile_id !== user.id) {
      return json({ error: 'Bu faturaya erişim izniniz yok' }, 403)
    }

    const amount = parseFloat(invoice.total ?? invoice.total_amount ?? invoice.amount ?? 0).toFixed(2)
    const orderId = invoice.id.replace(/-/g, '').slice(0, 36)

    // ─── İPTAL (Void) ─────────────────────────────────────────────────────
    if (action === 'void') {
      const params = new URLSearchParams({
        MbrId: mbrId,
        MerchantID: merchantId,
        UserCode: userCode,
        UserPass: userPass,
        OrderId: orderId,
        SecureType: 'NonSecure',
        TxnType: 'Void',
        Currency: currency,
        Lang: 'TR',
      })
      const resp = await fetch(gatewayUrl, { method: 'POST', body: params.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      const raw = await resp.text()
      const result = parseQnbResponse(raw)
      const success = result['ProcReturnCode'] === '00'

      if (success) {
        await supabaseAdmin.from('invoices').update({ status: 'cancelled' }).eq('id', invoice_id)
        await supabaseAdmin.from('payments').update({ status: 'cancelled' }).eq('invoice_id', invoice_id)
      }
      return json({ success, result, error: success ? null : (result['ErrMsg'] || 'İşlem başarısız') })
    }

    // ─── İADE (Refund) ─────────────────────────────────────────────────────
    if (action === 'refund') {
      const refAmount = refund_amount ? parseFloat(refund_amount).toFixed(2) : amount
      const params = new URLSearchParams({
        MbrId: mbrId,
        MerchantID: merchantId,
        UserCode: userCode,
        UserPass: userPass,
        OrderId: orderId,
        SecureType: 'NonSecure',
        TxnType: 'Refund',
        PurchAmount: refAmount,
        Currency: currency,
        Lang: 'TR',
      })
      const resp = await fetch(gatewayUrl, { method: 'POST', body: params.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      const raw = await resp.text()
      const result = parseQnbResponse(raw)
      const success = result['ProcReturnCode'] === '00'

      if (success) {
        const isPartial = refund_amount && parseFloat(refund_amount) < parseFloat(amount)
        await supabaseAdmin.from('invoices').update({ status: isPartial ? 'partial_refund' : 'refunded' }).eq('id', invoice_id)
        await supabaseAdmin.from('payments').update({ status: 'refunded', refunded_amount: parseFloat(refAmount) }).eq('invoice_id', invoice_id)
      }
      return json({ success, result, error: success ? null : (result['ErrMsg'] || 'İade başarısız') })
    }

    // ─── SATIŞ (Auth) ──────────────────────────────────────────────────────
    if (!card_pan || !card_expiry) return json({ error: 'Kart bilgileri eksik' }, 400)

    // Mükerrer ödeme kontrolü
    if (invoice.status === 'paid') return json({ error: 'Bu fatura zaten ödenmiş' }, 400)

    const params = new URLSearchParams({
      MbrId: mbrId,
      MerchantID: merchantId,
      UserCode: userCode,
      UserPass: userPass,
      OrderId: orderId,
      SecureType: 'NonSecure',
      TxnType: 'Auth',
      PurchAmount: amount,
      Currency: currency,
      Pan: card_pan.replace(/\s/g, ''),
      Expiry: card_expiry.replace(/\D/g, ''),   // MMYY
      Cvv2: card_cvv || '',
      InstallmentCount: String(installment_count || 0),
      Lang: 'TR',
    })

    const resp = await fetch(gatewayUrl, {
      method: 'POST',
      body: params.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const raw = await resp.text()
    const result = parseQnbResponse(raw)
    const success = result['ProcReturnCode'] === '00'

    if (success) {
      // Payment kaydı oluştur
      const { data: customerRow } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      await supabaseAdmin.from('payments').insert({
        customer_id: customerRow?.id ?? invoice.customer_id,
        invoice_id: invoice_id,
        amount: parseFloat(amount),
        payment_method: 'qnb_pos',
        gateway_transaction_id: result['TransId'] || result['HostRefNum'],
        status: 'completed',
        metadata: {
          auth_code: result['AuthCode'],
          host_ref_num: result['HostRefNum'],
          trans_id: result['TransId'],
          proc_return_code: result['ProcReturnCode'],
          installment_count,
        },
      })

      // Faturayı ödendi olarak işaretle
      await supabaseAdmin.from('invoices').update({
        status: 'paid',
        payment_date: new Date().toISOString(),
        payment_method: 'qnb_pos',
        transaction_id: result['TransId'] || result['HostRefNum'],
      }).eq('id', invoice_id)
    }

    return json({
      success,
      auth_code: result['AuthCode'],
      host_ref_num: result['HostRefNum'],
      trans_id: result['TransId'],
      proc_return_code: result['ProcReturnCode'],
      error: success ? null : (result['ErrMsg'] || 'Ödeme başarısız'),
    })

  } catch (err) {
    console.error('qnb-payment error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
