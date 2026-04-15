import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Check, Globe, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProductCache } from '@/contexts/ProductCacheContext'

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(price)
const formatDisk = (gb) => gb === -1 ? 'Sınırsız' : `${gb} GB`

export default function ResellerHostingPage() {
  const { packages } = useProductCache('reseller_hosting')

  return (
    <div className="min-h-screen bg-slate-950">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/8 rounded-full blur-[128px]" />

        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm mb-6">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-slate-300">Bayi Hosting</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Reseller Hosting Paketleri
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
            Ultra performans web hosting deneyimi. LiteSpeed, CloudLinux ve SSD donanımı ile
            müşterilerinize en iyi hizmeti sunun.
          </p>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-16">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Reseller Paketleri</h2>
            <p className="text-slate-400">Kendi hosting işletmenizi kurun</p>
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

                  {/* Domain Count - Prominent */}
                  {pkg.domains_allowed && (
                    <div className="flex items-center gap-2 mb-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
                      <Globe className="h-5 w-5 text-cyan-400" />
                      <span className="text-lg font-bold text-cyan-400">
                        {pkg.domains_allowed} Adet Alan Adı
                      </span>
                    </div>
                  )}

                  {/* Disk */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-400">
                    <span>{formatDisk(pkg.disk_gb)} {pkg.disk_type} Disk</span>
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
                      <span className="text-slate-400 text-sm">/ay {!pkg.tax_included && '+KDV'}</span>
                    </div>
                  </div>

                  {/* Features with LiteSpeed highlight */}
                  {features.length > 0 && (
                    <ul className="space-y-2 mb-6 flex-1">
                      {features.map((feature, i) => {
                        const isLiteSpeed = typeof feature === 'string' && feature.toLowerCase().includes('litespeed')
                        return (
                          <li key={i} className="flex items-start gap-2">
                            <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isLiteSpeed ? 'text-cyan-400' : 'text-emerald-400'}`} />
                            <span className={`text-sm ${isLiteSpeed ? 'font-semibold text-cyan-400' : 'text-slate-300'}`}>
                              {feature}
                            </span>
                          </li>
                        )
                      })}
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

      {/* LiteSpeed Highlight */}
      <section className="py-16 border-t border-slate-800">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">LiteSpeed WebServer</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-8">
            Tüm reseller paketlerimiz LiteSpeed WebServer ile birlikte gelir.
            Apache'ye göre 6 kata kadar daha hızlı sayfa yüklemeleri elde edin.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="p-4 text-center rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-2xl font-bold text-indigo-400 mb-1">6x</div>
              <p className="text-sm text-slate-400">Daha Hızlı</p>
            </div>
            <div className="p-4 text-center rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-2xl font-bold text-indigo-400 mb-1">%99.9</div>
              <p className="text-sm text-slate-400">Uptime Garantisi</p>
            </div>
            <div className="p-4 text-center rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-2xl font-bold text-indigo-400 mb-1">7/24</div>
              <p className="text-sm text-slate-400">Teknik Destek</p>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
