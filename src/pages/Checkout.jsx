import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { initiateCheckout } from '@/lib/metaPixel'
import { capiInitiateCheckout, capiAddPaymentInfo } from '@/lib/metaCapi'
import { useProductCache } from '@/contexts/ProductCacheContext'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCreateSelfInvoice, useInitializeIyzicoPayment } from '@/hooks/useInvoices'
import { supabase } from '@/lib/supabase'
import IyzicoPaymentDialog from '@/components/payments/IyzicoPaymentDialog'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { ShoppingCart, Settings, FileText, CreditCard, Trash2, Check, ArrowRight, ArrowLeft, Loader2, Package, Monitor, Server, Shield, HardDrive, Globe, Building2, Copy, CheckCircle2 } from 'lucide-react'
import PhoneInput from '@/components/PhoneInput'
import Turnstile from '@/components/Turnstile'

const STEPS = [
  { key: 'cart', label: 'Sepet', icon: ShoppingCart },
  { key: 'config', label: 'Yapılandırma', icon: Settings },
  { key: 'review', label: 'Özet', icon: FileText },
  { key: 'payment', label: 'Ödeme', icon: CreditCard },
]

const BILLING_OPTIONS = [
  { key: 'monthly', label: 'Aylık', discount: 0 },
  { key: 'quarterly', label: '3 Aylık', discount: 5 },
  { key: 'semi_annual', label: '6 Aylık', discount: 10 },
  { key: 'annual', label: 'Yıllık', discount: 20 },
]

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)

const OsIcon = ({ src, alt }) => (
  <img src={src} alt={alt} className="h-5 w-5 rounded-sm object-contain" />
)

