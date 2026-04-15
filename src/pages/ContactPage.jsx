import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import ContactHero from '@/components/landing/ContactHero'
import ContactForm from '@/components/landing/ContactForm'
import GlobalPresence from '@/components/landing/GlobalPresence'
import ContactFAQ from '@/components/landing/ContactFAQ'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <SEO
        title="İletişim"
        description="Luma Yazılım ile iletişime geçin. Satış, teknik destek ve genel sorularınız için 7/24 destek ekibimize ulaşın. Bursa, Türkiye."
        path="/contact"
        schema={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Luma Yazılım İletişim",
          "url": "https://lumayazilim.com/contact"
        }}
      />
      <LandingHeader />
      <main>
        <ContactHero />
        <ContactForm />
        <GlobalPresence />
        <ContactFAQ />
      </main>
      <LandingFooter />
    </div>
  )
}
