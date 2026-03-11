import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function DomainPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const popularExtensions = [
    { ext: '.com', price: '₺99', period: '/yıl' },
    { ext: '.net', price: '₺89', period: '/yıl' },
    { ext: '.org', price: '₺79', period: '/yıl' },
    { ext: '.com.tr', price: '₺49', period: '/yıl' },
    { ext: '.info', price: '₺69', period: '/yıl' },
    { ext: '.xyz', price: '₺39', period: '/yıl' },
  ]

  const features = [
    'Ücretsiz WHOIS Gizliliği',
    'Kolay DNS Yönetimi',
    '7/24 Destek',
    'Otomatik Yenileme',
    'Domain Transfer',
    'Email Yönlendirme',
  ]

  const handleSearch = (e) => {
    e.preventDefault()
    // Search logic will be implemented
    console.log('Searching for:', searchQuery)
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section with Search */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Alan Adı
              <br />
              <span className="text-primary">Hayalinizdeki Domain'i Bulun</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Binlerce domain uzantısı ile markanızı online dünyaya taşıyın.
              Ücretsiz WHOIS gizliliği ve kolay yönetim paneli.
            </p>
          </div>

          {/* Domain Search */}
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Domain adınızı arayın..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button type="submit" size="lg">
                Ara
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Extensions */}
      <section className="py-16 bg-muted">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Popüler Domain Uzantıları</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            {popularExtensions.map((item) => (
              <Card key={item.ext} className="p-6 text-center">
                <div className="text-2xl font-bold mb-2">{item.ext}</div>
                <div className="text-3xl font-bold text-primary mb-1">{item.price}</div>
                <div className="text-sm text-muted-foreground mb-4">{item.period}</div>
                <Button asChild className="w-full" size="sm">
                  <Link to="/register">Satın Al</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Domain Özelliklerimiz</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
