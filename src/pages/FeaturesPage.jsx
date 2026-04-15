import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import FeaturesHero from '@/components/landing/FeaturesHero'
import FeaturesSection from '@/components/landing/FeaturesSection'
import FinalCTA from '@/components/landing/FinalCTA'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <LandingHeader />
      <main>
        <FeaturesHero />
        <FeaturesSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
