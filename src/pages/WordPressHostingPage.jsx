import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, Shield, Zap, RefreshCw, Bug } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProductCache } from '@/contexts/ProductCacheContext'

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

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-800 text-white">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="bg-white/20 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-full">
              WordPress İçin Optimize Edildi
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            WordPress Hosting Paketleri
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
            WordPress siteniz için özel olarak optimize edilmiş hosting altyapısı.
            Otomatik kurulum, önbellek ve güvenlik ile hızlı başlayın.
          </p>
        </div>
      </section>

      {/* WordPress-specific features badge row */}
      <section className="py-12 border-b">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wpFeatures.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
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
            <h2 className="text-3xl font-bold mb-4">WordPress Hosting Paketleri</h2>
            <p className="text-muted-foreground">Tüm paketler WordPress için özel optimizasyonlar içerir</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const features = Array.isArray(pkg.features) ? pkg.features : []
              const hasDiscount = pkg.price_original && pkg.price_original > pkg.price_monthly

              return (
                <Card
                  key={pkg.id}
                  className={`p-6 flex flex-col relative ${pkg.is_featured ? 'border-primary shadow-xl ring-2 ring-primary/20' : 'hover:shadow-lg transition-shadow'}`}
                >
                  {/* WordPress badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      WP Ready
                    </span>
                  </div>

                  {pkg.is_featured && (
                    <div className="mb-3">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        En Popüler
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>

                  {/* Disk & Domain Count */}
                  <div className="flex flex-col gap-1 mb-4 text-sm text-muted-foreground">
                    <span>{formatDisk(pkg.disk_gb)} SSD Disk</span>
                    {pkg.domains_allowed && (
                      <span>{pkg.domains_allowed} Adet Alan Adı</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {hasDiscount && (
                      <span className="line-through text-muted-foreground text-sm mr-2">
                        {formatPrice(pkg.price_original)}₺
                      </span>
                    )}
                    <div>
                      <span className="text-3xl font-bold text-primary">
                        {formatPrice(pkg.price_monthly)}₺
                      </span>
                      <span className="text-muted-foreground text-sm">/ay</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Aylık Ödeme</span>
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <ul className="space-y-2 mb-6 flex-1">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* WordPress-specific extras */}
                  <div className="border-t pt-3 mb-4">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">WordPress Ekstra:</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">WordPress Staging</span>
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">Malware Tarama</span>
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">WP-CLI Desteği</span>
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">Otomatik Güncellemeler</span>
                    </div>
                  </div>

                  <Button
                    asChild
                    className="w-full mt-auto"
                    variant={pkg.is_featured ? 'default' : 'outline'}
                  >
                    <Link to="/register">Sipariş Ver</Link>
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
