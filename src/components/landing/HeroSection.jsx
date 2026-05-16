import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import ParticleField from '@/components/landing/ParticleField'
import MagneticButton from '@/components/landing/MagneticButton'

const PHRASES = ['Yeni Standardı', 'Geleceği', 'Zirvesi', 'Kalbi']
const TYPE_SPEED = 80
const DELETE_SPEED = 45
const PAUSE_AFTER = 2200
const PAUSE_BEFORE = 300

function Globe() {
  const R = 300
  const latitudes = [-240, -190, -135, -75, 0, 75, 135, 190, 240]
  const longitudes = [0, 20, 40, 60, 80, 100, 120, 140, 160]

  return (
    <svg viewBox="-320 -320 640 640" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="globeCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.07" />
          <stop offset="60%" stopColor="#00f2ff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#00f2ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="globeFade" cx="50%" cy="50%" r="50%">
          <stop offset="45%" stopColor="black" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.85" />
        </radialGradient>
        <clipPath id="sphereClip">
          <circle r={R} />
        </clipPath>
      </defs>

      <circle r={R} fill="url(#globeCenter)" />

      <g
        clipPath="url(#sphereClip)"
        style={{
          animation: 'spin 80s linear infinite',
          transformOrigin: '50% 50%',
          transformBox: 'fill-box',
        }}
      >
        {latitudes.map((y) => {
          const rx = Math.sqrt(Math.max(0, R * R - y * y))
          return rx > 4 ? (
            <ellipse key={`lat-${y}`} cx={0} cy={y} rx={rx} ry={rx * 0.28}
              fill="none" stroke="rgba(0,242,255,0.09)" strokeWidth="0.7" />
          ) : null
        })}
        {longitudes.map((angle) => {
          const rx = Math.max(1, R * Math.abs(Math.sin((angle * Math.PI) / 180)))
          return (
            <ellipse key={`lon-${angle}`} rx={rx} ry={R}
              fill="none" stroke="rgba(0,242,255,0.06)" strokeWidth="0.7"
              transform={`rotate(${angle})`} />
          )
        })}
      </g>

      <circle r={R} fill="url(#globeFade)" />
      <circle r={R} fill="none" stroke="rgba(0,242,255,0.13)" strokeWidth="1" />
      <circle r={R + 5} fill="none" stroke="rgba(0,242,255,0.04)" strokeWidth="8" />
      <circle r={R + 16} fill="none" stroke="rgba(0,242,255,0.02)" strokeWidth="8" />
    </svg>
  )
}

export default function HeroSection() {
  // Typewriter
  const [displayText, setDisplayText] = useState(PHRASES[0])
  const [isDeleting, setIsDeleting] = useState(false)
  const [phraseIndex, setPhraseIndex] = useState(0)

  // Refs for parallax
  const sectionRef = useRef(null)
  const globeRef = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })
  const globeOffset = useRef({ x: 0, y: 0 })
  const rafRef = useRef(null)

  // Typewriter logic
  useEffect(() => {
    const phrase = PHRASES[phraseIndex]
    let timeout

    if (!isDeleting) {
      if (displayText.length < phrase.length) {
        timeout = setTimeout(
          () => setDisplayText(phrase.slice(0, displayText.length + 1)),
          TYPE_SPEED
        )
      } else {
        timeout = setTimeout(() => setIsDeleting(true), PAUSE_AFTER)
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(
          () => setDisplayText(displayText.slice(0, -1)),
          DELETE_SPEED
        )
      } else {
        setIsDeleting(false)
        const nextIndex = (phraseIndex + 1) % PHRASES.length
        setPhraseIndex(nextIndex)
        timeout = setTimeout(() => {}, PAUSE_BEFORE)
      }
    }
    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, phraseIndex])

  // Globe parallax
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const section = sectionRef.current
    if (!section) return

    const onMouseMove = (e) => {
      const rect = section.getBoundingClientRect()
      mouse.current.x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
      mouse.current.y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    }

    section.addEventListener('mousemove', onMouseMove)

    const animate = () => {
      globeOffset.current.x += (mouse.current.x * 25 - globeOffset.current.x) * 0.08
      globeOffset.current.y += (mouse.current.y * 25 - globeOffset.current.y) * 0.08

      if (globeRef.current) {
        globeRef.current.style.transform =
          `translate(calc(-50% + ${globeOffset.current.x}px), calc(-52% + ${globeOffset.current.y}px))`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      section.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center pt-20 pb-16"
    >
      {/* Particle field */}
      <ParticleField />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_40%,rgba(0,242,255,0.05),transparent_70%)]" />

      {/* Rotating globe */}
      <div
        ref={globeRef}
        className="absolute top-1/2 left-1/2 w-[640px] h-[640px] opacity-80 pointer-events-none select-none"
        style={{ transform: 'translate(-50%, -52%)' }}
      >
        <Globe />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto px-4">

        <div className="inline-flex items-center gap-2 bg-[#00f2ff]/[0.08] border border-[#00f2ff]/20 rounded-full px-4 py-1.5 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2ff] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f2ff]" />
          </span>
          <span className="text-sm font-medium text-[#00f2ff] tracking-wide">TÜM SİSTEMLER AKTİF</span>
        </div>

        <p className="text-xs font-semibold tracking-[0.3em] text-white/30 uppercase mb-5">
          Kurumsal Hosting &amp; Sunucu Altyapısı
        </p>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.06]">
          <span className="text-white">Dijital Altyapının</span>
          <br />
          <span
            className="bg-gradient-to-r from-[#00f2ff] via-cyan-300 to-blue-400 bg-clip-text text-transparent inline-block"
            style={{ minHeight: '1.2em' }}
          >
            {displayText}
            <span
              className="ml-0.5 text-[#00f2ff]"
              style={{ animation: 'cursor-blink 1s step-end infinite' }}
            >
              |
            </span>
          </span>
        </h1>

        <p className="text-lg text-white/50 leading-relaxed max-w-2xl mb-10">
          NVMe SSD depolama, kurumsal güvenlik ve 7/24 uzman destek ile web sitenizi,
          sunucunuzu ve domainlerinizi tek platformdan yönetin.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <MagneticButton>
            <Button
              size="lg"
              className="px-8 h-12 text-base bg-[#00f2ff] text-black font-semibold hover:bg-[#00f2ff]/90 shadow-[0_0_25px_rgba(0,242,255,0.3)] hover:shadow-[0_0_35px_rgba(0,242,255,0.5)] transition-all hover:scale-[1.02]"
              asChild
            >
              <Link to="/register">Hemen Başla <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </MagneticButton>
          <MagneticButton>
            <Button
              size="lg"
              variant="ghost"
              className="px-8 h-12 text-base border border-white/10 text-white/70 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#00f2ff]/30 hover:text-white transition-all"
              asChild
            >
              <Link to="/contact">Bize Ulaşın</Link>
            </Button>
          </MagneticButton>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {['%99.9 Uptime Garantisi', 'NVMe Gen4 SSD', 'DDoS Koruması', 'Ücretsiz SSL', '7/24 Destek'].map((pill) => (
            <span key={pill} className="text-xs text-white/35 border border-white/[0.08] rounded-full px-3 py-1 bg-white/[0.03]">
              {pill}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
