import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import ContactHero from '@/components/landing/ContactHero'
import ContactForm from '@/components/landing/ContactForm'
import GlobalPresence from '@/components/landing/GlobalPresence'
import ContactFAQ from '@/components/landing/ContactFAQ'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
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
