import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useProductCache } from '@/contexts/ProductCacheContext'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCreateSelfInvoice, useInitializeIyzicoPayment } from '@/hooks/useInvoices'
import { supabase } from '@/lib/supabase'
import IyzicoPaymentDialog from '@/components/payments/IyzicoPaymentDialog'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ShoppingCart, Settings, FileText, CreditCard, Trash2, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'

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

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(price)

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

  const stepIndex = STEPS.findIndex(s => s.key === store.step)
  const isPaying = createSelfInvoice.isPending || initializeIyzico.isPending

  const goNext = () => {
    const nextStep = STEPS[stepIndex + 1]
    if (nextStep) store.setStep(nextStep.key)
  }

  const goBack = () => {
    const prevStep = STEPS[stepIndex - 1]
    if (prevStep) store.setStep(prevStep.key)
  }

  const handlePayment = async () => {
    // Verify prices before payment
    for (const item of store.items) {
      if (item.package_id) {
        const result = await verifyPrice(item.package_id)
        if (!result.valid) {
          toast.error('Fiyat değişmiş', { description: `${item.name}: ${result.error}` })
          return
        }
      }
    }

    if (!user) {
      toast.info('Ödeme için giriş yapmalısınız')
      navigate('/login')
      return
    }

    try {
// 1. Create or reuse unpaid invoice
      let invoiceId = store.currentInvoiceId

      if (invoiceId) {
// Reuse if still unpaid, otherwise start fresh
        const { data: existing } = await supabase
          .from('invoices')
          .select('id, status')
          .eq('id', invoiceId)
          .maybeSingle()
        if (!existing || existing.status !== 'unpaid') {
          invoiceId = null
          store.setCurrentInvoiceId(null)
        }
      }

      if (!invoiceId) {
        const items = store.items.map(ci => ({
          type: ci.product_type === 'vds' || ci.product_type === 'vps' || ci.product_type === 'dedicated'
            ? 'vds'
            : 'hosting',
          package_id: ci.package_id,
          billing_period: store.billingPeriod,
          quantity: 1,
        }))

        const invoice = await createSelfInvoice.mutateAsync({ items })
        invoiceId = invoice.id
        store.setCurrentInvoiceId(invoiceId)
      }

// 2. Initialize iyzico payment
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

  if (store.items.length === 0 && store.step === 'cart') {
    return (
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sepetiniz Boş</h1>
          <p className="text-muted-foreground mb-6">Hizmet eklemek için ürün sayfalarımızı inceleyin.</p>
          <Button onClick={() => navigate('/vds')}>Ürünleri İncele</Button>
        </div>
        <LandingFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Step Progress */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {STEPS.map((s, i) => {
            const isActive = i === stepIndex
            const isDone = i < stepIndex
            const Icon = s.icon
            return (
              <div key={s.key} className="flex items-center">
                {i > 0 && <div className={`w-12 h-0.5 ${isDone ? 'bg-primary' : 'bg-muted'}`} />}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive ? 'bg-primary text-white' : isDone ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        {store.step === 'cart' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Sepetiniz</h2>
            {store.items.map((item) => (
              <Card key={item.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.description || item.product_type}</p>
                </div>
                <p className="font-bold">{formatPrice(item.price_monthly)}\u20BA<span className="text-xs text-muted-foreground font-normal">/ay</span></p>
                <Button variant="ghost" size="icon" onClick={() => store.removeItem(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}

            {/* Billing Period */}
            <div className="pt-4">
              <p className="text-sm font-medium mb-3">Fatura Dönemi</p>
              <div className="flex gap-2 flex-wrap">
                {BILLING_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => store.setBillingPeriod(opt.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      store.billingPeriod === opt.key
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    {opt.label}
                    {opt.discount > 0 && <Badge className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 border-0">%{opt.discount} indirim</Badge>}
                  </button>
                ))}
              </div>
            </div>

            {/* Promo (disabled - "Yakında") */}
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Promosyon kodu (Yakında)"
                value={store.promoCode}
                onChange={(e) => store.setPromoCode(e.target.value)}
                className="max-w-xs"
                disabled
              />
              <Button
                variant="outline"
                disabled
                onClick={() => toast.info('Promosyon kodları yakında aktif olacak')}
              >
                Uygula
              </Button>
            </div>

            {/* Total */}
            <div className="border-t pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam</p>
                <p className="text-2xl font-bold">{formatPrice(store.getTotal())}\u20BA</p>
              </div>
              <Button onClick={goNext} className="gap-2">
                Devam <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {store.step === 'config' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Yapılandırma</h2>
            <p className="text-muted-foreground">Hizmetleriniz için ek ayarları seçin.</p>
            {store.items.map((item) => (
              <Card key={item.id} className="p-5">
                <p className="font-medium mb-3">{item.name}</p>
                <p className="text-sm text-muted-foreground">Ek yapılandırma seçenekleri yakında eklenecek.</p>
              </Card>
            ))}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> Geri</Button>
              <Button onClick={goNext} className="gap-2">Devam <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {store.step === 'review' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Sipariş Özeti</h2>
            <Card className="p-5 space-y-3">
              {store.items.map((item) => (
                <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
                  <span>{item.name}</span>
                  <span className="font-medium">{formatPrice(item.price_monthly)}\u20BA/ay</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-lg font-bold">
                <span>Toplam</span>
                <span>{formatPrice(store.getTotal())}\u20BA</span>
              </div>
            </Card>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> Geri</Button>
              <Button onClick={goNext} className="gap-2">Ödemeye Geç <CreditCard className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {store.step === 'payment' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Ödeme</h2>
            <Card className="p-5">
              <p className="text-muted-foreground mb-4">Ödeme yönteminizi seçin</p>
              <div className="space-y-3">
                <Button
                  className="w-full h-12 justify-start gap-3"
                  variant="outline"
                  onClick={handlePayment}
                  disabled={isPaying}
                >
                  {isPaying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                  {isPaying ? 'Ödeme başlatılıyor...' : 'Kredi Kartı ile Öde (iyzico)'}
                </Button>
                <Button className="w-full h-12 justify-start gap-3" variant="outline" onClick={() => {
                  toast.info('Havale Bilgileri', {
                    description: 'Enes POYRAZ - İş Bankası\nTR240006400000122051447969\nAçıklama: Sipariş ödemesi',
                    duration: 15000,
                  })
                }}>
                  <FileText className="h-5 w-5" /> Havale / EFT
                </Button>
              </div>
            </Card>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> Geri</Button>
            </div>
          </div>
        )}
      </div>

      <LandingFooter />

      <IyzicoPaymentDialog
        open={iyzicoOpen}
        onOpenChange={setIyzicoOpen}
        paymentPageUrl={iyzicoUrl}
        htmlContent={iyzicoContent}
      />
    </div>
  )
}
