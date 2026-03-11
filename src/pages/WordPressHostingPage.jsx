import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function WordPressHostingPage() {
  const packages = [
    {
      name: 'WP Başlangıç',
      price: '₺79',
      period: '/ay',
      features: [
        '10 GB NVMe SSD',
        '1 WordPress Sitesi',
        '25.000 Aylık Ziyaretçi',
        'Otomatik WordPress Kurulum',
        'Ücretsiz SSL',
        'WordPress Önbellek',
        'LiteSpeed Web Server',
      ],
    },
    {
      name: 'WP Profesyonel',
      price: '₺149',
      period: '/ay',
      featured: true,
      features: [
        '30 GB NVMe SSD',
        '5 WordPress Sitesi',
        '100.000 Aylık Ziyaretçi',
        'Otomatik WordPress Kurulum',
        'Ücretsiz SSL',
        'WordPress Önbellek',
        'LiteSpeed Web Server',
        'Günlük Yedekleme',
        'Malware Tarama',
      ],
    },
    {
      name: 'WP İşletme',
      price: '₺299',
      period: '/ay',
      features: [
        '75 GB NVMe SSD',
        'Sınırsız WordPress Sitesi',
        '500.000 Aylık Ziyaretçi',
        'Otomatik WordPress Kurulum',
        'Ücretsiz SSL',
        'WordPress Önbellek',
        'LiteSpeed Web Server',
        'Günlük Yedekleme',
        'Malware Tarama',
        'Öncelikli Destek',
        'Staging Ortamı',
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
            WordPress Hosting
            <br />
            <span className="text-primary">WordPress İçin Optimize</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            WordPress siteniz için özel olarak optimize edilmiş hosting altyapısı.
            Otomatik kurulum, önbellek ve güvenlik ile hızlı başlayın.
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
