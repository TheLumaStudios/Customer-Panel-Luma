import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { initiateCheckout } from '@/lib/metaPixel'
import { capiInitiateCheckout } from '@/lib/metaCapi'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCreateSelfInvoice, useInitializeIyzicoPayment } from '@/hooks/useInvoices'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { supabase } from '@/lib/supabase'
import IyzicoPaymentDialog from '@/components/payments/IyzicoPaymentDialog'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import PhoneInput from '@/components/PhoneInput'
import Turnstile from '@/components/Turnstile'
import {
  ShoppingCart, CreditCard, Trash2, Check, ArrowRight,
  ArrowLeft, Loader2, Package, Copy, CheckCircle2, Landmark,
} from 'lucide-react'

// ─── Sabitler ────────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'cart', label: 'Sepet', icon: ShoppingCart },
  { key: 'payment', label: 'Ödeme', icon: CreditCard },
]

const BILLING_OPTIONS = [
  { key: 'monthly', label: 'Aylık', discount: 0 },
  { key: 'quarterly', label: '3 Aylık', discount: 5 },
  { key: 'semi_annual', label: '6 Aylık', discount: 10 },
  { key: 'annual', label: 'Yıllık', discount: 20 },
]

const fmt = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

// Fatura dönemine göre fiyat
function itemPrice(item, billingPeriod) {
  if (billingPeriod === 'annual') return item.price_annual || item.price_monthly * 12
  if (billingPeriod === 'semi_annual') return item.price_semi_annual || item.price_monthly * 6
  if (billingPeriod === 'quarterly') return item.price_quarterly || item.price_monthly * 3
  return item.price_monthly || 0
}

// Invoice item'ları — sadece ana ürün, ekstra yok
function buildInvoiceItems(storeItems, billingPeriod) {
  return storeItems.map((ci) => ({
    type: ['vds', 'vps', 'dedicated'].includes(ci.product_type) ? 'vds' : 'hosting',
    package_id: ci.package_id,
    billing_period: billingPeriod,
    quantity: 1,
  }))
}

