import { useState, useEffect } from 'react'
import { Search, Shield, Zap, Activity, Check, X } from 'lucide-react'
import ScrollReveal from '@/components/landing/ScrollReveal'

// ═══════════════════════════════════════════════════════════════
// DEMO 1 — SEO ranking animation (website rises from #6 → #1)
// ═══════════════════════════════════════════════════════════════
function SEODemo() {
  const ITEM_H = 52
  const GAP = 7

  const competitors = [
    { id: 1, title: 'Profesyonel Web Tasarım Hizmetleri', url: 'rakip-hosting.com' },
    { id: 2, title: 'Uygun Fiyatlı Web Hosting', url: 'ucuz-hosting.net' },
    { id: 3, title: 'Hosting ve Domain Hizmetleri', url: 'hosting-tr.com' },
    { id: 4, title: 'Güvenilir Sunucu Kiralama', url: 'sunucu-kiralama.com' },
    { id: 5, title: 'Ekonomik Paylaşımlı Hosting', url: 'cheap-host.com.tr' },
  ]

  const [userRank, setUserRank] = useState(5) // 0-indexed

  useEffect(() => {
    const timers = []
    const run = () => {
      setUserRank(5)
      let r = 5
      const step = () => {
        r--
        setUserRank(r)
        if (r > 0) timers.push(setTimeout(step, 480))
        else timers.push(setTimeout(run, 4500))
      }
      timers.push(setTimeout(step, 1400))
    }
    run()
    return () => timers.forEach(clearTimeout)
  }, [])

  const totalH = 6 * ITEM_H + 5 * GAP

  return (
    <div className="select-none">
      {/* Google-like bar */}
      <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 h-11 mb-3">
        <Search className="h-3.5 w-3.5 text-white/25 shrink-0" />
        <span className="text-sm text-white/45 flex-1">web hosting türkiye</span>
        <div className="flex gap-px">
          {[['#4285F4','G'],['#EA4335','o'],['#FBBC04','o'],['#4285F4','g'],['#34A853','l'],['#EA4335','e']].map(([c,l],i)=>(
            <span key={i} className="text-[10px] font-bold" style={{color:c+'99'}}>{l}</span>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-white/20 mb-4">Yaklaşık 4.820.000 sonuç</p>

      {/* Animated results */}
      <div className="relative" style={{ height: totalH }}>
        {competitors.map((c, i) => {
          const rank = i < userRank ? i : i + 1
          return (
            <div
              key={c.id}
              className="absolute left-0 right-0 bg-white/[0.02] border border-white/[0.04] rounded-lg px-4 transition-all duration-[480ms] ease-out"
              style={{ top: rank * (ITEM_H + GAP), height: ITEM_H }}
            >
              <div className="flex items-center h-full gap-2.5">
                <span className="text-[10px] text-white/20 w-3 shrink-0">{rank + 1}</span>
                <div className="min-w-0">
                  <div className="text-[10px] text-emerald-500/50 mb-0.5 truncate">{c.url}</div>
                  <div className="text-[11px] text-white/35 truncate">{c.title}</div>
                </div>
              </div>
            </div>
          )
        })}

        {/* User's site */}
        <div
          className="absolute left-0 right-0 rounded-lg px-4 transition-all duration-[480ms] ease-out z-10 border"
          style={{
            top: userRank * (ITEM_H + GAP),
            height: ITEM_H,
            background: 'linear-gradient(135deg,rgba(0,242,255,0.07),rgba(0,242,255,0.03))',
            borderColor: userRank === 0 ? 'rgba(0,242,255,0.5)' : 'rgba(0,242,255,0.22)',
            boxShadow: userRank === 0 ? '0 0 22px rgba(0,242,255,0.13),inset 0 1px 0 rgba(0,242,255,0.1)' : undefined,
          }}
        >
          <div className="flex items-center h-full gap-2.5">
            <span
              className="text-[10px] font-bold w-3 shrink-0 transition-colors duration-300"
              style={{ color: `rgba(0,242,255,${0.4 + (5 - userRank) * 0.12})` }}
            >
              {userRank + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] text-[#00f2ff]/60 truncate">siteniz.com</span>
                {userRank === 0 && (
                  <span className="text-[8px] font-bold bg-[#00f2ff] text-black px-1.5 py-0.5 rounded-full animate-fade-in shrink-0">
                    #1 SIRA
                  </span>
                )}
              </div>
              <div className="text-[12px] text-white font-medium truncate">
                Siteniz — Luma Hosting ile Zirveye Çıkın
              </div>
            </div>
            {userRank > 0 && (
              <div className="shrink-0 text-[#00f2ff] font-bold text-base animate-bounce leading-none">
                ↑
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-white/20 mt-5">
        NVMe + LiteSpeed → hızlı sayfa yükü → daha iyi SEO sırası
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DEMO 2 — DDoS attack live feed
// ═══════════════════════════════════════════════════════════════
function DDoSDemo() {
  const [count, setCount] = useState(1247)
  const [feed, setFeed] = useState([])

  const randIP = () =>
    `${Math.floor(Math.random()*220+10)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*99+1)}.${Math.floor(Math.random()*255)}`

  const types = ['SYN Flood', 'UDP Flood', 'HTTP Flood', 'ICMP Flood']

  useEffect(() => {
    const iv = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 18 + 6))
      setFeed(prev =>
        [{ id: Date.now(), ip: randIP(), type: types[Math.floor(Math.random()*types.length)] }, ...prev].slice(0, 5)
      )
    }, 750)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="select-none">
      {/* Counter row */}
      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="text-center">
          <div
            className="text-4xl font-bold text-[#00f2ff] tabular-nums"
            style={{ textShadow: '0 0 20px rgba(0,242,255,0.4)' }}
          >
            {count.toLocaleString('tr')}
          </div>
          <p className="text-[11px] text-white/35 mt-1">paket engellendi</p>
        </div>
        <div className="h-12 w-px bg-white/[0.06]" />
        <div className="text-center">
          <div className="flex items-center gap-1.5 justify-center mb-1">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse" />
            <span className="text-sm font-semibold text-white">Korumalı</span>
          </div>
          <p className="text-[11px] text-white/35">shield aktif</p>
        </div>
      </div>

      {/* Live feed */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-semibold tracking-widest text-white/25 uppercase">Canlı Saldırı Kaydı</span>
        </div>
        <div className="space-y-1.5">
          {feed.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2 animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <X className="h-3 w-3 text-red-400 shrink-0" />
                <span className="text-[11px] font-mono text-white/45">{entry.ip}</span>
                <span className="text-[10px] text-white/25 hidden sm:block">{entry.type}</span>
              </div>
              <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full shrink-0">
                ENGELLENDİ
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DEMO 3 — Instant setup progress
// ═══════════════════════════════════════════════════════════════
function SetupDemo() {
  const steps = [
    { label: 'Sipariş doğrulanıyor', ms: 600 },
    { label: 'Disk alanı tahsis ediliyor', ms: 700 },
    { label: 'cPanel kurulumu yapılıyor', ms: 900 },
    { label: 'DNS kayıtları oluşturuluyor', ms: 550 },
    { label: 'SSL sertifikası yükleniyor', ms: 650 },
    { label: 'Hesabınız hazır!', ms: 0 },
  ]

  const [done, setDone] = useState(0)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timers = []
    const run = () => {
      setDone(0); setActive(0)
      let i = 0
      const next = () => {
        i++; setActive(i); setDone(i)
        if (i < steps.length) timers.push(setTimeout(next, steps[i]?.ms || 700))
        else timers.push(setTimeout(run, 3500))
      }
      timers.push(setTimeout(next, 600))
    }
    run()
    return () => timers.forEach(clearTimeout)
  }, [])

  const pct = (done / steps.length) * 100

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] tracking-widest text-white/25 uppercase">Kurulum Süreci</span>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-[#00f2ff]" />
          <span className="text-sm font-bold text-[#00f2ff]">
            {done >= steps.length ? 'Hazır!' : `${done} / ${steps.length}`}
          </span>
        </div>
      </div>

      <div className="h-1.5 bg-white/[0.05] rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg,#00f2ff,#3b82f6)',
            boxShadow: '0 0 8px rgba(0,242,255,0.5)',
          }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((s, i) => {
          const isDone = i < done
          const isActive = i === active && active < steps.length
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                isActive ? 'bg-[#00f2ff]/[0.07] border border-[#00f2ff]/20' :
                isDone   ? 'bg-white/[0.02] border border-white/[0.04]' :
                           'opacity-25'
              }`}
            >
              <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isDone   ? 'bg-[#00f2ff]/15 border border-[#00f2ff]/40' :
                isActive ? 'border border-[#00f2ff]/40' :
                           'border border-white/10'
              }`}>
                {isDone ? (
                  <Check className="h-3 w-3 text-[#00f2ff]" />
                ) : isActive ? (
                  <div className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                )}
              </div>
              <span className={`text-sm flex-1 transition-colors duration-300 ${isDone || isActive ? 'text-white/80' : 'text-white/30'}`}>
                {s.label}
              </span>
              {isDone && i === steps.length - 1 && (
                <span className="text-[9px] font-bold bg-[#00f2ff] text-black px-2 py-0.5 rounded-full animate-fade-in">
                  &lt;1 DK
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DEMO 4 — Live server metrics
// ═══════════════════════════════════════════════════════════════
function MonitorDemo() {
  const [m, setM] = useState({ cpu: 24, ram: 42, disk: 62, net: 35 })

  useEffect(() => {
    const iv = setInterval(() => {
      setM(p => ({
        cpu:  Math.round(Math.max(5,  Math.min(90, p.cpu  + (Math.random() - 0.45) * 12))),
        ram:  Math.round(Math.max(20, Math.min(78, p.ram  + (Math.random() - 0.5)  * 6))),
        disk: Math.round(Math.max(55, Math.min(70, p.disk + (Math.random() - 0.5)  * 2))),
        net:  Math.round(Math.max(8,  Math.min(85, p.net  + (Math.random() - 0.5)  * 14))),
      }))
    }, 1100)
    return () => clearInterval(iv)
  }, [])

  const bars = [
    { label: 'CPU', key: 'cpu',  color: '#00f2ff', glow: 'rgba(0,242,255,0.5)' },
    { label: 'RAM', key: 'ram',  color: '#a78bfa', glow: 'rgba(167,139,250,0.5)' },
    { label: 'Disk',key: 'disk', color: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
    { label: 'Ağ',  key: 'net',  color: '#34d399', glow: 'rgba(52,211,153,0.5)' },
  ]

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] tracking-widest text-white/25 uppercase mb-1">Canlı Sunucu İzleme</p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse" />
            <span className="text-sm font-semibold text-white">Tüm Sistemler Normal</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white/25">Uptime</div>
          <div className="text-sm font-bold text-[#00f2ff]">99.98%</div>
        </div>
      </div>

      <div className="space-y-4">
        {bars.map(bar => {
          const val = m[bar.key]
          const high = val > 75
          return (
            <div key={bar.key}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-white/45">{bar.label}</span>
                <span className="text-xs font-mono font-semibold tabular-nums" style={{ color: bar.color }}>
                  {val}%
                </span>
              </div>
              <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${val}%`,
                    background: high
                      ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
                      : `linear-gradient(90deg,${bar.color}bb,${bar.color})`,
                    boxShadow: `0 0 6px ${bar.glow}`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-[10px] text-white/20 mt-6">
        7/24 otomatik izleme &bull; Anlık uyarı sistemi
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN SECTION
// ═══════════════════════════════════════════════════════════════
const tabs = [
  { id: 'seo',     icon: Search,   label: 'SEO & Hız',       Demo: SEODemo },
  { id: 'ddos',    icon: Shield,   label: 'DDoS Koruması',   Demo: DDoSDemo },
  { id: 'setup',   icon: Zap,      label: 'Anlık Kurulum',   Demo: SetupDemo },
  { id: 'monitor', icon: Activity, label: 'Sunucu İzleme',   Demo: MonitorDemo },
]

export default function WhyChooseSection() {
  const [activeId, setActiveId] = useState('seo')
  const { Demo } = tabs.find(t => t.id === activeId) ?? tabs[0]

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-white/[0.015]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#00f2ff]/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-[0.3em] text-white/25 uppercase mb-3">
              İnteraktif Demo
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Farkı{' '}
              <span className="bg-gradient-to-r from-[#00f2ff] to-cyan-300 bg-clip-text text-transparent">
                Kendiniz Görün
              </span>
            </h2>
            <p className="mt-3 text-white/40 max-w-xl mx-auto text-base">
              Luma altyapısının avantajlarını gerçek zamanlı demolarla keşfedin.
            </p>
          </div>
        </ScrollReveal>

        {/* Layout */}
        <div className="grid lg:grid-cols-[260px_1fr] gap-5">

          {/* Tab list */}
          <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {tabs.map(tab => {
              const active = activeId === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveId(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 border shrink-0 lg:shrink
                    ${active
                      ? 'bg-[#00f2ff]/[0.08] border-[#00f2ff]/25 text-white'
                      : 'bg-white/[0.02] border-white/[0.05] text-white/50 hover:bg-white/[0.04] hover:text-white/70 hover:border-white/10'
                    }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-[#00f2ff]/15' : 'bg-white/[0.04]'}`}>
                    <tab.icon className={`h-4 w-4 ${active ? 'text-[#00f2ff]' : 'text-white/35'}`} />
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
                  {active && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00f2ff] shadow-[0_0_5px_rgba(0,242,255,0.7)] shrink-0 hidden lg:block" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Demo panel */}
          <div className="relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 min-h-[460px] overflow-hidden">
            {/* Accent corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f2ff]/[0.03] rounded-bl-full pointer-events-none" />
            <Demo key={activeId} />
          </div>
        </div>
      </div>
    </section>
  )
}
