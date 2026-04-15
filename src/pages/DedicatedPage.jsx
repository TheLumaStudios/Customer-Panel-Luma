import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Check, Cpu, HardDrive, MemoryStick, Server } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProductCache } from '@/contexts/ProductCacheContext'

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(price)
const formatDisk = (gb) => gb === -1 ? 'Sınırsız' : `${gb} GB`

const getDiscountLabel = (index) => {
  if (index === 0) return '12 aylık alımlarda %10 indirim'
  return '12 aylık alımlarda %5 indirim'
}

export default function DedicatedPage() {
  const { packages } = useProductCache('dedicated')

  return (
    <div className="min-h-screen bg-slate-950">
      <SEO
        title="Dedicated Sunucu - Kiralık Fiziksel Sunucu"
        description="AMD Ryzen işlemcili kiralık dedicated sunucular. 32-128 GB RAM, RAID depolama, 10 Gbit bağlantı. Tam root erişim ve 7/24 destek."
        path="/dedicated"
        schema={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Dedicated Sunucu",
          "description": "Kiralık fiziksel sunucu hizmeti",
          "brand": {"@type": "Brand", "name": "Luma Yazılım"},
          "offers": {"@type": "AggregateOffer", "lowPrice": "3900.99", "highPrice": "9100.99", "priceCurrency": "TRY", "offerCount": "3"}
        }}
      />
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[128px]" />

        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm mb-6">
            <Server className="h-4 w-4 text-indigo-400" />
            <span className="text-sm text-slate-300">Fiziksel Sunucu Kiralama</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Kiralık Dedicated Sunucular
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
            Sana uygun olan Dedicated sunucunu seç ve kirala.
          </p>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-16">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Dedicated Sunucu Paketleri</h2>
            <p className="text-slate-400">Kurumsal ihtiyaçlarınız için en uygun paketi seçin</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => {
              const features = Array.isArray(pkg.features) ? pkg.features : []
              const hasDiscount = pkg.price_original && pkg.price_original > pkg.price_monthly
              const maxRamFeature = features.find(f => typeof f === 'string' && f.toUpperCase().includes('MAX'))

              return (
                <div
                  key={pkg.id}
                  className={`p-8 relative overflow-hidden rounded-2xl bg-slate-800/40 border ${pkg.is_featured ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-500/20' : 'border-slate-700/50 hover:border-slate-600 transition-colors'}`}
                >
                  {pkg.is_featured && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-bl-lg">
                        En Popüler
                      </div>
                    </div>
                  )}

                  {/* CPU Model - Prominent Display */}
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700/50 rounded-lg px-4 py-2 mb-4">
                      <Cpu className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-mono font-semibold text-white">{pkg.cpu_model}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{pkg.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {hasDiscount && (
                      <span className="line-through text-slate-500 text-sm mr-2">
                        {formatPrice(pkg.price_original)}₺
                      </span>
                    )}
                    <div>
                      <span className="text-4xl font-bold text-indigo-400">
                        {formatPrice(pkg.price_monthly)}₺
                      </span>
                      <span className="text-slate-400">/ay {!pkg.tax_included && '+KDV'}</span>
                    </div>
                    {pkg.price_annual && (
                      <div className="text-sm text-slate-400 mt-1">
                        Yıllık: {formatPrice(pkg.price_annual)}₺ {!pkg.tax_included && '+KDV'}
                      </div>
                    )}
                    <div className="mt-2">
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                        ({getDiscountLabel(index)})
                      </span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="space-y-3 mb-6 border-t border-slate-700/50 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5" /> İşlemci
                      </span>
                      <span className="font-medium text-white">{pkg.cpu_cores} Çekirdek</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <MemoryStick className="h-3.5 w-3.5" /> RAM
                      </span>
                      <span className="font-medium text-white">
                        {pkg.ram_gb} GB {pkg.ram_type}
                        {maxRamFeature && <span className="text-xs text-slate-500 ml-1">({maxRamFeature})</span>}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5" /> Disk
                      </span>
                      <span className="font-medium text-white">{formatDisk(pkg.disk_gb)} {pkg.disk_type}</span>
                    </div>
                    {pkg.bandwidth && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Trafik</span>
                        <span className="font-medium text-white">{pkg.bandwidth}</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <ul className="space-y-2 mb-8">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    asChild
                    className={`w-full ${pkg.is_featured ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : ''}`}
                    variant={pkg.is_featured ? 'default' : 'outline'}
                    size="lg"
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
