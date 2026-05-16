import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Check, Crosshair } from 'lucide-react'
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
    <div className="min-h-screen bg-[#050505]">
      <SEO
        title="CS:GO / CS2 Sunucu Kiralama"
        description="128 Tick CS:GO ve CS2 sunucu kiralama. Türkiye lokasyon, düşük ping, DDoS koruması, anlık kurulum. Profesyonel oyun sunucusu."
        path="/csgo"
      />
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/8 rounded-full blur-[128px]" />

        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm mb-6">
            <Crosshair className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-white/70">Oyun Sunucusu</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            CS:GO Sunucu
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-amber-400 mb-6">
            128 Tick Performans
          </h2>
          <p className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto">
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
              <div
                key={pkg.name}
                className={`p-8 rounded-2xl bg-white/[0.04] border ${pkg.featured ? 'border-[#00f2ff]/50 shadow-xl ring-2 ring-[#00f2ff]/10' : 'border-white/[0.08] hover:border-white/[0.15] transition-colors'}`}
              >
                {pkg.featured && (
                  <div className="mb-4">
                    <span className="bg-[#00f2ff] text-black text-xs font-semibold px-3 py-1 rounded-full">
                      En Popüler
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#00f2ff]">{pkg.price}</span>
                  <span className="text-white/50">{pkg.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-amber-400 flex-shrink-0" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`w-full ${pkg.featured ? 'bg-[#00f2ff] text-black hover:bg-[#00f2ff]/90' : ''}`}
                  variant={pkg.featured ? 'default' : 'outline'}
                >
                  <Link to="/register">Sipariş Ver</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
