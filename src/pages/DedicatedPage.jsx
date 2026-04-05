import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, Cpu, HardDrive, MemoryStick } from 'lucide-react'
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
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="bg-white/20 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-full">
              Fiziksel Sunucu Kiralama
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Kiralık Dedicated Sunucular
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
            Sana uygun olan Dedicated sunucunu seç ve kirala.
          </p>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-16">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Dedicated Sunucu Paketleri</h2>
            <p className="text-muted-foreground">Kurumsal ihtiyaçlarınız için en uygun paketi seçin</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => {
              const features = Array.isArray(pkg.features) ? pkg.features : []
              const hasDiscount = pkg.price_original && pkg.price_original > pkg.price_monthly
              const maxRamFeature = features.find(f => typeof f === 'string' && f.toUpperCase().includes('MAX'))

              return (
                <Card
                  key={pkg.id}
                  className={`p-8 relative overflow-hidden ${pkg.is_featured ? 'border-primary shadow-xl ring-2 ring-primary/20' : 'hover:shadow-lg transition-shadow'}`}
                >
                  {pkg.is_featured && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-bl-lg">
                        En Popüler
                      </div>
                    </div>
                  )}

                  {/* CPU Model - Prominent Display */}
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2 mb-4">
                      <Cpu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-sm font-mono font-semibold">{pkg.cpu_model}</span>
                    </div>
                    <h3 className="text-2xl font-bold">{pkg.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {hasDiscount && (
                      <span className="line-through text-muted-foreground text-sm mr-2">
                        {formatPrice(pkg.price_original)}₺
                      </span>
                    )}
                    <div>
                      <span className="text-4xl font-bold text-primary">
                        {formatPrice(pkg.price_monthly)}₺
                      </span>
                      <span className="text-muted-foreground">/ay {!pkg.tax_included && '+KDV'}</span>
                    </div>
                    {pkg.price_annual && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Yıllık: {formatPrice(pkg.price_annual)}₺ {!pkg.tax_included && '+KDV'}
                      </div>
                    )}
                    <div className="mt-2">
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 px-2 py-1 rounded-full">
                        ({getDiscountLabel(index)})
                      </span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="space-y-3 mb-6 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5" /> İşlemci
                      </span>
                      <span className="font-medium">{pkg.cpu_cores} Çekirdek</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <MemoryStick className="h-3.5 w-3.5" /> RAM
                      </span>
                      <span className="font-medium">
                        {pkg.ram_gb} GB {pkg.ram_type}
                        {maxRamFeature && <span className="text-xs text-muted-foreground ml-1">({maxRamFeature})</span>}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5" /> Disk
                      </span>
                      <span className="font-medium">{formatDisk(pkg.disk_gb)} {pkg.disk_type}</span>
                    </div>
                    {pkg.bandwidth && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Trafik</span>
                        <span className="font-medium">{pkg.bandwidth}</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <ul className="space-y-2 mb-8">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    asChild
                    className="w-full"
                    variant={pkg.is_featured ? 'default' : 'outline'}
                    size="lg"
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
