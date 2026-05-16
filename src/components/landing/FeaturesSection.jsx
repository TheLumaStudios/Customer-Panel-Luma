import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react'
import TiltCard from '@/components/landing/TiltCard'
import ScrollReveal from '@/components/landing/ScrollReveal'

// ── Mini demo: speed comparison bars ────────────────────────
function SpeedDemo() {
  const [go, setGo] = useState(false)

  useEffect(() => {
    // restart every 5s
    const run = () => {
      setGo(false)
      const t = setTimeout(() => setGo(true), 300)
      return t
    }
    let timer = run()
    const loop = setInterval(() => {
      clearTimeout(timer)
      timer = run()
    }, 5000)
    return () => { clearTimeout(timer); clearInterval(loop) }
  }, [])

  return (
    <div className="mt-5 mb-6 space-y-2.5 select-none">
      {/* Competitor */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-white/30">Rakip (SATA)</span>
          <span className="text-white/30">180ms</span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full bg-red-400/40 rounded-full transition-all duration-[2200ms] ease-out"
            style={{ width: go ? '88%' : '0%' }}
          />
        </div>
      </div>
      {/* Luma */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-amber-400">Luma (NVMe Gen4)</span>
          <span className="text-amber-400">45ms</span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-[480ms] ease-out"
            style={{
              width: go ? '25%' : '0%',
              background: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
              boxShadow: go ? '0 0 6px rgba(245,158,11,0.6)' : undefined,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Mini demo: live threat counter ───────────────────────────
function ThreatDemo() {
  const [count, setCount] = useState(1247)

  useEffect(() => {
    const iv = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 6 + 1))
    }, 700)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="mt-5 mb-6 flex items-center justify-between bg-red-500/[0.05] border border-red-500/10 rounded-lg px-4 py-3 select-none">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-[11px] text-white/35">Engellenen saldırı</span>
      </div>
      <span className="text-sm font-bold text-[#00f2ff] tabular-nums">
        {count.toLocaleString('tr')}
      </span>
    </div>
  )
}

// ── Mini demo: pulsing CDN nodes ─────────────────────────────
function NetworkDemo() {
  return (
    <div className="mt-5 mb-6 flex items-center justify-around select-none">
      {[
        { city: 'İstanbul', delay: '0s', color: '#00f2ff' },
        { city: 'Frankfurt', delay: '0.5s', color: '#a78bfa' },
        { city: 'Singapore', delay: '1s', color: '#34d399' },
      ].map(({ city, delay, color }) => (
        <div key={city} className="flex flex-col items-center gap-2">
          <div className="relative flex items-center justify-center">
            {/* Ripple rings */}
            <div
              className="absolute h-6 w-6 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: color, animationDelay: delay, animationDuration: '2s' }}
            />
            <div
              className="absolute h-4 w-4 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: color, animationDelay: delay, animationDuration: '2s' }}
            />
            {/* Core dot */}
            <div
              className="relative h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}aa` }}
            />
          </div>
          <span className="text-[9px] text-white/25">{city}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

const pillars = [
  {
    icon: Zap,
    label: 'PERFORMANS ÇEKİRDEĞİ',
    title: 'Hız & Performans',
    description: 'NVMe Gen4 SSD diskler ve LiteSpeed web sunucusu ile rakiplerinizi geride bırakın.',
    demo: SpeedDemo,
    href: '/vds',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-400/10 border-amber-400/20',
    accentHex: '#f59e0b',
    hoverBorder: 'hover:border-amber-400/25',
    linkColor: 'text-amber-400 hover:text-amber-300',
  },
  {
    icon: Shield,
    label: 'GÜVENLİK PROTOKOLÜ',
    title: 'Kurumsal Güvenlik',
    description: 'Çok katmanlı DDoS koruması, otomatik SSL ve gelişmiş firewall kuralları.',
    demo: ThreatDemo,
    href: '/vps',
    iconColor: 'text-[#00f2ff]',
    iconBg: 'bg-[#00f2ff]/10 border-[#00f2ff]/20',
    accentHex: '#00f2ff',
    hoverBorder: 'hover:border-[#00f2ff]/25',
    linkColor: 'text-[#00f2ff] hover:text-cyan-300',
    featured: true,
  },
  {
    icon: Globe,
    label: 'GLOBAL ALTYAPI',
    title: 'Global Ağ',
    description: 'Cloudflare CDN entegrasyonu ve Türkiye lokasyon altyapısı ile dünya genelinde hız.',
    demo: NetworkDemo,
    href: '/linux-hosting',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-400/10 border-violet-400/20',
    accentHex: '#a78bfa',
    hoverBorder: 'hover:border-violet-400/25',
    linkColor: 'text-violet-400 hover:text-violet-300',
  },
]

export default function FeaturesSection() {
  return (
    <section className="relative py-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-white/[0.06]" />

      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-[0.3em] text-white/25 uppercase mb-3">
              Altyapı Temelleri
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Üç Sütun,{' '}
              <span className="bg-gradient-to-r from-[#00f2ff] to-cyan-300 bg-clip-text text-transparent">
                Sonsuz Güç
              </span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-3 gap-5">
          {pillars.map((p, i) => {
            const Demo = p.demo
            return (
              <ScrollReveal key={p.label} delay={i * 100}>
                <TiltCard>
                  <div
                    style={p.featured ? {
                      boxShadow: '0 0 40px rgba(0,242,255,0.04), inset 0 1px 0 rgba(0,242,255,0.08)',
                    } : undefined}
                    className={`group relative bg-white/[0.03] backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300
                      ${p.featured ? 'border-[#00f2ff]/15' : 'border-white/[0.06]'}
                      ${p.hoverBorder} hover:bg-white/[0.05]`}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-px rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(90deg,transparent,${p.accentHex}50,transparent)` }}
                    />

                    <div className={`h-12 w-12 rounded-xl ${p.iconBg} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <p.icon className={`h-6 w-6 ${p.iconColor}`} />
                    </div>

                    <p className="text-[10px] font-semibold tracking-[0.25em] text-white/25 uppercase mb-3">
                      {p.label}
                    </p>
                    <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
                    <p className="text-sm text-white/45 leading-relaxed">{p.description}</p>

                    <Demo />

                    <Link
                      to={p.href}
                      className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${p.linkColor}`}
                    >
                      Keşfet
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </TiltCard>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