// ─── Bileşen ─────────────────────────────────────────────────────────────────

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const store = useCheckoutStore()
  const createSelfInvoice = useCreateSelfInvoice()
  const initializeIyzico = useInitializeIyzicoPayment()

  const [step, setStep] = useState('cart')

  // Sayfa açılınca ve adım değişince en üste scroll et
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [step])

  // iyzico
  const [iyzicoOpen, setIyzicoOpen] = useState(false)
  const [iyzicoContent, setIyzicoContent] = useState('')
  const [iyzicoUrl, setIyzicoUrl] = useState('')

  // Havale modal
  const [bankOpen, setBankOpen] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const { data: bankAccounts = [] } = useBankAccounts({ onlyActive: true })
  const [notifSent, setNotifSent] = useState(false)
  const [notifSending, setNotifSending] = useState(false)

  // QNB kart modal
  const [qnbOpen, setQnbOpen] = useState(false)
  const [qnbForm, setQnbForm] = useState({ pan: '', expiry: '', cvv: '', installment: '0' })
  const [qnbInstallments, setQnbInstallments] = useState(['1'])
  const [qnbPaying, setQnbPaying] = useState(false)

  // Misafir form
  const [guestForm, setGuestForm] = useState({ full_name: '', email: '', phone: '', company_name: '' })
  const [guestLoading, setGuestLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  // Yasal onaylar
  const [consents, setConsents] = useState({ kvkk: false, distance_sales: false })

  const isPaying = createSelfInvoice.isPending || initializeIyzico.isPending

  // İlk Ay Bedava — yeni müşterilere otomatik
  useEffect(() => {
    if (!user || store.promoValidated || store.promoCode) return
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'paid')
      .then(({ count }) => {
        if (count === 0) store.validatePromoCode('ILKAY')
      })
  }, [user])

  // Sepet boşsa ana sayfaya
  if (store.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <LandingHeader />
        <div className="max-w-4xl mx-auto px-4 pt-32 pb-24 text-center">
          <Package className="h-16 w-16 text-slate-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sepetiniz Boş</h1>
          <p className="text-slate-400 mb-6">Hizmet eklemek için ürün sayfalarımızı inceleyin.</p>
          <Button className="bg-indigo-600 hover:bg-indigo-500" onClick={() => navigate('/vds')}>Ürünleri İncele</Button>
        </div>
        <LandingFooter />
      </div>
    )
  }

  // ─── Hesaplamalar ─────────────────────────────────────────────────────────

  const subtotal = store.items.reduce((s, i) => s + itemPrice(i, store.billingPeriod), 0)
  const promoAmount = store.promoValidated && store.promoDetails
    ? store.promoDetails.discount_type === 'percentage'
      ? subtotal * (store.promoDetails.discount_value / 100)
      : (store.promoDetails.calculated_discount || 0)
    : 0
  const afterPromo = Math.max(0, subtotal - promoAmount)
  const kdv = afterPromo * 0.20
  const total = afterPromo + kdv

  // ─── Misafir kayıt ────────────────────────────────────────────────────────

  const handleGuestRegister = async () => {
    if (!guestForm.full_name || !guestForm.email || !guestForm.phone) {
      toast.error('Ad soyad, e-posta ve telefon zorunludur')
      return false
    }
    setGuestLoading(true)
    try {
      const base = import.meta.env.VITE_SUPABASE_URL
      const fnUrl = base.includes('/rest/v1') ? base.replace('/rest/v1', '/functions/v1') : `${base}/functions/v1`
      const res = await fetch(`${fnUrl}/guest-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify(guestForm),
      })
      const result = await res.json()
      if (!result.success) {
        if (result.existing_user) {
          toast.error('Bu e-posta kayıtlı. Lütfen giriş yapın.')
          navigate('/login')
          return false
        }
        throw new Error(result.error)
      }
      if (result.session?.access_token) {
        await supabase.auth.setSession({ access_token: result.session.access_token, refresh_token: result.session.refresh_token })
      } else if (result.password) {
        await supabase.auth.signInWithPassword({ email: guestForm.email, password: result.password })
      }
      await new Promise(r => setTimeout(r, 500))
      toast.success('Hesabınız oluşturuldu', { description: 'Giriş bilgileriniz SMS ile gönderildi' })
      return true
    } catch (err) {
      toast.error('Hesap oluşturulamadı', { description: err.message })
      return false
    } finally {
      setGuestLoading(false)
    }
  }

  // ─── Ödeme (iyzico) ──────────────────────────────────────────────────────

  const handleCardPayment = async () => {
    if (!consents.kvkk || !consents.distance_sales) {
      toast.error('Lütfen sözleşmeleri onaylayın')
      return
    }
    if (!user) {
      const ok = await handleGuestRegister()
      if (!ok) return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { toast.error('Oturum bulunamadı'); navigate('/login'); return }

    try {
      const items = buildInvoiceItems(store.items, store.billingPeriod)
      const payload = { items }
      if (store.promoValidated && store.promoCode) payload.promo_code = store.promoCode
      const invoice = await createSelfInvoice.mutateAsync(payload)
      store.setCurrentInvoiceId(invoice.id)

      const result = await initializeIyzico.mutateAsync({
        invoice_id: invoice.id,
        return_url: `${window.location.origin}/payment-success`,
      })
      setIyzicoContent(result.checkoutFormContent || '')
      setIyzicoUrl(result.paymentPageUrl || '')
      setIyzicoOpen(true)

      initiateCheckout({ contentIds: store.items.map(i => i.slug || i.id), numItems: store.items.length, value: total, currency: 'TRY' })
      capiInitiateCheckout({ contentIds: store.items.map(i => i.slug || i.id), numItems: store.items.length, value: total, currency: 'TRY' })
    } catch (err) {
      toast.error('Ödeme başlatılamadı', { description: err.message })
    }
  }

  // ─── Ödeme (havale) ──────────────────────────────────────────────────────

  const handleBankTransfer = async () => {
    if (!consents.kvkk || !consents.distance_sales) {
      toast.error('Lütfen sözleşmeleri onaylayın')
      return
    }
    if (!user) {
      const ok = await handleGuestRegister()
      if (!ok) return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { toast.error('Oturum bulunamadı'); navigate('/login'); return }

    // Önce modal'ı aç, arka planda fatura oluştur
    setBankOpen(true)
    try {
      const items = buildInvoiceItems(store.items, store.billingPeriod)
      const payload = { items, payment_method: 'bank_transfer' }
      if (store.promoValidated && store.promoCode) payload.promo_code = store.promoCode
      const invoice = await createSelfInvoice.mutateAsync(payload)
      store.setCurrentInvoiceId(invoice.id)
    } catch (err) {
      console.error('Invoice create error:', err)
      // Modal açık kalsın, fatura arka planda başarısız olsa da kullanıcı IBAN'ı görüyor
    }
  }

  const copyIban = (text, field) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''))
    setCopiedField(field)
    toast.success('IBAN kopyalandı')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const sendPaymentNotif = async () => {
    if (notifSent || notifSending) return
    setNotifSending(true)
    try {
      const invoiceId = store.currentInvoiceId
      const amount = store.getTotal()
      const email = user?.email || guestForm.email || ''
      await supabase.from('admin_notifications').insert({
        type: 'bank_transfer',
        title: 'Havale / EFT Bildirimi',
        message: `${email} müşterisi ${fmt(amount)}₺ havale yaptığını bildirdi.`,
        data: { invoice_id: invoiceId, amount, email, user_id: user?.id ?? null },
        created_by: user?.id ?? null,
      })
      setNotifSent(true)
      toast.success('Bildirim gönderildi! Ödemeniz kontrol edildikten sonra aktif edilecektir.')
    } catch {
      toast.error('Bildirim gönderilemedi, lütfen tekrar deneyin.')
    } finally {
      setNotifSending(false)
    }
  }

  // Kart butonuna basıldığında: onay + misafir kayıt + fatura oluştur → modal aç
  const handleOpenCardModal = async () => {
    if (!consents.kvkk || !consents.distance_sales) {
      toast.error('Lütfen sözleşmeleri onaylayın')
      return
    }
    if (!user) {
      const ok = await handleGuestRegister()
      if (!ok) return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { toast.error('Oturum bulunamadı'); navigate('/login'); return }

    try {
      const items = buildInvoiceItems(store.items, store.billingPeriod)
      const payload = { items, payment_method: 'qnb_pos' }
      if (store.promoValidated && store.promoCode) payload.promo_code = store.promoCode
      const invoice = await createSelfInvoice.mutateAsync(payload)
      store.setCurrentInvoiceId(invoice.id)
      setQnbOpen(true)
    } catch (err) {
      toast.error('Fatura oluşturulamadı', { description: err.message })
    }
  }

  // Kredi kartı ödemesi — QNB dener, başarısız olursa iyzico'ya geçer
  const handleQnbPayment = async () => {
    if (!qnbForm.pan || !qnbForm.expiry) {
      toast.error('Kart bilgilerini doldurun')
      return
    }
    const invoiceId = store.currentInvoiceId
    if (!invoiceId) {
      toast.error('Fatura bulunamadı, lütfen sayfayı yenileyip tekrar deneyin')
      setQnbOpen(false)
      return
    }
    setQnbPaying(true)
    try {
      // QNB ile dene
      const { data: { session } } = await supabase.auth.getSession()
      const baseUrl = import.meta.env.VITE_SUPABASE_URL
      const res = await fetch(`${baseUrl}/functions/v1/qnb-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          action: 'auth',
          invoice_id: invoiceId,
          card_pan: qnbForm.pan.replace(/\s/g, ''),
          card_expiry: qnbForm.expiry.replace(/\D/g, ''),
          card_cvv: qnbForm.cvv,
          installment_count: parseInt(qnbForm.installment) || 0,
        }),
      })

      if (!res.ok) {
        // HTTP hatası — iyzico fallback'e geç
        throw new Error(`QNB HTTP ${res.status}`)
      }
      const result = await res.json()

      if (result.success) {
        // QNB başarılı
        setQnbOpen(false)
        store.clearCheckout()
        navigate('/payment-success')
      } else {
        // QNB başarısız → fallback zinciri
        setQnbOpen(false)
        await handleFallbackPayment(invoiceId, qnbForm)
      }
    } catch (err) {
      // Ağ / HTTP hatası — fallback zinciri
      setQnbOpen(false)
      await handleFallbackPayment(invoiceId, qnbForm)
    } finally {
      setQnbPaying(false)
    }
  }

  // Fallback zinciri: Tami 3DS → iyzico
  const handleFallbackPayment = async (invoiceId, cardForm) => {
    toast.info('Ödeme sayfasına yönlendiriliyorsunuz…')
    const { data: { session } } = await supabase.auth.getSession()
    const baseUrl = import.meta.env.VITE_SUPABASE_URL

    // 1. Önce Tami 3D Secure dene
    try {
      const expiryClean = (cardForm?.expiry || '').replace(/\D/g, '')
      const tamiRes = await fetch(`${baseUrl}/functions/v1/tami-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          action: 'auth_3ds',
          invoice_id: invoiceId,
          card_pan: (cardForm?.pan || '').replace(/\s/g, ''),
          card_expiry_month: expiryClean.slice(0, 2),
          card_expiry_year: `20${expiryClean.slice(2, 4)}`,
          card_cvv: cardForm?.cvv || '',
          card_holder: '',
          installment_count: parseInt(cardForm?.installment || '0') || 1,
          callback_url: `${baseUrl}/functions/v1/tami-callback`,
        }),
      })
      if (tamiRes.ok) {
        const tamiResult = await tamiRes.json()
        if (tamiResult.success && tamiResult.htmlContent) {
          // Tami HTML formunu iyzico dialog'uyla göster (aynı bileşen)
          setIyzicoContent(tamiResult.htmlContent)
          setIyzicoUrl('')
          setIyzicoOpen(true)
          initiateCheckout({ contentIds: store.items.map(i => i.slug || i.id), numItems: store.items.length, value: total, currency: 'TRY' })
          capiInitiateCheckout({ contentIds: store.items.map(i => i.slug || i.id), numItems: store.items.length, value: total, currency: 'TRY' })
          return
        }
      }
    } catch {
      // Tami de başarısız → iyzico'ya düş
    }

    // 2. Son çare: iyzico
    try {
      const iyzicoResult = await initializeIyzico.mutateAsync({
        invoice_id: invoiceId,
        return_url: `${window.location.origin}/payment-success`,
      })
      setIyzicoContent(iyzicoResult.checkoutFormContent || '')
      setIyzicoUrl(iyzicoResult.paymentPageUrl || '')
      setIyzicoOpen(true)
      initiateCheckout({ contentIds: store.items.map(i => i.slug || i.id), numItems: store.items.length, value: total, currency: 'TRY' })
      capiInitiateCheckout({ contentIds: store.items.map(i => i.slug || i.id), numItems: store.items.length, value: total, currency: 'TRY' })
    } catch (iyziErr) {
      toast.error('Ödeme başlatılamadı', { description: iyziErr.message })
    }
  }

  // QNB kart numarası formatlayıcı
  const formatCardNumber = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 16)
    return clean.replace(/(.{4})/g, '$1 ').trim()
  }

  // QNB son kullanma tarihi formatlayıcı (MM/YY)
  const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 4)
    if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2)
    return clean
  }

  // ─── Adım göstergesi ─────────────────────────────────────────────────────

  const stepIndex = STEPS.findIndex(s => s.key === step)

  return (
    <div className="min-h-screen bg-slate-950">
      <LandingHeader />

      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">

        {/* Adım göstergesi */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((s, i) => {
            const isActive = i === stepIndex
            const isDone = i < stepIndex
            const Icon = s.icon
            return (
              <div key={s.key} className="flex items-center">
                {i > 0 && <div className={`w-16 h-0.5 ${isDone ? 'bg-indigo-500' : 'bg-slate-800'}`} />}
                <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive ? 'bg-indigo-600 text-white' : isDone ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800/60 text-slate-500'
                }`}>
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  {s.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* ─── ADIM 1: SEPET ───────────────────────────────────────────────── */}
        {step === 'cart' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">Sepetiniz</h2>

            {/* Ürünler */}
            <div className="space-y-3">
              {store.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description || item.product_type?.toUpperCase()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-white">{fmt(itemPrice(item, store.billingPeriod))}₺</p>
                    <p className="text-xs text-slate-500">
                      {store.billingPeriod === 'monthly' ? '/ay' :
                       store.billingPeriod === 'quarterly' ? '/3 ay' :
                       store.billingPeriod === 'semi_annual' ? '/6 ay' : '/yıl'}
                    </p>
                  </div>
                  <button
                    onClick={() => store.removeItem(item.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Fatura Dönemi */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Fatura Dönemi</p>
              <div className="flex gap-2 flex-wrap">
                {BILLING_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => store.setBillingPeriod(opt.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      store.billingPeriod === opt.key
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                    {opt.discount > 0 && (
                      <span className="ml-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                        %{opt.discount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Promo kodu */}
            <div className="flex gap-2">
              <Input
                placeholder="Promosyon kodu"
                value={store.promoCode}
                onChange={(e) => { if (store.promoValidated) store.clearPromo(); else store.setPromoCode(e.target.value) }}
                disabled={store.promoLoading || store.promoValidated}
                className="max-w-xs bg-slate-900 border-slate-800 text-white placeholder:text-slate-600"
              />
              {store.promoValidated ? (
                <Button variant="ghost" className="border border-red-800/60 text-red-400 hover:text-red-300" onClick={() => store.clearPromo()}>
                  Kaldır
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="border border-slate-800 text-slate-400 hover:text-white"
                  disabled={!store.promoCode || store.promoLoading}
                  onClick={() => store.validatePromoCode(store.promoCode)}
                >
                  {store.promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Uygula'}
                </Button>
              )}
            </div>
            {store.promoError && <p className="text-xs text-red-400 -mt-3">{store.promoError}</p>}
            {store.promoValidated && store.promoDetails && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm -mt-3">
                <Check className="h-4 w-4" />
                {store.promoDetails.is_first_month_free
                  ? 'İlk ay bedava!'
                  : store.promoDetails.discount_type === 'percentage'
                    ? `%${store.promoDetails.discount_value} indirim uygulandı`
                    : `${store.promoDetails.calculated_discount}₺ indirim uygulandı`}
              </div>
            )}

            {/* Toplam + devam */}
            <div className="border-t border-slate-800 pt-5 space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Ara Toplam</span>
                <span>{fmt(subtotal)}₺</span>
              </div>
              {promoAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>İndirim</span>
                  <span>-{fmt(promoAmount)}₺</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-400">
                <span>KDV (%20)</span>
                <span>{fmt(kdv)}₺</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div>
                  <p className="text-xs text-slate-500">Ödenecek Tutar</p>
                  <p className="text-2xl font-bold text-white">{fmt(total)}₺</p>
                </div>
                <Button
                  onClick={() => setStep('payment')}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-500 h-11 px-6"
                >
                  Ödemeye Geç <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── ADIM 2: ÖDEME ───────────────────────────────────────────────── */}
        {step === 'payment' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('cart')} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-xl font-bold text-white">Ödeme</h2>
            </div>

            {/* Misafir bilgi formu */}
            {!user && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <p className="text-sm font-semibold text-white">İletişim Bilgileri</p>
                <p className="text-xs text-slate-500">Hesabınız otomatik oluşturulur ve bilgileriniz SMS ile gönderilir.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <label className="text-xs text-slate-400">Ad Soyad *</label>
                    <Input value={guestForm.full_name} onChange={e => setGuestForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Ad Soyad" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <label className="text-xs text-slate-400">Telefon *</label>
                    <PhoneInput value={guestForm.phone} onChange={phone => setGuestForm(p => ({ ...p, phone }))} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs text-slate-400">E-posta *</label>
                    <Input type="email" value={guestForm.email} onChange={e => setGuestForm(p => ({ ...p, email: e.target.value }))} placeholder="ornek@mail.com" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs text-slate-400">Şirket (Opsiyonel)</label>
                    <Input value={guestForm.company_name} onChange={e => setGuestForm(p => ({ ...p, company_name: e.target.value }))} placeholder="Şirket adı" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
                  </div>
                </div>
                <div className="flex justify-center pt-2">
                  <Turnstile onVerify={setTurnstileToken} theme="dark" />
                </div>
              </div>
            )}

            {/* Sipariş özeti (kompakt) */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
              {store.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.name}</span>
                  <span className="text-white font-medium">{fmt(itemPrice(item, store.billingPeriod))}₺</span>
                </div>
              ))}
              {promoAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>İndirim ({store.promoCode})</span>
                  <span>-{fmt(promoAmount)}₺</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-500">
                <span>KDV (%20)</span>
                <span>{fmt(kdv)}₺</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 font-bold">
                <span className="text-white">Toplam</span>
                <span className="text-indigo-400 text-lg">{fmt(total)}₺</span>
              </div>
            </div>

            {/* Yasal onaylar */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="kvkk"
                  checked={consents.kvkk}
                  onCheckedChange={v => setConsents(p => ({ ...p, kvkk: v }))}
                  className="mt-0.5"
                />
                <label htmlFor="kvkk" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                  <a href="/kvkk" target="_blank" className="text-indigo-400 underline">KVKK Aydınlatma Metni</a>'ni ve{' '}
                  <a href="/privacy" target="_blank" className="text-indigo-400 underline">Gizlilik Politikası</a>'nı okudum ve kabul ediyorum.
                </label>
              </div>
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="distance"
                  checked={consents.distance_sales}
                  onCheckedChange={v => setConsents(p => ({ ...p, distance_sales: v }))}
                  className="mt-0.5"
                />
                <label htmlFor="distance" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                  <a href="/distance-sales" target="_blank" className="text-indigo-400 underline">Mesafeli Satış Sözleşmesi</a>'ni okudum ve kabul ediyorum.
                </label>
              </div>
            </div>

            {/* Ödeme butonları */}
            <div className="flex flex-col gap-3 pt-1">
              <Button
                onClick={handleOpenCardModal}
                disabled={isPaying || guestLoading || qnbPaying}
                className="h-14 gap-3 bg-indigo-600 hover:bg-indigo-500 text-base font-semibold"
              >
                {(isPaying || guestLoading || qnbPaying) ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
                Kredi / Banka Kartı ile Öde
              </Button>

              <Button
                onClick={handleBankTransfer}
                disabled={isPaying || guestLoading}
                className="h-14 gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-base font-semibold"
              >
                <Landmark className="h-5 w-5" />
                Havale / EFT
              </Button>
            </div>

            <p className="text-center text-xs text-slate-600">
              🔒 256-bit SSL şifreli · 3D Secure · PCI-DSS uyumlu
            </p>
          </div>
        )}
      </div>

      <LandingFooter />

      {/* iyzico dialog */}
      <IyzicoPaymentDialog
        open={iyzicoOpen}
        onOpenChange={setIyzicoOpen}
        htmlContent={iyzicoContent}
        paymentPageUrl={iyzicoUrl}
      />

      {/* Havale modal */}
      {bankOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5 overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Landmark className="h-5 w-5 text-indigo-400" />
                Havale / EFT Bilgileri
              </h3>
              <button onClick={() => { setBankOpen(false); navigate('/payment-success') }} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <p className="text-sm text-slate-400">
              Aşağıdaki hesaba <span className="font-bold text-white">{fmt(total)}₺</span> havale yapın.
              Açıklama kısmına <span className="font-bold text-indigo-400">e-posta adresinizi</span> yazın.
            </p>

            {bankAccounts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Banka hesabı yükleniyor...</p>
            ) : bankAccounts.map((acc, idx) => (
              <div key={acc.id ?? idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
                {/* Banka adı + logo */}
                <div className="flex items-center gap-3">
                  {acc.bank_logo_url ? (
                    <img
                      src={acc.bank_logo_url}
                      alt={acc.bank_name}
                      className="h-8 w-auto max-w-[80px] object-contain rounded brightness-0 invert"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-indigo-500/20 flex items-center justify-center">
                      <Landmark className="h-4 w-4 text-indigo-400" />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white">{acc.bank_name}</span>
                </div>
                {/* Hesap adı */}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Hesap Adı</span>
                  <span className="text-white font-medium">{acc.account_holder}</span>
                </div>
                {/* IBAN + kopyala */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500">IBAN</p>
                    <p className="font-mono text-sm text-white tracking-wide">{acc.iban}</p>
                  </div>
                  <button
                    onClick={() => copyIban(acc.iban, `iban-${idx}`)}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    {copiedField === `iban-${idx}` ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {/* Swift varsa göster */}
                {acc.swift && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">SWIFT/BIC</span>
                    <span className="text-white font-mono">{acc.swift}</span>
                  </div>
                )}
                {/* Not varsa göster */}
                {acc.notes && (
                  <p className="text-xs text-slate-500 border-t border-slate-700 pt-2">{acc.notes}</p>
                )}
              </div>
            ))}

            {/* Ödeme bildirimi */}
            <button
              onClick={sendPaymentNotif}
              disabled={notifSent || notifSending}
              className={`w-full rounded-xl border py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                notifSent
                  ? 'border-green-700 bg-green-900/30 text-green-400 cursor-default'
                  : 'border-amber-600 bg-amber-600/10 text-amber-400 hover:bg-amber-600/20'
              }`}
            >
              {notifSending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor...</>
              ) : notifSent ? (
                <><CheckCircle2 className="h-4 w-4" /> Bildirim Gönderildi</>
              ) : (
                <><Landmark className="h-4 w-4" /> Ödeme Yaptım, Bildir</>
              )}
            </button>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-500"
              onClick={() => { setBankOpen(false); navigate('/payment-success') }}
            >
              Tamam, Siparişi Tamamla
            </Button>
          </div>
        </div>
      )}

      {/* QNB Kart Ödeme Modalı */}
      {qnbOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-400" />
                Kart ile Öde
              </h3>
              <button onClick={() => setQnbOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <p className="text-sm text-slate-400">
              Ödenecek tutar: <span className="font-bold text-white">{fmt(total)}₺</span>
            </p>

            <div className="space-y-4">
              {/* Kart Numarası */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Kart Numarası</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={19}
                  placeholder="0000 0000 0000 0000"
                  value={qnbForm.pan}
                  onChange={e => setQnbForm({ ...qnbForm, pan: formatCardNumber(e.target.value) })}
                  className="w-full rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 px-4 py-3 font-mono text-base tracking-widest focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Son Kullanma */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Son Kullanma</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="AA/YY"
                    value={qnbForm.expiry}
                    onChange={e => setQnbForm({ ...qnbForm, expiry: formatExpiry(e.target.value) })}
                    className="w-full rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 px-4 py-3 font-mono text-base focus:outline-none focus:border-amber-500"
                  />
                </div>
                {/* CVV */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">CVV</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="•••"
                    value={qnbForm.cvv}
                    onChange={e => setQnbForm({ ...qnbForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className="w-full rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 px-4 py-3 font-mono text-base focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Taksit Seçimi */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Taksit</label>
                <select
                  value={qnbForm.installment}
                  onChange={e => setQnbForm({ ...qnbForm, installment: e.target.value })}
                  className="w-full rounded-xl bg-slate-800 border border-slate-600 text-white px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="0">Peşin (taksitsiz)</option>
                  <option value="2">2 Taksit</option>
                  <option value="3">3 Taksit</option>
                  <option value="6">6 Taksit</option>
                  <option value="9">9 Taksit</option>
                  <option value="12">12 Taksit</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleQnbPayment}
              disabled={qnbPaying}
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-semibold py-3.5 flex items-center justify-center gap-2 transition-colors"
            >
              {qnbPaying ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> İşleniyor...</>
              ) : (
                <><CreditCard className="h-4 w-4" /> {fmt(total)}₺ Öde</>
              )}
            </button>

            <p className="text-center text-xs text-slate-600">🔒 QNB PCI-DSS uyumlu güvenli ödeme</p>
          </div>
        </div>
      )}
    </div>
  )
}
