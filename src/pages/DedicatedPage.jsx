import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DedicatedPage() {
  const packages = [
    {
      name: 'Dedicated E3',
      price: '₺2.999',
      period: '/ay',
      features: [
        'Intel Xeon E3-1230v6',
        '32 GB DDR4 RAM',
        '2x 500 GB SSD',
        '10 TB Trafik',
        '1 Gbps Port',
        'Ücretsiz SSL',
        '7/24 Destek',
      ],
    },
    {
      name: 'Dedicated E5',
      price: '₺4.999',
      period: '/ay',
      featured: true,
      features: [
        'Intel Xeon E5-2680v4',
        '64 GB DDR4 RAM',
        '2x 1 TB NVMe SSD',
        '20 TB Trafik',
        '1 Gbps Port',
        'Ücretsiz SSL',
        '7/24 Destek',
        'DDoS Koruması',
      ],
    },
    {
      name: 'Dedicated Dual',
      price: '₺7.999',
      period: '/ay',
      features: [
        '2x Intel Xeon E5-2680v4',
        '128 GB DDR4 RAM',
        '4x 2 TB NVMe SSD',
        'Sınırsız Trafik',
        '10 Gbps Port',
        'Ücretsiz SSL',
        '7/24 Destek',
        'DDoS Koruması',
        'Öncelikli Destek',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Dedicated Sunucu
            <br />
            <span className="text-primary">Tam Performans</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Fiziksel sunucularımız ile işletmenize özel altyapı, maksimum kontrol
            ve sınırsız performans elde edin.
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
