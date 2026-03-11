import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LinuxHostingPage() {
  const packages = [
    {
      name: 'Başlangıç',
      price: '₺49',
      period: '/ay',
      features: [
        '5 GB NVMe SSD',
        '1 Web Sitesi',
        '10 GB Trafik',
        '1 E-posta Hesabı',
        'Ücretsiz SSL',
        'LiteSpeed Web Server',
      ],
    },
    {
      name: 'Profesyonel',
      price: '₺99',
      period: '/ay',
      featured: true,
      features: [
        '20 GB NVMe SSD',
        '5 Web Sitesi',
        '50 GB Trafik',
        '10 E-posta Hesabı',
        'Ücretsiz SSL',
        'LiteSpeed Web Server',
        'Günlük Yedekleme',
      ],
    },
    {
      name: 'İşletme',
      price: '₺199',
      period: '/ay',
      features: [
        '50 GB NVMe SSD',
        'Sınırsız Web Sitesi',
        'Sınırsız Trafik',
        'Sınırsız E-posta',
        'Ücretsiz SSL',
        'LiteSpeed Web Server',
        'Günlük Yedekleme',
        '7/24 Öncelikli Destek',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-green-50 to-background">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full">
              KAMPANYA: İlk yıl %20 indirim
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Linux Hosting
            <br />
            <span className="text-primary">Hızlı ve Güvenilir</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            NVMe SSD diskler ve LiteSpeed web server ile web siteniz için
            en hızlı hosting deneyimi.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <Card
                key={pkg.name}
                className={`p-8 ${pkg.featured ? 'border-primary shadow-lg' : ''}`}
              >
                {pkg.featured && (
                  <div className="mb-4">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      En Popüler
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{pkg.price}</span>
                  <span className="text-muted-foreground">{pkg.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="w-full"
                  variant={pkg.featured ? 'default' : 'outline'}
                >
                  <Link to="/register">Sipariş Ver</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
