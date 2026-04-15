import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import HeroSection from '@/components/landing/HeroSection'
import ServicesSection from '@/components/landing/ServicesSection'
import WhyChooseSection from '@/components/landing/WhyChooseSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import FinalCTA from '@/components/landing/FinalCTA'
import LandingFooter from '@/components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <SEO
        title="Web Hosting, VDS, VPS ve Domain"
        description="Luma Yazılım ile yüksek performanslı web hosting, VDS, VPS ve domain hizmetleri. NVMe SSD, DDoS koruması, 7/24 destek. Türkiye lokasyon, %99.9 uptime."
        path="/"
      />
      <LandingHeader />
      <main>
        <HeroSection />
        <ServicesSection />
        <WhyChooseSection />
        <TestimonialsSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
