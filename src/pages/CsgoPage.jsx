import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CsgoPage() {
  const packages = [
    {
      name: 'CS:GO Başlangıç',
      price: '₺199',
      period: '/ay',
      features: [
        '4 GB RAM',
        '10 Slot',
        '128 Tick',
        'DDoS Koruması',
        'FastDL',
        '7/24 Destek',
        'Özel Oyun Modları',
      ],
    },
    {
      name: 'CS:GO Profesyonel',
      price: '₺349',
      period: '/ay',
      featured: true,
      features: [
        '8 GB RAM',
        '32 Slot',
        '128 Tick',
        'DDoS Koruması',
        'FastDL',
        '7/24 Destek',
        'Özel Oyun Modları',
        'SourceMod & MetaMod',
        'MySQL Database',
      ],
    },
    {
      name: 'CS:GO İşletme',
      price: '₺599',
      period: '/ay',
      features: [
        '16 GB RAM',
        '64 Slot',
        '128 Tick',
        'DDoS Koruması',
        'FastDL',
        '7/24 Destek',
        'Özel Oyun Modları',
        'SourceMod & MetaMod',
        'MySQL Database',
        'Öncelikli Destek',
        'Özel IP',
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
            CS:GO Sunucu
            <br />
            <span className="text-primary">128 Tick Performans</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Profesyonel CS:GO sunucuları ile düşük ping, 128 tick rate ve
            DDoS korumalı oyun deneyimi yaşayın.
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
