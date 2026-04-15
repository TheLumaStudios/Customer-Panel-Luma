import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Copy, CheckCircle2, Building2, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const BANK_ACCOUNTS = [
  {
    bank: 'Türkiye İş Bankası',
    logo: '🏦',
    color: 'from-blue-600 to-blue-700',
    holder: 'Enes POYRAZ',
    iban: 'TR24 0006 4000 0012 2051 4479 69',
    branch: 'Nilüfer Şubesi',
    currency: 'TRY',
  },
  {
    bank: 'VakıfBank',
    logo: '🏛️',
    color: 'from-yellow-600 to-amber-700',
    holder: 'Enes POYRAZ',
    iban: 'TR00 0001 5001 5800 7307 8642 47',
    branch: 'Nilüfer Şubesi',
    currency: 'TRY',
  },
]

export default function BankTransfer() {
  const navigate = useNavigate()
  const [copiedField, setCopiedField] = useState(null)

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''))
    setCopiedField(field)
    toast.success('Kopyalandı')
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <LandingHeader />

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-4">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-slate-300">Havale / EFT</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Banka Hesap Bilgileri</h1>
            <p className="text-slate-400">
              Aşağıdaki hesaplardan birine havale/EFT yaparak ödemenizi tamamlayabilirsiniz.
            </p>
          </div>

          <div className="space-y-5">
            {BANK_ACCOUNTS.map((account, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                {/* Bank header */}
                <div className={`bg-gradient-to-r ${account.color} px-6 py-4 flex items-center gap-3`}>
                  <span className="text-2xl">{account.logo}</span>
                  <div>
                    <h3 className="font-semibold text-white">{account.bank}</h3>
                    <p className="text-xs text-white/70">{account.branch}</p>
                  </div>
                </div>

                {/* Account details */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Hesap Sahibi</p>
                      <p className="text-sm font-medium text-white">{account.holder}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(account.holder, `holder-${i}`)}
                      className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      {copiedField === `holder-${i}` ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">IBAN</p>
                      <p className="text-sm font-mono font-medium text-white tracking-wider">{account.iban}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(account.iban, `iban-${i}`)}
                      className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      {copiedField === `iban-${i}` ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Important notes */}
          <div className="mt-8 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-indigo-300 mb-3">Önemli Bilgiler</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                Havale/EFT açıklamasına <strong className="text-slate-300">sipariş numaranızı</strong> veya <strong className="text-slate-300">e-posta adresinizi</strong> yazmayı unutmayın.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                Ödemeler mesai saatleri içinde genellikle <strong className="text-slate-300">1-2 saat</strong>, mesai dışında <strong className="text-slate-300">sonraki iş günü</strong> onaylanır.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                Ödeme onaylandıktan sonra hizmetiniz otomatik olarak aktif edilir ve e-posta ile bilgilendirilirsiniz.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                Sorularınız için <a href="mailto:info@lumayazilim.com" className="text-indigo-400 hover:text-indigo-300 underline">info@lumayazilim.com</a> veya <strong className="text-slate-300">0544 979 62 57</strong> ile iletişime geçebilirsiniz.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