const OS_OPTIONS = [
  { key: 'ubuntu-22', label: 'Ubuntu 22.04 LTS', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ubuntu/ubuntu-original.svg' },
  { key: 'ubuntu-24', label: 'Ubuntu 24.04 LTS', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ubuntu/ubuntu-original.svg' },
  { key: 'debian-12', label: 'Debian 12', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/debian/debian-original.svg' },
  { key: 'centos-9', label: 'CentOS Stream 9', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/centos/centos-original.svg' },
  { key: 'almalinux-9', label: 'AlmaLinux 9', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg' },
  { key: 'rocky-9', label: 'Rocky Linux 9', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rockylinux/rockylinux-original.svg' },
  { key: 'windows-2022', label: 'Windows Server 2022', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/windows11/windows11-original.svg' },
]

const PANEL_OPTIONS = [
  { key: 'none', label: 'Panel Yok', desc: 'Sadece SSH erişimi', price: 0 },
  { key: 'cpanel', label: 'cPanel/WHM', desc: 'Web hosting yönetim paneli', price: 0 },
  { key: 'plesk', label: 'Plesk', desc: 'Web sunucu yönetim paneli', price: 0 },
  { key: 'directadmin', label: 'DirectAdmin', desc: 'Hafif kontrol paneli', price: 0 },
]

const EXTRA_DISK_OPTIONS = [
  { key: '0', label: 'Ek Disk İstemiyorum', price: 0 },
  { key: '40', label: '40 GB Ek Disk', price: 40 },
  { key: '80', label: '80 GB Ek Disk', price: 80 },
  { key: '120', label: '120 GB Ek Disk', price: 120 },
  { key: '160', label: '160 GB Ek Disk', price: 160 },
  { key: '200', label: '200 GB Ek Disk', price: 200 },
]

const EXTRA_IP_OPTIONS = [
  { key: '0', label: 'Ek IP İstemiyorum', price: 0 },
  { key: '1', label: '1 Ek IP Adresi', price: 35 },
  { key: '2', label: '2 Ek IP Adresi', price: 70 },
  { key: '3', label: '3 Ek IP Adresi', price: 105 },
  { key: '4', label: '4 Ek IP Adresi', price: 140 },
  { key: '5', label: '5 Ek IP Adresi', price: 175 },
]

const DDOS_OPTIONS = [
  { key: 'standard', label: 'Standart DDoS Koruması', desc: 'Temel koruma', price: 0 },
  { key: 'advanced', label: 'Gelişmiş DDoS Koruması', desc: 'Üst düzey filtreleme', price: 50 },
]

const BACKUP_OPTIONS = [
  { key: 'none', label: 'Yedekleme İstemiyorum', price: 0 },
  { key: 'weekly', label: 'Haftalık Sunucu Yedeği', price: 150 },
  { key: 'daily', label: 'Günlük Sunucu Yedeği', price: 300 },
]

const SNAPSHOT_OPTIONS = [
  { key: '0', label: 'İstemiyorum', price: 0 },
  { key: '1', label: '1 Snapshot Hakkı', price: 30 },
  { key: '2', label: '2 Snapshot Hakkı', price: 60 },
  { key: '3', label: '3 Snapshot Hakkı', price: 90 },
]

const SUSPEND_OPTIONS = [
  { key: 'delete', label: 'Ödeme yapılmazsa silinsin', price: 0 },
  { key: '3day', label: '3 gün askıya alınsın', price: 50 },
  { key: '7day', label: '7 gün askıya alınsın', price: 100 },
]

const HOSTING_DOMAIN_OPTIONS = [
  { key: 'existing', label: 'Mevcut Domainimi Kullanacağım' },
  { key: 'later', label: 'Daha Sonra Belirleyeceğim' },
]

// Seçilen ekstraların toplam aylık ücretini hesapla
function calcExtrasPrice(config) {
  let total = 0
  const disk = EXTRA_DISK_OPTIONS.find(o => o.key === config.extra_disk)
  if (disk) total += disk.price
  const ip = EXTRA_IP_OPTIONS.find(o => o.key === config.extra_ip)
  if (ip) total += ip.price
  const ddos = DDOS_OPTIONS.find(o => o.key === config.ddos)
  if (ddos) total += ddos.price
  const backup = BACKUP_OPTIONS.find(o => o.key === config.backup)
  if (backup) total += backup.price
  const snap = SNAPSHOT_OPTIONS.find(o => o.key === config.snapshot)
  if (snap) total += snap.price
  const suspend = SUSPEND_OPTIONS.find(o => o.key === config.suspend)
  if (suspend) total += suspend.price
  return total
}

// Tüm ürünlerin ekstra dahil toplam aylık fiyatı
function calcGrandTotal(items, configurations) {
  return items.reduce((sum, item) => {
    const extras = calcExtrasPrice(configurations[item.id] || {})
    return sum + (item.price_monthly || 0) + extras
  }, 0)
}

// Seçilen ekstraları invoice item'larına dönüştür
function buildInvoiceItems(storeItems, configurations, billingPeriod) {
  const items = []

  for (const ci of storeItems) {
    const type = ci.product_type === 'vds' || ci.product_type === 'vps' || ci.product_type === 'dedicated' ? 'vds' : 'hosting'

    // Ana ürün
    items.push({
      type,
      package_id: ci.package_id,
      billing_period: billingPeriod,
      quantity: 1,
    })

    // Ekstraları ayrı satır olarak ekle
    const config = configurations[ci.id] || {}

    const extras = [
      { key: 'extra_disk', options: EXTRA_DISK_OPTIONS, label: 'Ek Disk' },
      { key: 'extra_ip', options: EXTRA_IP_OPTIONS, label: 'Ek IP Adresi' },
      { key: 'ddos', options: DDOS_OPTIONS, label: 'DDoS Koruması', defaultKey: 'standard' },
      { key: 'backup', options: BACKUP_OPTIONS, label: 'Yedekleme', defaultKey: 'none' },
      { key: 'snapshot', options: SNAPSHOT_OPTIONS, label: 'VM Snapshot' },
      { key: 'suspend', options: SUSPEND_OPTIONS, label: 'Askı Süresi', defaultKey: 'delete' },
    ]

    for (const extra of extras) {
      const selectedKey = config[extra.key] || extra.defaultKey || '0'
      const option = extra.options.find(o => o.key === selectedKey)
      if (option && option.price > 0) {
        items.push({
          type: 'addon',
          description: `${extra.label}: ${option.label}`,
          unit_price: option.price,
          quantity: 1,
        })
      }
    }

    // OS ve panel bilgilerini not olarak ekle (ücretsiz ama bilgi amaçlı)
    const configNotes = []
    if (config.os) {
      const os = OS_OPTIONS.find(o => o.key === config.os)
      if (os) configNotes.push(`İşletim Sistemi: ${os.label}`)
    }
    if (config.panel && config.panel !== 'none') {
      const panel = PANEL_OPTIONS.find(o => o.key === config.panel)
      if (panel) configNotes.push(`Kontrol Paneli: ${panel.label}`)
    }
    if (config.hostname) configNotes.push(`Hostname: ${config.hostname}`)
    if (config.domain_name) configNotes.push(`Domain: ${config.domain_name}`)
    if (config.note) configNotes.push(`Not: ${config.note}`)

    // Config bilgisini ücretsiz addon satırı olarak ekle
    if (configNotes.length > 0) {
      items.push({
        type: 'addon',
        description: configNotes.join(' | '),
        unit_price: 0,
        quantity: 1,
      })
    }
  }

  return items
}

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const store = useCheckoutStore()
  const { verifyPrice } = useProductCache()
  const createSelfInvoice = useCreateSelfInvoice()
  const initializeIyzico = useInitializeIyzicoPayment()

  const [iyzicoOpen, setIyzicoOpen] = useState(false)
  const [iyzicoContent, setIyzicoContent] = useState('')
  const [iyzicoUrl, setIyzicoUrl] = useState('')

  // Bank transfer modal
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  const handleCopyIban = (text, field) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''))
    setCopiedField(field)
    toast.success('IBAN kopyalandı')
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Guest checkout
  const [guestForm, setGuestForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    billing_address: '',
    billing_city: '',
  })
  const [guestLoading, setGuestLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [checkoutConsents, setCheckoutConsents] = useState({
    kvkk: false,
    distance_sales: false,
  })

  const stepIndex = STEPS.findIndex(s => s.key === store.step)
  const isPaying = createSelfInvoice.isPending || initializeIyzico.isPending

  // İlk Ay Bedava: auto-populate ILKAY for new users with 0 paid invoices
  useEffect(() => {
    if (!user || store.promoValidated || store.promoCode) return
    const checkFirstMonth = async () => {
      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'paid')
      if (count === 0) {
        store.setPromoCode('ILKAY')
        store.validatePromoCode('ILKAY')
      }
    }
    checkFirstMonth()
  }, [user])

  const goNext = () => {
    const nextStep = STEPS[stepIndex + 1]
    if (nextStep) {
      if (nextStep.key === 'payment') {
        const ids = store.items.map(i => i.slug || i.id)
        const total = store.getTotal?.() ?? store.getSubtotal?.()
        initiateCheckout({ contentIds: ids, numItems: store.items.length, value: total, currency: 'TRY' })
        capiInitiateCheckout({ contentIds: ids, numItems: store.items.length, value: total, currency: 'TRY', email: store.customerInfo?.email })
      }
      if (nextStep.key === 'review') {
        capiAddPaymentInfo({
          value: store.getTotal?.() ?? store.getSubtotal?.(),
          currency: 'TRY',
          contentIds: store.items.map(i => i.slug || i.id),
          email: store.customerInfo?.email,
          phone: store.customerInfo?.phone,
        })
      }
      store.setStep(nextStep.key)
    }
  }

  const goBack = () => {
    const prevStep = STEPS[stepIndex - 1]
    if (prevStep) store.setStep(prevStep.key)
  }

  const handleGuestRegister = async () => {
    if (!guestForm.full_name || !guestForm.email || !guestForm.phone) {
      toast.error('Ad soyad, e-posta ve telefon zorunludur')
      return false
    }
    if (!turnstileToken) {
      toast.error('Lütfen güvenlik doğrulamasını tamamlayın')
      return false
    }
    setGuestLoading(true)
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL
      const functionsUrl = baseUrl.includes('/rest/v1') ? baseUrl.replace('/rest/v1', '/functions/v1') : `${baseUrl}/functions/v1`
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${functionsUrl}/guest-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify(guestForm),
      })
      const result = await res.json()

      if (!result.success) {
        if (result.existing_user) {
          // Mevcut kullanıcı - şifre ile giriş denemesi yap
          const loginPassword = prompt('Bu e-posta ile kayıtlı hesap var. Şifrenizi girin:')
          if (!loginPassword) return false
          const { error: loginErr } = await supabase.auth.signInWithPassword({
            email: guestForm.email,
            password: loginPassword,
          })
          if (loginErr) {
            toast.error('Giriş başarısız', { description: 'Şifre yanlış. Lütfen giriş sayfasından deneyin.' })
            navigate('/login')
            return false
          }
          toast.success('Giriş yapıldı')
          return true
        }
        throw new Error(result.error)
      }

      // Auto-login with session from edge function
      let loggedIn = false

      if (result.session?.access_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        })
        loggedIn = !sessionError
      }

      if (!loggedIn) {
        // Fallback: try password sign-in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: guestForm.email,
          password: result.password,
        })
        loggedIn = !signInError
      }

      if (!loggedIn) {
        toast.error('Otomatik giriş yapılamadı', { description: 'Lütfen SMS ile gelen bilgilerle giriş yapın' })
        navigate('/login')
        return false
      }

      // Wait for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 500))

      toast.success('Hesabınız oluşturuldu', { description: 'Giriş bilgileriniz SMS ile gönderildi' })
      return true
    } catch (err) {
      toast.error('Hesap oluşturulamadı', { description: err.message })
      return false
    } finally {
      setGuestLoading(false)
    }
  }

  const handlePayment = async () => {
    for (const item of store.items) {
      if (item.package_id) {
        const result = await verifyPrice(item.package_id)
        if (!result.valid) {
          toast.error('Fiyat değişmiş', { description: `${item.name}: ${result.error}` })
          return
        }
      }
    }

    // Guest checkout: register first
    if (!user) {
      const registered = await handleGuestRegister()
      if (!registered) return
    }

    // Verify we have a session now
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession) {
      toast.error('Oturum bulunamadı', { description: 'Lütfen giriş yapın' })
      navigate('/login')
      return
    }

    try {
      // Her zaman taze fatura oluştur (konfigürasyon değişmiş olabilir)
      const items = buildInvoiceItems(store.items, store.configurations, store.billingPeriod)
      const payload = { items }
      if (store.promoValidated && store.promoCode) payload.promo_code = store.promoCode
      const invoice = await createSelfInvoice.mutateAsync(payload)
      const invoiceId = invoice.id
      store.setCurrentInvoiceId(invoiceId)

      const result = await initializeIyzico.mutateAsync({
        invoice_id: invoiceId,
        return_url: `${window.location.origin}/payment-success`,
      })

      setIyzicoContent(result.checkoutFormContent || '')
      setIyzicoUrl(result.paymentPageUrl || '')
      setIyzicoOpen(true)
    } catch (error) {
      toast.error('Ödeme başlatılamadı', { description: error.message })
    }
  }

  // Empty cart
  if (store.items.length === 0 && store.step === 'cart') {
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

  return (
    <div className="min-h-screen bg-slate-950">
      <LandingHeader />

      <div className="max-w-5xl mx-auto px-4 pt-28 pb-16">
        {/* Step Progress */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {STEPS.map((s, i) => {
            const isActive = i === stepIndex
            const isDone = i < stepIndex
            const Icon = s.icon
            return (
              <div key={s.key} className="flex items-center">
                {i > 0 && <div className={`w-12 h-0.5 ${isDone ? 'bg-indigo-500' : 'bg-slate-800'}`} />}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive ? 'bg-indigo-600 text-white' : isDone ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800/60 text-slate-500'
                }`}>
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Step: Cart */}
        {store.step === 'cart' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">Sepetiniz</h2>

            {store.items.map((item) => (
              <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.description || item.product_type}</p>
                </div>
                <p className="font-bold text-white shrink-0">{formatPrice(item.price_monthly)}₺<span className="text-xs text-slate-500 font-normal">/ay</span></p>
                <button onClick={() => store.removeItem(item.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Billing Period */}
            <div className="pt-2">
              <p className="text-sm font-medium text-slate-300 mb-3">Fatura Dönemi</p>
              <div className="flex gap-2 flex-wrap">
                {BILLING_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => store.setBillingPeriod(opt.key)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      store.billingPeriod === opt.key
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                    {opt.discount > 0 && (
                      <span className="ml-2 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                        %{opt.discount} indirim
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Promo */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Promosyon kodu"
                  value={store.promoCode}
                  onChange={(e) => { store.setPromoCode(e.target.value); if (store.promoValidated) store.clearPromo() }}
                  className="max-w-xs bg-slate-900 border-slate-800 text-white placeholder:text-slate-600"
                  disabled={store.promoLoading || store.promoValidated}
                />
                {store.promoValidated ? (
                  <Button variant="ghost" className="border border-red-800 text-red-400 hover:text-red-300" onClick={() => store.clearPromo()}>
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
              {store.promoError && <p className="text-xs text-red-400">{store.promoError}</p>}
              {store.promoValidated && store.promoDetails && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <Check className="h-4 w-4" />
                  <span>
                    {store.promoDetails.is_first_month_free
                      ? 'İlk ay bedava! Kodunuz uygulandı'
                      : store.promoDetails.discount_type === 'percentage'
                        ? `%${store.promoDetails.discount_value} indirim uygulandı`
                        : `${store.promoDetails.calculated_discount}₺ indirim uygulandı`}
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-slate-800 pt-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Toplam</p>
                <p className="text-2xl font-bold text-white">{formatPrice(store.getTotal())}₺</p>
              </div>
              <Button onClick={goNext} className="gap-2 bg-indigo-600 hover:bg-indigo-500 h-11 px-6">
                Devam <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Config */}
        {store.step === 'config' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Yapılandırma</h2>
            <p className="text-slate-400">Hizmetleriniz için tercihlerinizi belirleyin.</p>

            <div className="lg:grid lg:grid-cols-[1fr_300px] gap-6">
            {/* Left - Config options */}
            <div className="space-y-6">
            {store.items.map((item) => {
              const isServer = ['vps', 'vds', 'dedicated'].includes(item.product_type)
              const isHosting = item.product_type === 'hosting'
              const config = store.configurations[item.id] || {}

              return (
                <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                  {/* Item header */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-800/30">
                    <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      {isServer ? <Server className="h-4 w-4 text-indigo-400" /> : <Globe className="h-4 w-4 text-indigo-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.product_type?.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* OS Selection - for servers */}
                    {isServer && (
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-3 block">İşletim Sistemi</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {OS_OPTIONS.map((os) => (
                            <button
                              key={os.key}
                              onClick={() => store.updateItemConfig(item.id, { os: os.key })}
                              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm transition-all ${
                                (config.os || 'ubuntu-22') === os.key
                                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              <OsIcon src={os.img} alt={os.label} />
                              <span className="font-medium">{os.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Panel Selection - for servers */}
                    {isServer && (
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-3 block">Kontrol Paneli</label>
                        <div className="grid grid-cols-2 gap-2">
                          {PANEL_OPTIONS.map((panel) => (
                            <button
                              key={panel.key}
                              onClick={() => store.updateItemConfig(item.id, { panel: panel.key })}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                (config.panel || 'none') === panel.key
                                  ? 'border-indigo-500 bg-indigo-500/10'
                                  : 'border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <p className={`text-sm font-medium ${(config.panel || 'none') === panel.key ? 'text-indigo-300' : 'text-slate-300'}`}>
                                {panel.label}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{panel.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Domain - for hosting */}
                    {isHosting && (
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-3 block">Domain</label>
                        <div className="space-y-2">
                          {HOSTING_DOMAIN_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => store.updateItemConfig(item.id, { domain_option: opt.key })}
                              className={`w-full p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                                (config.domain_option || 'later') === opt.key
                                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                          {config.domain_option === 'existing' && (
                            <Input
                              placeholder="ornek.com"
                              value={config.domain_name || ''}
                              onChange={(e) => store.updateItemConfig(item.id, { domain_name: e.target.value })}
                              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 mt-2"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Snapshot - for servers */}
                    {isServer && (
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-3 block">VM Snapshot</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {SNAPSHOT_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => store.updateItemConfig(item.id, { snapshot: opt.key })}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                (config.snapshot || '0') === opt.key
                                  ? 'border-indigo-500 bg-indigo-500/10'
                                  : 'border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <p className={`text-sm font-medium ${(config.snapshot || '0') === opt.key ? 'text-indigo-300' : 'text-slate-300'}`}>{opt.label}</p>
                              {opt.price > 0 ? <p className="text-xs text-emerald-400 mt-0.5">+{formatPrice(opt.price)}₺/ay</p> : <p className="text-xs text-slate-500 mt-0.5">Ücretsiz</p>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suspend period - for servers */}
                    {isServer && (
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-1 block">Askı Süresi</label>
                        <p className="text-xs text-slate-500 mb-3">Ödeme tarihi geçtiğinde hizmetinizin askıda kalma süresini belirleyin.</p>
                        <div className="grid grid-cols-3 gap-2">
                          {SUSPEND_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => store.updateItemConfig(item.id, { suspend: opt.key })}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                (config.suspend || 'delete') === opt.key
                                  ? 'border-indigo-500 bg-indigo-500/10'
                                  : 'border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <p className={`text-sm font-medium ${(config.suspend || 'delete') === opt.key ? 'text-indigo-300' : 'text-slate-300'}`}>{opt.label}</p>
                              {opt.price > 0 ? <p className="text-xs text-emerald-400 mt-0.5">+{formatPrice(opt.price)}₺</p> : <p className="text-xs text-slate-500 mt-0.5">Ücretsiz</p>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hostname - for servers */}
                    {isServer && (
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Sunucu Adı (Hostname)</label>
                        <Input
                          placeholder="server1.ornek.com"
                          value={config.hostname || ''}
                          onChange={(e) => store.updateItemConfig(item.id, { hostname: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 max-w-md"
                        />
                        <p className="text-xs text-slate-600 mt-1.5">Opsiyonel. Boş bırakılırsa otomatik atanır.</p>
                      </div>
                    )}

                    {/* Extra Disk - for servers */}
                    {isServer && (
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-3 block">Ek Disk Alanı</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {EXTRA_DISK_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => store.updateItemConfig(item.id, { extra_disk: opt.key })}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                (config.extra_disk || '0') === opt.key
                                  ? 'border-indigo-500 bg-indigo-500/10'
                                  : 'border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <p className={`text-sm font-medium ${(config.extra_disk || '0') === opt.key ? 'text-indigo-300' : 'text-slate-300'}`}>{opt.label}</p>
                              {opt.price > 0 && <p className="text-xs text-emerald-400 mt-0.5">+{formatPrice(opt.price)}₺/ay</p>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extra IP - for servers */}
                    {isServer && (
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-3 block">Ek IP Adresi</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {EXTRA_IP_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => store.updateItemConfig(item.id, { extra_ip: opt.key })}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                (config.extra_ip || '0') === opt.key
                                  ? 'border-indigo-500 bg-indigo-500/10'
                                  : 'border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <p className={`text-sm font-medium ${(config.extra_ip || '0') === opt.key ? 'text-indigo-300' : 'text-slate-300'}`}>{opt.label}</p>
                              {opt.price > 0 && <p className="text-xs text-emerald-400 mt-0.5">+{formatPrice(opt.price)}₺/ay</p>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DDoS Protection - for servers */}
                    {isServer && (
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-3 block">DDoS Koruma Seviyesi</label>
                        <div className="grid grid-cols-2 gap-2">
                          {DDOS_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => store.updateItemConfig(item.id, { ddos: opt.key })}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                (config.ddos || 'standard') === opt.key
                                  ? 'border-indigo-500 bg-indigo-500/10'
                                  : 'border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <p className={`text-sm font-medium ${(config.ddos || 'standard') === opt.key ? 'text-indigo-300' : 'text-slate-300'}`}>{opt.label}</p>
                              {opt.price > 0 ? <p className="text-xs text-emerald-400 mt-0.5">+{formatPrice(opt.price)}₺/ay</p> : <p className="text-xs text-slate-500 mt-0.5">Ücretsiz</p>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Backup - for servers */}
                    {isServer && (
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-3 block">Yedekleme Hizmeti</label>
                        <div className="grid grid-cols-3 gap-2">
                          {BACKUP_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => store.updateItemConfig(item.id, { backup: opt.key })}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                (config.backup || 'none') === opt.key
                                  ? 'border-indigo-500 bg-indigo-500/10'
                                  : 'border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <p className={`text-sm font-medium ${(config.backup || 'none') === opt.key ? 'text-indigo-300' : 'text-slate-300'}`}>{opt.label}</p>
                              {opt.price > 0 ? <p className="text-xs text-emerald-400 mt-0.5">+{formatPrice(opt.price)}₺/ay</p> : <p className="text-xs text-slate-500 mt-0.5">Ücretsiz</p>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Note */}
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Sipariş Notu</label>
                      <Input
                        placeholder="Opsiyonel notunuz..."
                        value={config.note || ''}
                        onChange={(e) => store.updateItemConfig(item.id, { note: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            </div>

            {/* Right - Sticky order summary */}
            <div className="hidden lg:block w-[300px] shrink-0">
              <div className="sticky top-24">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    Sipariş Özeti
                  </h3>

                  <div className="space-y-3">
                    {store.items.map((item) => {
                      const config = store.configurations[item.id] || {}
                      const extras = calcExtrasPrice(config)
                      return (
                        <div key={item.id} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300 font-medium">{item.name}</span>
                            <span className="text-white font-medium">{formatPrice(item.price_monthly)}₺</span>
                          </div>
                          {/* Show selected extras */}
                          {config.os && config.os !== 'ubuntu-22' && (
                            <div className="flex justify-between text-xs text-slate-500 pl-2">
                              <span>» {OS_OPTIONS.find(o => o.key === config.os)?.label}</span>
                              <span>0,00₺</span>
                            </div>
                          )}
                          {config.panel && config.panel !== 'none' && (
                            <div className="flex justify-between text-xs text-slate-500 pl-2">
                              <span>» {PANEL_OPTIONS.find(o => o.key === config.panel)?.label}</span>
                              <span>0,00₺</span>
                            </div>
                          )}
                          {config.extra_disk && config.extra_disk !== '0' && (
                            <div className="flex justify-between text-xs text-emerald-400/70 pl-2">
                              <span>» {EXTRA_DISK_OPTIONS.find(o => o.key === config.extra_disk)?.label}</span>
                              <span>+{formatPrice(EXTRA_DISK_OPTIONS.find(o => o.key === config.extra_disk)?.price || 0)}₺</span>
                            </div>
                          )}
                          {config.extra_ip && config.extra_ip !== '0' && (
                            <div className="flex justify-between text-xs text-emerald-400/70 pl-2">
                              <span>» {EXTRA_IP_OPTIONS.find(o => o.key === config.extra_ip)?.label}</span>
                              <span>+{formatPrice(EXTRA_IP_OPTIONS.find(o => o.key === config.extra_ip)?.price || 0)}₺</span>
                            </div>
                          )}
                          {config.ddos && config.ddos !== 'standard' && (
                            <div className="flex justify-between text-xs text-emerald-400/70 pl-2">
                              <span>» Gelişmiş DDoS</span>
                              <span>+{formatPrice(DDOS_OPTIONS.find(o => o.key === config.ddos)?.price || 0)}₺</span>
                            </div>
                          )}
                          {config.backup && config.backup !== 'none' && (
                            <div className="flex justify-between text-xs text-emerald-400/70 pl-2">
                              <span>» {BACKUP_OPTIONS.find(o => o.key === config.backup)?.label}</span>
                              <span>+{formatPrice(BACKUP_OPTIONS.find(o => o.key === config.backup)?.price || 0)}₺</span>
                            </div>
                          )}
                          {config.snapshot && config.snapshot !== '0' && (
                            <div className="flex justify-between text-xs text-emerald-400/70 pl-2">
                              <span>» {SNAPSHOT_OPTIONS.find(o => o.key === config.snapshot)?.label}</span>
                              <span>+{formatPrice(SNAPSHOT_OPTIONS.find(o => o.key === config.snapshot)?.price || 0)}₺</span>
                            </div>
                          )}
                          {config.suspend && config.suspend !== 'delete' && (
                            <div className="flex justify-between text-xs text-emerald-400/70 pl-2">
                              <span>» Askı süresi</span>
                              <span>+{formatPrice(SUSPEND_OPTIONS.find(o => o.key === config.suspend)?.price || 0)}₺</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="border-t border-slate-700 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Aylık</span>
                      <span className="text-white font-medium">{formatPrice(calcGrandTotal(store.items, store.configurations))}₺</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">KDV (%20)</span>
                      <span className="text-white font-medium">{formatPrice(calcGrandTotal(store.items, store.configurations) * 0.2)}₺</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-700">
                      <span className="text-white font-semibold">Toplam</span>
                      <span className="text-indigo-400 font-bold text-lg">{formatPrice(calcGrandTotal(store.items, store.configurations) * 1.2)}₺</span>
                    </div>
                  </div>

                  <Button onClick={goNext} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-500 h-10">
                    Devam <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={goBack} className="w-full gap-2 border border-slate-800 text-slate-400 hover:bg-slate-800 h-9 text-xs">
                    <ArrowLeft className="h-3 w-3" /> Geri
                  </Button>
                </div>
              </div>
            </div>
            </div>

            {/* Mobile bottom bar */}
            <div className="lg:hidden flex justify-between items-center pt-4 border-t border-slate-800">
              <div>
                <p className="text-xs text-slate-500">Toplam (KDV dahil)</p>
                <p className="text-xl font-bold text-white">{formatPrice(calcGrandTotal(store.items, store.configurations) * 1.2)}₺</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={goBack} className="border border-slate-800 text-slate-300 hover:bg-slate-800">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button onClick={goNext} className="gap-2 bg-indigo-600 hover:bg-indigo-500">
                  Devam <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {store.step === 'review' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">Sipariş Özeti</h2>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-3">
              {store.items.map((item) => {
                const config = store.configurations[item.id] || {}
                const extras = calcExtrasPrice(config)
                return (
                  <div key={item.id} className="py-3 border-b border-slate-800 last:border-0 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-medium">{item.name}</span>
                      <span className="font-medium text-white">{formatPrice(item.price_monthly)}₺/ay</span>
                    </div>
                    {config.os && (
                      <div className="flex justify-between text-xs text-slate-500 pl-3">
                        <span>İşletim Sistemi: {OS_OPTIONS.find(o => o.key === config.os)?.label || config.os}</span>
                      </div>
                    )}
                    {config.panel && config.panel !== 'none' && (
                      <div className="flex justify-between text-xs text-slate-500 pl-3">
                        <span>Panel: {PANEL_OPTIONS.find(o => o.key === config.panel)?.label}</span>
                      </div>
                    )}
                    {extras > 0 && (
                      <div className="flex justify-between text-xs text-emerald-400 pl-3">
                        <span>Ek hizmetler</span>
                        <span>+{formatPrice(extras)}₺/ay</span>
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="flex justify-between text-sm pt-2">
                <span className="text-slate-400">Aylık Tutar</span>
                <span className="text-white">{formatPrice(calcGrandTotal(store.items, store.configurations))}₺</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">KDV (%20)</span>
                <span className="text-white">{formatPrice(calcGrandTotal(store.items, store.configurations) * 0.2)}₺</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-lg font-bold">
                <span className="text-slate-300">Toplam</span>
                <span className="text-indigo-400">{formatPrice(calcGrandTotal(store.items, store.configurations) * 1.2)}₺</span>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={goBack} className="gap-2 border border-slate-800 text-slate-300 hover:bg-slate-800">
                <ArrowLeft className="h-4 w-4" /> Geri
              </Button>
              <Button onClick={goNext} className="gap-2 bg-indigo-600 hover:bg-indigo-500">
                Ödemeye Geç <CreditCard className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {store.step === 'payment' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">Ödeme</h2>

            {/* Guest info form - only if not logged in */}
            {!user && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-400" />
                  Müşteri Bilgileri
                </h3>
                <p className="text-xs text-slate-500 mb-4">Hesabınız otomatik oluşturulacak ve giriş bilgileriniz telefonunuza SMS ile gönderilecektir.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Ad Soyad *</label>
                    <Input
                      placeholder="Enes Poyraz"
                      value={guestForm.full_name}
                      onChange={(e) => setGuestForm(p => ({ ...p, full_name: e.target.value }))}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Telefon *</label>
                    <PhoneInput
                      value={guestForm.phone}
                      onChange={(phone) => setGuestForm(p => ({ ...p, phone }))}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-400 mb-1 block">E-posta *</label>
                    <Input
                      type="email"
                      placeholder="ornek@mail.com"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm(p => ({ ...p, email: e.target.value }))}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Şirket (Opsiyonel)</label>
                    <Input
                      placeholder="Şirket adı"
                      value={guestForm.company_name}
                      onChange={(e) => setGuestForm(p => ({ ...p, company_name: e.target.value }))}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Şehir (Opsiyonel)</label>
                    <Input
                      placeholder="İstanbul"
                      value={guestForm.billing_city}
                      onChange={(e) => setGuestForm(p => ({ ...p, billing_city: e.target.value }))}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Adres (Opsiyonel)</label>
                    <Input
                      placeholder="Fatura adresi"
                      value={guestForm.billing_address}
                      onChange={(e) => setGuestForm(p => ({ ...p, billing_address: e.target.value }))}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Turnstile for guest checkout */}
            {!user && (
              <div className="flex justify-center">
                <Turnstile onVerify={setTurnstileToken} theme="dark" />
              </div>
            )}

            {/* KVKK & Sözleşme Onayları */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Yasal Onaylar</h3>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="checkout_kvkk"
                  checked={checkoutConsents.kvkk}
                  onCheckedChange={(v) => setCheckoutConsents(p => ({ ...p, kvkk: v }))}
                  className="mt-0.5"
                />
                <label htmlFor="checkout_kvkk" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                  <a href="/kvkk" target="_blank" className="text-indigo-400 hover:text-indigo-300 underline">KVKK Aydınlatma Metni</a>'ni ve{' '}
                  <a href="/privacy" target="_blank" className="text-indigo-400 hover:text-indigo-300 underline">Gizlilik Politikası</a>'nı okudum, kişisel verilerimin işlenmesini kabul ediyorum.
                </label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="checkout_distance"
                  checked={checkoutConsents.distance_sales}
                  onCheckedChange={(v) => setCheckoutConsents(p => ({ ...p, distance_sales: v }))}
                  className="mt-0.5"
                />
                <label htmlFor="checkout_distance" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                  <a href="/distance-sales" target="_blank" className="text-indigo-400 hover:text-indigo-300 underline">Mesafeli Satış Sözleşmesi</a>'ni ve{' '}
                  <a href="/terms" target="_blank" className="text-indigo-400 hover:text-indigo-300 underline">Kullanım Koşulları</a>'nı okudum ve kabul ediyorum.
                </label>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <p className="text-slate-400 mb-5">Ödeme yönteminizi seçin</p>
              <div className="space-y-3">
                <button
                  onClick={handlePayment}
                  disabled={isPaying || guestLoading || !checkoutConsents.kvkk || !checkoutConsents.distance_sales}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left disabled:opacity-50"
                >
                  {(isPaying || guestLoading) ? <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" /> : <CreditCard className="h-5 w-5 text-indigo-400" />}
                  <div>
                    <p className="font-medium text-white">{guestLoading ? 'Hesap oluşturuluyor...' : isPaying ? 'Ödeme başlatılıyor...' : 'Kredi Kartı ile Öde'}</p>
                    <p className="text-xs text-slate-500">iyzico / Tosla / Tami güvenli ödeme altyapısı</p>
                  </div>
                </button>
                <button
                  onClick={async () => {
                    if (!user) {
                      if (!guestForm.full_name || !guestForm.email || !guestForm.phone) {
                        toast.error('Lütfen önce müşteri bilgilerinizi doldurun')
                        return
                      }
                      const registered = await handleGuestRegister()
                      if (!registered) return
                    }
                    setBankModalOpen(true)
                  }}
                  disabled={guestLoading || !checkoutConsents.kvkk || !checkoutConsents.distance_sales}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left disabled:opacity-50"
                >
                  {guestLoading ? <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" /> : <Building2 className="h-5 w-5 text-emerald-400" />}
                  <div>
                    <p className="font-medium text-white">{guestLoading ? 'Hesap oluşturuluyor...' : 'Havale / EFT'}</p>
                    <p className="text-xs text-slate-500">Banka hesap bilgilerimizi görüntüleyin</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Order summary mini */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Sipariş Tutarı</span>
                <span className="text-white font-medium">{formatPrice(calcGrandTotal(store.items, store.configurations))}₺</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">KDV (%20)</span>
                <span className="text-white font-medium">{formatPrice(calcGrandTotal(store.items, store.configurations) * 0.2)}₺</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700">
                <span className="text-slate-300 font-semibold">Toplam</span>
                <span className="text-indigo-400 font-bold text-lg">{formatPrice(calcGrandTotal(store.items, store.configurations) * 1.2)}₺</span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={goBack} className="gap-2 border border-slate-800 text-slate-300 hover:bg-slate-800">
                <ArrowLeft className="h-4 w-4" /> Geri
              </Button>
            </div>
          </div>
        )}
      </div>

      <LandingFooter />

      {/* Bank Transfer Modal */}
      {bankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBankModalOpen(false)} />
          <div className="relative z-50 w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-400" />
                Havale / EFT Bilgileri
              </h3>
              <button onClick={() => setBankModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* İş Bankası */}
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <div className="bg-slate-800 px-5 py-5 flex items-center justify-center">
                  <img src="/isbankasi-removebg-preview.png" alt="İş Bankası" className="h-16 w-auto object-contain brightness-0 invert" />
                </div>
                <div className="bg-slate-900 p-4 space-y-3">
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider">Hesap Sahibi</p>
                    <p className="text-sm font-semibold text-white mt-0.5">Enes POYRAZ</p>
                  </div>
                  <div className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider">IBAN</p>
                      <p className="text-[13px] font-mono font-semibold text-white mt-0.5 tracking-wider">TR24 0006 4000 0012 2051 4479 69</p>
                    </div>
                    <button onClick={() => handleCopyIban('TR240006400000122051447969', 'is')} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0 ml-3">
                      {copiedField === 'is' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* VakıfBank */}
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <div className="bg-slate-800 px-5 py-5 flex items-center justify-center">
                  <img src="/vakitbank_de9b7a5f51-removebg-preview.png" alt="VakıfBank" className="h-16 w-auto object-contain brightness-0 invert" />
                </div>
                <div className="bg-slate-900 p-4 space-y-3">
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider">Hesap Sahibi</p>
                    <p className="text-sm font-semibold text-white mt-0.5">Enes POYRAZ</p>
                  </div>
                  <div className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider">IBAN</p>
                      <p className="text-[13px] font-mono font-semibold text-white mt-0.5 tracking-wider">TR14 0001 5001 5800 7379 9097 49</p>
                    </div>
                    <button onClick={() => handleCopyIban('TR140001500158007379909749', 'vakif')} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0 ml-3">
                      {copiedField === 'vakif' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              </div>

              {/* Notes */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <ul className="space-y-1.5 text-xs text-slate-400">
                  <li className="flex gap-2"><span className="text-indigo-400">•</span>Açıklamaya <strong className="text-slate-200">e-posta adresinizi</strong> yazın</li>
                  <li className="flex gap-2"><span className="text-indigo-400">•</span>Mesai içi <strong className="text-slate-200">1-2 saat</strong>, mesai dışı sonraki iş günü onaylanır</li>
                  <li className="flex gap-2"><span className="text-indigo-400">•</span>Onay sonrası hizmetiniz otomatik aktif edilir</li>
                </ul>
              </div>

              <Button
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                disabled={isPaying}
                onClick={async () => {
                  // Misafir ise önce kayıt
                  if (!user) {
                    if (!guestForm.full_name || !guestForm.email || !guestForm.phone) {
                      toast.error('Lütfen önce müşteri bilgilerinizi doldurun')
                      setBankModalOpen(false)
                      return
                    }
                    const registered = await handleGuestRegister()
                    if (!registered) { setBankModalOpen(false); return }
                  }

                  // Session kontrolü
                  const { data: { session: sess } } = await supabase.auth.getSession()
                  if (!sess) {
                    toast.error('Oturum bulunamadı')
                    setBankModalOpen(false)
                    navigate('/login')
                    return
                  }

                  try {
                    // Fatura oluştur (unpaid olarak)
                    const items = buildInvoiceItems(store.items, store.configurations, store.billingPeriod)
                    const bankPayload = { items }
                    if (store.promoValidated && store.promoCode) bankPayload.promo_code = store.promoCode
                    const invoice = await createSelfInvoice.mutateAsync(bankPayload)

                    // Faturaya havale/EFT notu ekle
                    await supabase.from('invoices').update({
                      payment_method: 'Havale / EFT',
                      notes: 'Müşteri havale/EFT ile ödeme yaptığını beyan etti. Onay bekleniyor.',
                    }).eq('id', invoice.id)

                    setBankModalOpen(false)
                    store.clearCheckout()
                    toast.success('Siparişiniz alındı!', {
                      description: 'Havale/EFT ödemeniz onaylandıktan sonra hizmetiniz aktif edilecektir.',
                      duration: 8000,
                    })
                    navigate('/payment-success?method=bank_transfer&invoice=' + invoice.id)
                  } catch (err) {
                    toast.error('Sipariş oluşturulamadı', { description: err.message })
                  }
                }}
              >
                {isPaying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                {isPaying ? 'İşleniyor...' : 'Ödeme Yaptım'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <IyzicoPaymentDialog
        open={iyzicoOpen}
        onOpenChange={setIyzicoOpen}
        paymentPageUrl={iyzicoUrl}
        htmlContent={iyzicoContent}
      />
    </div>
  )
}
