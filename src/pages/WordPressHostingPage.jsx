import { useEffect } from 'react'
import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Check, Shield, Zap, RefreshCw, Bug } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProductCache } from '@/contexts/ProductCacheContext'
import { viewContent } from '@/lib/metaPixel'

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(price)
const formatDisk = (gb) => gb === -1 ? 'Sınırsız' : `${gb} GB`

const wpFeatures = [
  { icon: Zap, title: 'WordPress Staging', desc: 'Değişiklikleri canlı siteye almadan önce test edin' },
  { icon: Bug, title: 'Malware Tarama', desc: 'Günlük otomatik malware taraması ve temizlik' },
  { icon: RefreshCw, title: 'WP-CLI Desteği', desc: 'Komut satırından WordPress yönetimi' },
  { icon: Shield, title: 'Otomatik Güncellemeler', desc: 'WordPress çekirdek ve eklenti güncellemeleri otomatik yapılır' },
]

export default function WordPressHostingPage() {
  const { packages } = useProductCache('cpanel_hosting')

  useEffect(() => {
    viewContent({ contentId: 'wordpress_hosting', contentName: 'WordPress Hosting', contentType: 'product_group', value: 26.99 })
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      <SEO
        title="WordPress Hosting - Optimize Edilmiş WP Hosting"
        description="WordPress için optimize edilmiş hosting paketleri. LiteSpeed cache, otomatik güncellemeler, ücretsiz SSL, tek tıkla kurulum. Aylık 26,99₺'den."
        path="/wordpress-hosting"
      />
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[128px]" />

        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm mb-6">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-slate-300">WordPress İçin Optimize Edildi</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            WordPress Hosting Paketleri
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
            WordPress siteniz için özel olarak optimize edilmiş hosting altyapısı.
            Otomatik kurulum, önbellek ve güvenlik ile hızlı başlayın.
          </p>
        </div>
      </section>

      {/* WordPress-specific features badge row */}
      <section className="py-12 border-b border-slate-800">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wpFeatures.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">{feature.title}</h3>
                  <p className="text-xs text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-16">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">WordPress Hosting Paketleri</h2>
            <p className="text-slate-400">Tüm paketler WordPress için özel optimizasyonlar içerir</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const features = Array.isArray(pkg.features) ? pkg.features : []
              const hasDiscount = pkg.price_original && pkg.price_original > pkg.price_monthly

              return (
                <div
                  key={pkg.id}
                  className={`p-6 flex flex-col relative rounded-2xl bg-slate-800/40 border ${pkg.is_featured ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-500/20' : 'border-slate-700/50 hover:border-slate-600 transition-colors'}`}
                >
                  {/* WordPress badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      WP Ready
                    </span>
                  </div>

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

                  {/* Features */}
                  {features.length > 0 && (
                    <ul className="space-y-2 mb-6 flex-1">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* WordPress-specific extras */}
                  <div className="border-t border-slate-700/50 pt-3 mb-4">
                    <p className="text-xs text-slate-400 mb-2 font-medium">WordPress Ekstra:</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">WordPress Staging</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Malware Tarama</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">WP-CLI Desteği</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Otomatik Güncellemeler</span>
                    </div>
                  </div>

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

      <LandingFooter />
    </div>
  )
}
