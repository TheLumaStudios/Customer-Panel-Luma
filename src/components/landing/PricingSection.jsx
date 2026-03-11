import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PricingSection() {
  const plans = [
    {
      name: 'Başlangıç',
      description: 'Küçük blog ve portföyler için',
      price: 49.99,
      period: 'ay',
      features: [
        '1 Website',
        '10 GB NVMe Depolama',
        '100 GB Bandwidth',
        'Ücretsiz SSL Sertifikası',
        'Haftalık Yedekleme',
      ],
      featured: false,
    },
    {
      name: 'İşletme',
      description: 'Büyüyen siteler ve startuplar için',
      price: 149.99,
      period: 'ay',
      features: [
        'Sınırsız Website',
        '50 GB NVMe Depolama',
        'Sınırsız Bandwidth',
        'Günlük Yedekleme',
        'Staging Environment',
        'Öncelikli Destek',
      ],
      featured: true,
      badge: 'En Popüler',
    },
    {
      name: 'Pro Cloud',
      description: 'Yüksek trafik ve e-commerce siteleri için',
      price: 399.99,
      period: 'ay',
      features: [
        'Sınırsız Website',
        '100 GB NVMe Depolama',
        'Sınırsız Bandwidth',
        'Ücretsiz SSL',
        'Dedicated Cache Treshold',
        'Dedicated Account Manager',
      ],
      featured: false,
    },
  ]

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-4xl font-bold mb-4">Sizinle Büyüyen Bir Plan Seçin</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            İster blog başlatıyor ister kurumsal bir işletme yönetiyor olun, altyapınız için mükemmel plana sahibiz.
          </p>
          <div className="flex justify-end mb-8">
            <Link to="#hosting" className="text-primary hover:underline text-sm font-medium">
              Tüm hosting seçeneklerini görüntüle →
            </Link>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                'relative bg-card border rounded-2xl p-8 transition-all',
                plan.featured
                  ? 'border-primary shadow-2xl scale-105 md:scale-110'
                  : 'border-border hover:border-primary hover:shadow-lg'
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-1">
                  <span className="text-4xl font-bold">₺{plan.price}</span>
                  <span className="text-muted-foreground ml-1">/{plan.period}</span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className="w-full"
                variant={plan.featured ? 'default' : 'outline'}
                size="lg"
                asChild
              >
                <Link to="/register">
                  {plan.featured ? 'Hemen Başla' : `${plan.name} Seç`}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
