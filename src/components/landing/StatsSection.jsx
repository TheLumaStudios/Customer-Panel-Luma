import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/landing/ScrollReveal'

const metrics = [
  { value: 99.9, suffix: '%', label: 'Uptime SLA', decimal: true },
  { value: 45, suffix: 'ms', label: 'Ort. TTFB' },
  { value: 10000, suffix: '+', label: 'Aktif Müşteri' },
  { value: 5, suffix: 'dk', label: 'Ort. Destek Yanıtı' },
]

function useCountUp(target, duration = 1600, start = false, decimal = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(decimal ? +(target * eased).toFixed(1) : Math.floor(target * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start, decimal])
  return count
}

function MetricItem({ metric, visible }) {
  const count = useCountUp(metric.value, 1600, visible, metric.decimal)
  return (
    <div className="group">
      <div className="text-4xl xl:text-5xl font-bold text-white mb-1 tabular-nums">
        <span className="bg-gradient-to-r from-[#00f2ff] to-cyan-300 bg-clip-text text-transparent">
          {count.toLocaleString('tr')}
        </span>
        <span className="text-2xl xl:text-3xl text-white/30">{metric.suffix}</span>
      </div>
      <div className="text-sm text-white/40 font-medium">{metric.label}</div>
    </div>
  )
}

function ServerRack() {
  const [rows, setRows] = useState([
    { usage: 23, label: 'WEB-01' },
    { usage: 67, label: 'DB-01' },
    { usage: 41, label: 'CDN-01' },
    { usage: 88, label: 'STOR-01' },
    { usage: 15, label: 'MAIL-01' },
    { usage: 54, label: 'VDS-01' },
  ])

  useEffect(() => {
    const iv = setInterval(() => {
      setRows(prev => prev.map(r => ({
        ...r,
        usage: Math.round(Math.max(5, Math.min(95, r.usage + (Math.random() - 0.5) * 10))),
      })))
    }, 1400)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="relative">
      {/* Outer glow */}
      <div className="absolute -inset-6 bg-[#00f2ff]/[0.03] rounded-2xl blur-xl pointer-events-none" />

      {/* Rack frame */}
      <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-2.5">
        {/* Frame header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-white/25 uppercase">
            Luma / TR-01 Rack
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] shadow-[0_0_6px_rgba(0,242,255,0.8)]" />
            <span className="text-[10px] text-[#00f2ff]">Online</span>
          </div>
        </div>

        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center gap-3 h-10 bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 hover:border-[#00f2ff]/15 transition-colors"
          >
            {/* LED indicators */}
            <div className="flex gap-1 shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] shadow-[0_0_5px_rgba(0,242,255,0.7)]" />
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]" />
            </div>

            {/* Server label */}
            <span className="text-[10px] font-mono text-white/30 w-14 shrink-0">{row.label}</span>

            {/* Usage bar */}
            <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${row.usage}%`,
                  background: row.usage > 75
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(90deg, #00f2ff, #3b82f6)',
                  boxShadow: row.usage > 75
                    ? undefined
                    : '0 0 6px rgba(0,242,255,0.4)',
                }}
              />
            </div>

            {/* Usage value */}
            <span className="text-[10px] font-mono text-white/25 w-8 text-right shrink-0">{row.usage}%</span>
          </div>
        ))}

        {/* Bottom status */}
        <div className="pt-3 mt-1 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[10px] text-white/20">6 / 6 aktif</span>
          <span className="text-[10px] text-white/20 font-mono">Uptime: 99.9%</span>
        </div>
      </div>
    </div>
  )
}

export default function StatsSection() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-white/[0.015]" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-[#00f2ff]/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — metrics */}
          <div className="space-y-10">
            {/* Section header */}
            <ScrollReveal>
              <div>
                <p className="text-xs font-semibold tracking-[0.3em] text-white/25 uppercase mb-3">
                  Küresel Telemetri
                </p>
                <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                  Yüksek Performans,{' '}
                  <span className="bg-gradient-to-r from-[#00f2ff] to-cyan-300 bg-clip-text text-transparent">
                    Rakamlarla
                  </span>
                </h2>
                <p className="mt-4 text-white/40 text-base leading-relaxed max-w-md">
                  Altyapımız her saniye izlenir. Tüm metrikler gerçek zamanlı verilerden hesaplanır.
                </p>
              </div>
            </ScrollReveal>

            {/* Metric grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              {metrics.map((m) => (
                <MetricItem key={m.label} metric={m} visible={visible} />
              ))}
            </div>

            {/* CTA */}
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#00f2ff] hover:text-cyan-300 transition-colors group"
            >
              Sistemi Keşfet
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right — server rack visual */}
          <ServerRack />
        </div>
      </div>
    </section>
  )
}
