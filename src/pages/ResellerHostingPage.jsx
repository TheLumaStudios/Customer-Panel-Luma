import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProductCache } from '@/contexts/ProductCacheContext'

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(price)
const formatDisk = (gb) => gb === -1 ? 'Sınırsız' : `${gb} GB`

export default function ResellerHostingPage() {
  const { packages } = useProductCache('reseller_hosting')

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-cyan-700 via-teal-700 to-teal-800 text-white">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="bg-white/20 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-full">
              Bayi Hosting
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Reseller Hosting Paketleri
          </h1>
          <p className="text-lg md:text-xl text-cyan-100 max-w-3xl mx-auto">
            Ultra performans web hosting deneyimi. LiteSpeed, CloudLinux ve SSD donanımı ile
            müşterilerinize en iyi hizmeti sunun.
          </p>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-16">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Reseller Paketleri</h2>
            <p className="text-muted-foreground">Kendi hosting işletmenizi kurun</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const features = Array.isArray(pkg.features) ? pkg.features : []
              const hasDiscount = pkg.price_original && pkg.price_original > pkg.price_monthly

              return (
                <Card
                  key={pkg.id}
                  className={`p-6 flex flex-col ${pkg.is_featured ? 'border-primary shadow-xl ring-2 ring-primary/20' : 'hover:shadow-lg transition-shadow'}`}
                >
                  {pkg.is_featured && (
                    <div className="mb-3">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        En Popüler
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>

                  {/* Domain Count - Prominent */}
                  {pkg.domains_allowed && (
                    <div className="flex items-center gap-2 mb-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg px-3 py-2">
                      <Globe className="h-5 w-5 text-cyan-600" />
                      <span className="text-lg font-bold text-cyan-700 dark:text-cyan-400">
                        {pkg.domains_allowed} Adet Alan Adı
                      </span>
                    </div>
                  )}

                  {/* Disk */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <span>{formatDisk(pkg.disk_gb)} {pkg.disk_type} Disk</span>
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
                      <span className="text-muted-foreground text-sm">/ay {!pkg.tax_included && '+KDV'}</span>
                    </div>
                  </div>

                  {/* Features with LiteSpeed highlight */}
                  {features.length > 0 && (
                    <ul className="space-y-2 mb-6 flex-1">
                      {features.map((feature, i) => {
                        const isLiteSpeed = typeof feature === 'string' && feature.toLowerCase().includes('litespeed')
                        return (
                          <li key={i} className="flex items-start gap-2">
                            <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isLiteSpeed ? 'text-cyan-600' : 'text-green-600'}`} />
                            <span className={`text-sm ${isLiteSpeed ? 'font-semibold text-cyan-700 dark:text-cyan-400' : ''}`}>
                              {feature}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}

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

      {/* LiteSpeed Highlight */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">LiteSpeed WebServer</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Tüm reseller paketlerimiz LiteSpeed WebServer ile birlikte gelir.
            Apache'ye göre 6 kata kadar daha hızlı sayfa yüklemeleri elde edin.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">6x</div>
              <p className="text-sm text-muted-foreground">Daha Hızlı</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">%99.9</div>
              <p className="text-sm text-muted-foreground">Uptime Garantisi</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">7/24</div>
              <p className="text-sm text-muted-foreground">Teknik Destek</p>
            </Card>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
