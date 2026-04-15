import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Zap, Shield, Globe, Server, CheckCircle2 } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-32 pb-24 lg:pt-40 lg:pb-32">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[128px] animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-cyan-500/8 rounded-full blur-[100px] animate-pulse [animation-delay:4s]" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm text-slate-300">Tüm sistemler aktif &mdash; %99.9 Uptime</span>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                Dijital Altyapınızı{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Geleceğe
                </span>{' '}
                Taşıyın.
              </h1>
              <p className="text-lg lg:text-xl text-slate-400 leading-relaxed max-w-xl">
                NVMe SSD depolama, kurumsal güvenlik ve 7/24 uzman destek ile web sitenizi, sunucunuzu ve domainlerinizi tek platformdan yönetin.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="px-8 h-12 text-base bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25" asChild>
                <Link to="/register">
                  Hemen Başla
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="px-8 h-12 text-base border border-slate-600 text-slate-200 bg-transparent hover:bg-white/10 hover:text-white" asChild>
                <Link to="/pricing">Fiyatları Gör</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Ücretsiz SSL</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Günlük Yedekleme</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>DDoS Koruması</span>
              </div>
            </div>
          </div>

          {/* Right - Floating Cards */}
          <div className="relative hidden lg:block">
            <div className="relative h-[520px]">
              {/* Main card */}
              <div className="absolute top-0 right-0 w-[340px] bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl animate-float">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <Server className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">VDS Sunucu</div>
                    <div className="text-xs text-slate-400">AMD EPYC &bull; NVMe</div>
                  </div>
                  <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">Aktif</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">CPU Kullanımı</span>
                    <span className="text-white font-medium">23%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[23%] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">RAM</span>
                    <span className="text-white font-medium">4.2 / 16 GB</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[26%] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Disk</span>
                    <span className="text-white font-medium">82 / 200 GB</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[41%] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Speed card */}
              <div className="absolute top-16 left-0 w-[220px] bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl animate-float [animation-delay:1s]">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-semibold text-white">Performans</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">45<span className="text-lg text-slate-400">ms</span></div>
                <div className="text-xs text-slate-400">Ortalama TTFB</div>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="h-1.5 flex-1 bg-emerald-500 rounded-full" />
                  <div className="h-1.5 flex-1 bg-emerald-500 rounded-full" />
                  <div className="h-1.5 flex-1 bg-emerald-500 rounded-full" />
                  <div className="h-1.5 flex-1 bg-emerald-500/40 rounded-full" />
                </div>
              </div>

              {/* Security card */}
              <div className="absolute bottom-24 left-8 w-[240px] bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl animate-float [animation-delay:2s]">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Güvenlik</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    DDoS Koruması Aktif
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    SSL Sertifikası Aktif
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Firewall Kuralları: 24
                  </div>
                </div>
              </div>

              {/* Uptime card */}
              <div className="absolute bottom-0 right-12 w-[200px] bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl animate-float [animation-delay:3s]">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">Uptime</span>
                </div>
                <div className="text-3xl font-bold text-emerald-400">99.99<span className="text-lg">%</span></div>
                <div className="text-xs text-slate-400 mt-1">Son 30 gün</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-slate-800">
          {[
            { value: '10.000+', label: 'Aktif Müşteri' },
            { value: '%99.9', label: 'Uptime Garantisi' },
            { value: '7/24', label: 'Uzman Destek' },
            { value: '<1dk', label: 'Kurulum Süresi' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
