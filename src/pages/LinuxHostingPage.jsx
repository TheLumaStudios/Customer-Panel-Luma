import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 text-white">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="bg-white/20 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-full">
              cPanel Kontrol Paneli
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            cPanel Web Hosting Paketleri
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto">
            Ultra performans web hosting deneyimi. CloudLinux ve SSD donanımı ile performansta sorun yaşama.
          </p>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-16">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Hosting Paketleri</h2>
            <p className="text-muted-foreground">İhtiyacınıza uygun paketi seçin, hemen başlayın</p>
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

                  {/* Features Checklist */}
                  {features.length > 0 && (
                    <ul className="space-y-2 mb-6 flex-1">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
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

      {/* Info Cards Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {infoCards.map((card) => (
              <Card key={card.title} className="p-6 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 mb-4">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
