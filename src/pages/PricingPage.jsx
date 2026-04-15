import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import PricingHero from '@/components/landing/PricingHero'
import PricingCards from '@/components/landing/PricingCards'
import PricingComparison from '@/components/landing/PricingComparison'
import PricingFAQ from '@/components/landing/PricingFAQ'
import PricingCTA from '@/components/landing/PricingCTA'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <SEO
        title="Fiyatlandırma - Hosting ve Sunucu Fiyatları"
        description="Luma Yazılım hosting, VDS, VPS ve domain fiyatları. Şeffaf fiyatlandırma, gizli maliyet yok. Aylık 26,99₺'den başlayan web hosting paketleri."
        path="/pricing"
      />
      <LandingHeader />
      <main>
        <PricingHero />
        <PricingCards />
        <PricingComparison />
        <PricingFAQ />
        <PricingCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
