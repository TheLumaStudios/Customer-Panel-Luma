import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Check, Shield, DollarSign, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProductCache } from '@/contexts/ProductCacheContext'

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(price)
const formatDisk = (gb) => gb === -1 ? 'Sınırsız' : `${gb} GB`

const infoCards = [
  { icon: DollarSign, title: 'Bütçe Dostu Hosting', desc: 'Uygun fiyatlarla profesyonel hosting hizmeti alın.' },
  { icon: Lock, title: 'Ücretsiz SSL', desc: 'Tüm paketlerde ücretsiz SSL sertifikası dahildir.' },
  { icon: Shield, title: 'DDoS Koruması', desc: 'Gelişmiş DDoS koruma ile siteniz her zaman erişimde.' },
]

export default function LinuxHostingPage() {
  const { packages } = useProductCache('cpanel_hosting')

  return (
    <div className="min-h-screen bg-slate-950">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/8 rounded-full blur-[128px]" />

        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm mb-6">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-slate-300">cPanel Kontrol Paneli</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            cPanel Web Hosting Paketleri
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
            Ultra performans web hosting deneyimi. CloudLinux ve SSD donanımı ile performansta sorun yaşama.
          </p>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-16">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Hosting Paketleri</h2>
            <p className="text-slate-400">İhtiyacınıza uygun paketi seçin, hemen başlayın</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const features = Array.isArray(pkg.features) ? pkg.features : []
              const hasDiscount = pkg.price_original && pkg.price_original > pkg.price_monthly

              return (
                <div
                  key={pkg.id}
                  className={`p-6 flex flex-col rounded-2xl bg-slate-800/40 border ${pkg.is_featured ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-500/20' : 'border-slate-700/50 hover:border-slate-600 transition-colors'}`}
                >
                  {pkg.is_featured && (
                    <div className="mb-3">
                      <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        En Popüler
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>

                  {/* Disk & Domain Count */}
                  <div className="flex flex-col gap-1 mb-4 text-sm text-slate-400">
                    <span>{formatDisk(pkg.disk_gb)} SSD Disk</span>
                    {pkg.domains_allowed && (
                      <span>{pkg.domains_allowed} Adet Alan Adı</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {hasDiscount && (
                      <span className="line-through text-slate-500 text-sm mr-2">
                        {formatPrice(pkg.price_original)}₺
                      </span>
                    )}
                    <div>
                      <span className="text-3xl font-bold text-indigo-400">
                        {formatPrice(pkg.price_monthly)}₺
                      </span>
                      <span className="text-slate-400 text-sm">/ay</span>
                    </div>
                    <span className="text-xs text-slate-500">Aylık Ödeme</span>
                  </div>

                  {/* Features Checklist */}
                  {features.length > 0 && (
                    <ul className="space-y-2 mb-6 flex-1">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    asChild
                    className={`w-full mt-auto ${pkg.is_featured ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : ''}`}
                    variant={pkg.is_featured ? 'default' : 'outline'}
                  >
                    <Link to="/register">Sipariş Ver</Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Info Cards Section */}
      <section className="py-16 border-t border-slate-800">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {infoCards.map((card) => (
              <div key={card.title} className="p-6 text-center rounded-2xl bg-slate-800/40 border border-slate-700/50">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 mb-4">
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-slate-400">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
