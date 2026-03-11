import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Shield, Headphones, Zap, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PricingCards() {
  const [billingPeriod, setBillingPeriod] = useState('monthly')

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for personal websites and blogs.',
      monthlyPrice: 7,
      yearlyPrice: 5.83,
      features: [
        '1 Website',
        'Unmetered Storage',
        'Unmetered Bandwidth',
        'Free SSL Certificate',
        '1 Free WordPress Install',
        'Standard Performance',
      ],
      featured: false,
    },
    {
      name: 'Professional',
      description: 'Advanced resources for growing business sites.',
      monthlyPrice: 23,
      yearlyPrice: 19.17,
      badge: 'Most Popular',
      features: [
        '10 Websites',
        '40GB NVMe Storage',
        'Unmetered Bandwidth',
        'Free Backups (Offsite)',
        'Advanced Security Suite',
        'Turbo Boost Performance',
        'Staging Environment',
      ],
      featured: true,
    },
    {
      name: 'Enterprise',
      description: 'Full power for high-traffic operations.',
      monthlyPrice: 79,
      yearlyPrice: 65.83,
      features: [
        'Unlimited Websites',
        '100GB NVMe Storage',
        'Free Dedicated IP',
        'Real-time Malware Pro',
        'Free Rapid SSL',
        'Unlimited Email Accounts',
        'Custom PHP Configuration',
      ],
      featured: false,
    },
  ]

  const trustBadges = [
    {
      icon: Zap,
      title: '99.9% UPTIME GUARANTEE',
    },
    {
      icon: Shield,
      title: 'DDOS PROTECTION INCLUDED',
    },
    {
      icon: Headphones,
      title: '24/7 EXPERT SUPPORT',
    },
    {
      icon: Globe,
      title: 'GLOBAL EDGE NETWORK',
    },
  ]

  return (
    <section className="py-12 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Billing Toggle */}
        <div className="flex flex-col items-center mb-12">
          <div className="inline-flex items-center gap-3 bg-muted p-1 rounded-lg mb-4">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'px-6 py-2 rounded-md text-sm font-medium transition-all',
                billingPeriod === 'monthly'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={cn(
                'px-6 py-2 rounded-md text-sm font-medium transition-all',
                billingPeriod === 'yearly'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Yearly
            </button>
          </div>
          {billingPeriod === 'yearly' && (
            <p className="text-sm text-primary font-semibold">Save 30% on annual</p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                'relative bg-card border rounded-2xl p-8 transition-all',
                plan.featured
                  ? 'border-primary shadow-2xl scale-105'
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
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <div className="mb-1">
                  <span className="text-5xl font-bold">
                    ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground ml-2">/mo</span>
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
                <Link to="/register">Choose Plan</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="grid md:grid-cols-4 gap-6">
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <div key={index} className="flex items-center gap-3 justify-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-semibold">{badge.title}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
