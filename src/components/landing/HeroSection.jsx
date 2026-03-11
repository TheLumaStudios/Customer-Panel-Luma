import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8">
            {/* New Badge */}
            <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
              YENİ: %99.9 Uptime SLA Garantisi
            </Badge>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Web Siteniz Daha İyi{' '}
                <span className="text-primary">Hosting</span> Hak Ediyor.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Yıldırım hızında performans, %99.9 garantili uptime ve dünya standartlarında 7/24 destek ile dijital varlığınızı ölçeklendirin. Geleceğe hazır altyapımızla tanışın.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="px-8" asChild>
                <Link to="/register">Hemen Başla</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/features">Özellikleri Keşfet</Link>
              </Button>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold">50k+</div>
                <div className="text-sm text-muted-foreground">Aktif Sunucu</div>
              </div>
              <div>
                <div className="text-2xl font-bold">%99.9</div>
                <div className="text-sm text-muted-foreground">Uptime SLA</div>
              </div>
              <div>
                <div className="text-2xl font-bold">7/24</div>
                <div className="text-sm text-muted-foreground">Uzman Destek</div>
              </div>
            </div>
          </div>

          {/* Right Side - Image with Floating Badge */}
          <div className="relative">
            {/* Server Room Image */}
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80"
                alt="Server Room"
                className="w-full h-[500px] object-cover"
              />
              {/* Overlay gradient for better badge visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Floating Badge */}
            <div className="absolute bottom-8 left-8 bg-white rounded-lg shadow-xl p-4 flex items-center gap-3 border border-border">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">Turbo Hız Aktif</div>
                <div className="text-xs text-muted-foreground">Yavaş yükleme dönemi bitti</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
