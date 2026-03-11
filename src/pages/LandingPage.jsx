import LandingHeader from '@/components/landing/LandingHeader'
import HeroSection from '@/components/landing/HeroSection'
import DomainSearchSection from '@/components/landing/DomainSearchSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import FinalCTA from '@/components/landing/FinalCTA'
import LandingFooter from '@/components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <HeroSection />
        <DomainSearchSection />
        <TestimonialsSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
