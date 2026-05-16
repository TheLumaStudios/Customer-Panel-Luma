import { useState, useEffect, useRef } from 'react'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import ScrollReveal from '@/components/landing/ScrollReveal'

const testimonials = [
  {
    quote: "Luma'ya geçmek yaptığım en iyi teknik karardı. Eski sunucuma göre %90 daha hızlı yanıt süresi elde ettim ve bu farkı müşterilerim de anında hissetti.",
    author: 'Ahmet Yılmaz',
    role: 'CTO & Kurucu',
    company: 'TechFlow',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmet',
    rating: 5,
    accentColor: '#00f2ff',
    borderHover: 'rgba(0,242,255,0.2)',
  },
  {
    quote: "Destek ekibi inanılmaz. Gece yarısı 3'te API entegrasyonumda sorun yaşadım ve 5 dakika içinde canlı yardım aldım. Gerçekten efsaneler.",
    author: 'Zeynep Kaya',
    role: 'Backend Geliştirici',
    company: 'Zenith Digital',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zeynep',
    rating: 5,
    accentColor: '#67e8f9',
    borderHover: 'rgba(103,232,249,0.2)',
  },
  {
    quote: 'E-commerce sitelerimizi yönetmek için birçok hosting denedik ama Luma ile performans ve güvenilirlik açısından en iyisini bulduk.',
    author: 'Mehmet Öz',
    role: 'Kurucu',
    company: 'Velocity Commerce',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mehmet',
    rating: 5,
    accentColor: '#34d399',
    borderHover: 'rgba(52,211,153,0.2)',
  },
  {
    quote: 'Sunucu göçü sırasında sıfır kesinti yaşadık. Migration ekibi her şeyi sorunsuz şekilde taşıdı. Profesyonellik konusunda sınıf atlattılar.',
    author: 'Elif Demir',
    role: 'Proje Yöneticisi',
    company: 'NovaSoft',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elif',
    rating: 5,
    accentColor: '#a78bfa',
    borderHover: 'rgba(167,139,250,0.2)',
  },
]

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef(null)
  const timerRef = useRef(null)

  const count = testimonials.length

  const goTo = (idx) => {
    setCurrentIndex(((idx % count) + count) % count)
  }
  const prev = () => goTo(currentIndex - 1)
  const next = () => goTo(currentIndex + 1)

  useEffect(() => {
    if (isHovered) return
    timerRef.current = setInterval(next, 4500)
    return () => clearInterval(timerRef.current)
  }, [currentIndex, isHovered])

  // Touch swipe
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
    touchStartX.current = null
  }

  const t = testimonials[currentIndex]

  return (
    <section className="relative py-28">
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-[#00f2ff]/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-amber-400">Müşteri Yorumları</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Binlerce Müşterimiz{' '}
              <span className="bg-gradient-to-r from-[#00f2ff] to-cyan-300 bg-clip-text text-transparent">
                Bize Güveniyor
              </span>
            </h2>
            <p className="text-lg text-white/40">
              İşletmeler ve geliştiriciler dijital altyapıları için neden Luma'yı tercih ediyor?
            </p>
          </div>
        </ScrollReveal>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Card */}
          <div
            className="relative bg-white/[0.03] backdrop-blur-sm border rounded-2xl p-8 md:p-12 transition-all duration-500"
            style={{ borderColor: t.borderHover }}
          >
            <Quote className="absolute top-6 right-6 h-10 w-10 text-white/[0.04]" />

            <div className="flex gap-1 mb-6">
              {[...Array(t.rating)].map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>

            <blockquote
              className="text-white/70 leading-relaxed text-lg md:text-xl mb-8 max-w-3xl"
              key={currentIndex}
              style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <div className="flex items-center gap-4 pt-6 border-t border-white/[0.06]">
              <img
                src={t.avatar}
                alt={t.author}
                className="h-14 w-14 rounded-full bg-white/10 border-2"
                style={{ borderColor: t.accentColor + '40' }}
              />
              <div>
                <div className="font-semibold text-white">{t.author}</div>
                <div className="text-sm" style={{ color: t.accentColor + 'cc' }}>
                  {t.role} &bull; {t.company}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: i === currentIndex ? 24 : 8,
                    height: 8,
                    background: i === currentIndex ? '#00f2ff' : 'rgba(255,255,255,0.15)',
                    boxShadow: i === currentIndex ? '0 0 8px rgba(0,242,255,0.6)' : 'none',
                  }}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                className="h-10 w-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/50 hover:bg-white/[0.10] hover:text-white hover:border-[#00f2ff]/30 transition-all"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="h-10 w-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/50 hover:bg-white/[0.10] hover:text-white hover:border-[#00f2ff]/30 transition-all"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
