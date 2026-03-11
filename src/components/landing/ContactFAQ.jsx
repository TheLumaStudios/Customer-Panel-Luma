import { useState } from 'react'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ContactFAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    {
      question: 'Do you offer free website migrations?',
      answer: 'Yes, our expert migration team can move your existing website to Hostify at no additional cost. We handle everything from files to databases ensuring zero downtime for your business.',
    },
    {
      question: 'What is your uptime guarantee?',
      answer: 'We guarantee 99.9% uptime backed by our SLA. If we fail to meet this commitment, you will receive service credits automatically.',
    },
    {
      question: 'How do I upgrade my current hosting plan?',
      answer: 'You can upgrade your plan anytime from your dashboard. The upgrade takes effect immediately, and we will prorate the charges for your current billing cycle.',
    },
    {
      question: 'Are SSL certificates included?',
      answer: 'Yes! All our hosting plans include free Let\'s Encrypt SSL certificates with automatic renewal. For advanced certificates, we also support custom SSL integration.',
    },
    {
      question: 'Can I choose my server location?',
      answer: 'Absolutely! We have data centers across North America, Europe, and Asia-Pacific. You can select your preferred location during signup or change it later from your control panel.',
    },
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-24 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Get instant answers to common questions about our platform and services.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-12">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-lg pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform flex-shrink-0',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 pt-0">
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions CTA */}
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/10 mb-6">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Still have questions?
          </h3>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Cannot find the answer you are looking for? Our support team is here to help.
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
            Talk to an Expert
          </Button>
        </div>
      </div>
    </section>
  )
}
