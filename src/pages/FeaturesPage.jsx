import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import FeaturesHero from '@/components/landing/FeaturesHero'
import FeaturesSection from '@/components/landing/FeaturesSection'
import FinalCTA from '@/components/landing/FinalCTA'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <SEO
        title="Özellikler - Neden Luma Yazılım?"
        description="NVMe SSD depolama, DDoS koruması, 7/24 uzman destek, %99.9 uptime garantisi. Luma Yazılım'ın sunduğu tüm özellikler ve avantajlar."
        path="/features"
      />
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
