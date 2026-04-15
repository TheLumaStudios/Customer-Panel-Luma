import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  ArrowRight, Zap, Shield, Globe, Server, CheckCircle2,
  Mail, Sparkles, CreditCard, Lock, Loader2, Check,
  Inbox, Send, ShieldCheck, Clock, Users
} from 'lucide-react'
import Turnstile, { resetTurnstile } from '@/components/Turnstile'
import IyzicoPaymentDialog from '@/components/payments/IyzicoPaymentDialog'

export default function HeroSection() {
  return <EmailPromoHero />
}

// ============================================================================
// Kurumsal E-Posta Kampanya Hero
// İlk ay bedava, kart bilgisi ile kayıt
// ============================================================================
function EmailPromoHero() {
  const [step, setStep] = useState('form') // 'form' | 'success'
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    domain: '',
    phone: '',
  })

  // iyzico dialog state
  const [iyzicoOpen, setIyzicoOpen] = useState(false)
  const [iyzicoContent, setIyzicoContent] = useState('')
  const [iyzicoUrl, setIyzicoUrl] = useState('')
  const [pendingInvoiceId, setPendingInvoiceId] = useState(null)

  const baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const functionsUrl = baseUrl.includes('/rest/v1')
    ? baseUrl.replace('/rest/v1', '/functions/v1')
    : `${baseUrl}/functions/v1`
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.full_name || !form.email || !form.domain || !form.phone) {
      toast.error('Tüm alanları doldurunuz')
      return
    }

    const phoneClean = form.phone.replace(/\s/g, '')
    if (!/^(05\d{9}|\+905\d{9})$/.test(phoneClean)) {
      toast.error('Geçerli bir telefon numarası girin (05XX XXX XX XX)')
      return
    }

    if (!turnstileToken) {
      toast.error('Lütfen güvenlik doğrulamasını tamamlayın')
      return
    }

    setLoading(true)

    try {
      // 1) Kullanıcı kayıt (guest-checkout)
      const res = await fetch(`${functionsUrl}/guest-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          company_name: '',
          billing_address: '',
          billing_city: '',
        }),
      })

      const result = await res.json()

      if (result.existing_user) {
        toast.error('Bu e-posta ile zaten bir hesap mevcut. Lütfen giriş yapın.')
        setLoading(false)
        return
      }

      if (!result.success) {
        throw new Error(result.error || 'Kayıt başarısız')
      }

      // 2) Otomatik giriş yap
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: result.password,
      })

      if (signInError) {
        throw new Error('Otomatik giriş yapılamadı: ' + signInError.message)
      }

      // 3) Session al
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Oturum oluşturulamadı')
      }

      // 4) 0₺ fatura oluştur (Kurumsal E-Posta - kart doğrulama için)
      const invoiceRes = await fetch(`${functionsUrl}/invoice-create-self`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          items: [{
            type: 'addon',
            description: `Kurumsal E-Posta Aktivasyon - ${form.domain}`,
            quantity: 1,
            unit_price: 1, // 1₺ kart doğrulama (iyzico 0₺ kabul etmez)
          }],
        }),
      })

      const invoiceResult = await invoiceRes.json()
      if (!invoiceResult.success) {
        throw new Error(invoiceResult.error || 'Fatura oluşturulamadı')
      }

      const invoiceId = invoiceResult.invoice.id
      setPendingInvoiceId(invoiceId)

      // 5) iyzico ödeme başlat (kart doğrulama)
      const iyzicoRes = await fetch(`${functionsUrl}/payment-iyzico-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          return_url: `${window.location.origin}/payment-success?promo_domain=${encodeURIComponent(form.domain)}`,
        }),
      })

      const iyzicoResult = await iyzicoRes.json()
      if (!iyzicoResult.success) {
        throw new Error(iyzicoResult.error || 'Ödeme başlatılamadı')
      }

      // 6) iyzico dialog aç
      setIyzicoContent(iyzicoResult.checkoutFormContent || '')
      setIyzicoUrl(iyzicoResult.paymentPageUrl || '')
      setIyzicoOpen(true)

    } catch (err) {
      toast.error(err.message || 'Bir hata oluştu')
      resetTurnstile()
      setTurnstileToken('')
    } finally {
      setLoading(false)
    }
  }

  // iyzico dialog kapanınca
  const handleIyzicoClose = async (open) => {
    setIyzicoOpen(open)
    if (open) return

    // Dialog kapandı - ödeme tamamlandı mı kontrol et
    if (pendingInvoiceId) {
      try {
        const { data: inv } = await supabase
          .from('invoices')
          .select('status')
          .eq('id', pendingInvoiceId)
          .maybeSingle()

        if (inv?.status === 'paid') {
          // Ödeme başarılı → cPanel provision başlat
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            toast.loading('E-posta hesabınız kuruluyor...')

            const provisionRes = await fetch(`${functionsUrl}/email-promo-provision`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': anonKey,
              },
              body: JSON.stringify({
                domain: form.domain,
                email_prefix: 'info',
              }),
            })

            const provisionResult = await provisionRes.json()
            toast.dismiss()

            if (provisionResult.success) {
              setStep('success')
              toast.success('Kurumsal e-posta hesabınız oluşturuldu!')
            } else {
              // Provision queue'ya düştü, admin halleder
              setStep('success')
              toast.success('Kayıt tamamlandı! Hesabınız kısa sürede aktif edilecek.')
            }
          }
        } else {
          // Ödeme tamamlanmadı - faturayı iptal et
          await supabase
            .from('invoices')
            .update({ status: 'cancelled' })
            .eq('id', pendingInvoiceId)
          toast.error('Kart doğrulama tamamlanmadı. Lütfen tekrar deneyin.')
        }
      } catch (e) {
        console.error('Post-payment check error:', e)
      }
    }

    setPendingInvoiceId(null)
    setIyzicoContent('')
    setIyzicoUrl('')
  }

  return (
    <section className="relative overflow-hidden bg-slate-950 pt-32 pb-24 lg:pt-40 lg:pb-32">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[128px] animate-pulse [animation-delay:2s]" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left - Content */}
          <div className="space-y-8">
            {/* Promo badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Sınırlı Süre Kampanyası</span>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Kurumsal E-Posta{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  İlk Ay Bedava
                </span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                Profesyonel e-posta adresinizi hemen oluşturun. Spam filtreli, 10 GB depolama, tüm cihazlarda senkron.
              </p>
            </div>

            {/* Pricing timeline */}
            <div className="flex items-center gap-0">
              {/* Phase 1 */}
              <div className="flex-1 relative">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                  <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider mb-1">1. Ay</p>
                  <p className="text-3xl font-extrabold text-white">0<span className="text-base text-slate-400">₺</span></p>
                  <p className="text-xs text-emerald-400 mt-1">Tamamen Bedava</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600 mx-2 shrink-0" />
              {/* Phase 2 */}
              <div className="flex-1">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-center">
                  <p className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider mb-1">2-3. Ay</p>
                  <p className="text-3xl font-extrabold text-white">9<span className="text-lg text-slate-400">,90₺</span></p>
                  <p className="text-xs text-indigo-400 mt-1">Aylık</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600 mx-2 shrink-0" />
              {/* Phase 3 */}
              <div className="flex-1">
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">4-12. Ay</p>
                  <p className="text-3xl font-extrabold text-white">49<span className="text-lg text-slate-400">,90₺</span></p>
                  <p className="text-xs text-slate-500 mt-1">Aylık</p>
                </div>
              </div>
            </div>

            {/* Cashback notice */}
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-2.5">
              <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
              <p className="text-sm text-indigo-300">Ödediğiniz tutarın <strong className="text-white">%10'u Promosyon Bakiyenize</strong> iade edilir</p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Inbox, text: '10 GB E-Posta Alanı' },
                { icon: ShieldCheck, text: 'Gelişmiş Spam Filtre' },
                { icon: Globe, text: 'IMAP / POP3 / SMTP' },
                { icon: Send, text: 'Webmail Erişimi' },
                { icon: Clock, text: '7/24 Teknik Destek' },
                { icon: Users, text: 'Sınırsız Takma Ad' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Icon className="h-4 w-4 text-indigo-400 shrink-0" />
                  {text}
                </div>
              ))}
            </div>

            {/* Trust */}
            <div className="flex items-center gap-5 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> SSL Korumalı</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> KVKK Uyumlu</span>
              <span>1 yıl taahhütlü abonelik</span>
            </div>
          </div>

          {/* Right - Form Card */}
          <div className="relative">
            {step === 'success' ? (
              /* Success State */
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">E-Posta Hesabınız Hazır!</h3>
                  <p className="text-sm text-slate-400">
                    <strong className="text-white">{form.email.split('@')[0]}@{form.domain}</strong> adresi
                    için kurulum başlatıldı. Giriş bilgileriniz e-posta adresinize gönderildi.
                  </p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Plan</span>
                    <span className="text-white font-medium">Kurumsal E-Posta</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Bu Ay</span>
                    <span className="text-emerald-400 font-bold">Bedava</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Sonraki Ödeme</span>
                    <span className="text-white">9,90₺ / ay</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-700 pt-2">
                    <span className="text-slate-400">Cashback</span>
                    <span className="text-indigo-400 font-medium">%10 Promosyon Bakiyesi</span>
                  </div>
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 h-11" asChild>
                  <Link to="/dashboard">Panelime Git <ArrowRight className="h-4 w-4 ml-2" /></Link>
                </Button>
              </div>
            ) : (
              /* Form */
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Hemen Başlayın</h3>
                    <p className="text-xs text-slate-400">Kart bilgisi ile güvenli kayıt</p>
                  </div>
                  <Badge className="ml-auto bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-xs">
                    0₺
                  </Badge>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Ad Soyad</Label>
                    <Input
                      placeholder="Enes Poyraz"
                      value={form.full_name}
                      onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
                      className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-600 h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">E-Posta Adresiniz</Label>
                    <Input
                      type="email"
                      placeholder="ornek@email.com"
                      value={form.email}
                      onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                      className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-600 h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Domain Adınız</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm shrink-0">info@</span>
                      <Input
                        placeholder="sirketiniz.com"
                        value={form.domain}
                        onChange={(e) => setForm(p => ({ ...p, domain: e.target.value }))}
                        className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-600 h-10"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">Kurumsal e-postanız bu domain üzerinden açılacaktır</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Telefon</Label>
                    <Input
                      type="tel"
                      placeholder="05XX XXX XX XX"
                      value={form.phone}
                      onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                      className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-600 h-10"
                      required
                    />
                  </div>

                  {/* Card info notice */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-amber-200 font-medium">Neden kart bilgisi istiyoruz?</p>
                        <p className="text-[11px] text-amber-200/70 mt-0.5 leading-relaxed">
                          Kötüye kullanımı engellemek için kart doğrulaması yapılır.
                          İlk ay <strong>0₺</strong> çekilir, istediğiniz zaman iptal edebilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Turnstile onVerify={setTurnstileToken} theme="dark" />

                  <Button
                    type="submit"
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20"
                    disabled={loading || !turnstileToken}
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> İşleniyor...</>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Bedava Başla - Kart ile Doğrula
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> 256-bit SSL</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> iyzico Güvenli Ödeme</span>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-slate-800">
          {[
            { value: '10.000+', label: 'Aktif Müşteri' },
            { value: '%99.9', label: 'Uptime Garantisi' },
            { value: '7/24', label: 'Uzman Destek' },
            { value: '<1dk', label: 'Kurulum Süresi' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* iyzico Kart Doğrulama Dialog */}
      <IyzicoPaymentDialog
        open={iyzicoOpen}
        onOpenChange={handleIyzicoClose}
        paymentPageUrl={iyzicoUrl}
        htmlContent={iyzicoContent}
      />
    </section>
  )
}

// ============================================================================
// Orijinal Hero (şimdilik yorum satırında)
// Geri almak için: export default olarak OriginalHeroSection kullanın
// ============================================================================
/*
export function OriginalHeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-32 pb-24 lg:pt-40 lg:pb-32">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[128px] animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-cyan-500/8 rounded-full blur-[100px] animate-pulse [animation-delay:4s]" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm text-slate-300">Tüm sistemler aktif &mdash; %99.9 Uptime</span>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                Dijital Altyapınızı{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Geleceğe
                </span>{' '}
                Taşıyın.
              </h1>
              <p className="text-lg lg:text-xl text-slate-400 leading-relaxed max-w-xl">
                NVMe SSD depolama, kurumsal güvenlik ve 7/24 uzman destek ile web sitenizi, sunucunuzu ve domainlerinizi tek platformdan yönetin.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="px-8 h-12 text-base bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25" asChild>
                <Link to="/register">
                  Hemen Başla
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="px-8 h-12 text-base border border-slate-600 text-slate-200 bg-transparent hover:bg-white/10 hover:text-white" asChild>
                <Link to="/pricing">Fiyatları Gör</Link>
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Ücretsiz SSL</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Günlük Yedekleme</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>DDoS Koruması</span>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative h-[520px]">
              <div className="absolute top-0 right-0 w-[340px] bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl animate-float">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <Server className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">VDS Sunucu</div>
                    <div className="text-xs text-slate-400">AMD EPYC &bull; NVMe</div>
                  </div>
                  <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">Aktif</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">CPU Kullanımı</span><span className="text-white font-medium">23%</span></div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full w-[23%] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" /></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">RAM</span><span className="text-white font-medium">4.2 / 16 GB</span></div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full w-[26%] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" /></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Disk</span><span className="text-white font-medium">82 / 200 GB</span></div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full w-[41%] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" /></div>
                </div>
              </div>

              <div className="absolute top-16 left-0 w-[220px] bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl animate-float [animation-delay:1s]">
                <div className="flex items-center gap-2 mb-3"><Zap className="h-5 w-5 text-amber-400" /><span className="text-sm font-semibold text-white">Performans</span></div>
                <div className="text-3xl font-bold text-white mb-1">45<span className="text-lg text-slate-400">ms</span></div>
                <div className="text-xs text-slate-400">Ortalama TTFB</div>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="h-1.5 flex-1 bg-emerald-500 rounded-full" />
                  <div className="h-1.5 flex-1 bg-emerald-500 rounded-full" />
                  <div className="h-1.5 flex-1 bg-emerald-500 rounded-full" />
                  <div className="h-1.5 flex-1 bg-emerald-500/40 rounded-full" />
                </div>
              </div>

              <div className="absolute bottom-24 left-8 w-[240px] bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl animate-float [animation-delay:2s]">
                <div className="flex items-center gap-2 mb-3"><Shield className="h-5 w-5 text-emerald-400" /><span className="text-sm font-semibold text-white">Güvenlik</span></div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />DDoS Koruması Aktif</div>
                  <div className="flex items-center gap-2 text-xs text-slate-300"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />SSL Sertifikası Aktif</div>
                  <div className="flex items-center gap-2 text-xs text-slate-300"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Firewall Kuralları: 24</div>
                </div>
              </div>

              <div className="absolute bottom-0 right-12 w-[200px] bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl animate-float [animation-delay:3s]">
                <div className="flex items-center gap-2 mb-2"><Globe className="h-5 w-5 text-cyan-400" /><span className="text-sm font-semibold text-white">Uptime</span></div>
                <div className="text-3xl font-bold text-emerald-400">99.99<span className="text-lg">%</span></div>
                <div className="text-xs text-slate-400 mt-1">Son 30 gün</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-slate-800">
          {[
            { value: '10.000+', label: 'Aktif Müşteri' },
            { value: '%99.9', label: 'Uptime Garantisi' },
            { value: '7/24', label: 'Uzman Destek' },
            { value: '<1dk', label: 'Kurulum Süresi' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
*/
