import { useEffect, useRef } from 'react'
import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import StatsSection from '@/components/landing/StatsSection'
import ServicesSection from '@/components/landing/ServicesSection'
import WhyChooseSection from '@/components/landing/WhyChooseSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import FinalCTA from '@/components/landing/FinalCTA'
import LandingFooter from '@/components/landing/LandingFooter'
import CursorGlow from '@/components/landing/CursorGlow'

export default function LandingPage() {
  const progressRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      const el = progressRef.current
      if (!el) return
      const scrolled =
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      el.style.width = `${Math.min(scrolled * 100, 100)}%`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#050505]">
      <SEO
        title="Web Hosting, VDS, VPS ve Domain"
        description="Luma Yazılım ile yüksek performanslı web hosting, VDS, VPS ve domain hizmetleri. NVMe SSD, DDoS koruması, 7/24 destek. Türkiye lokasyon, %99.9 uptime."
        path="/"
      />

      {/* Cursor glow */}
      <CursorGlow />

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[9997] h-[2px] bg-transparent pointer-events-none">
        <div
          ref={progressRef}
          style={{
            width: '0%',
            height: '100%',
            background: '#00f2ff',
            boxShadow: '0 0 8px rgba(0,242,255,0.8)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <ServicesSection />
        <WhyChooseSection />
        <TestimonialsSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
