import { useState } from 'react'
import { ChevronDown, Headphones } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: 'Still have questions?',
      answer: 'Our support specialists are available 24/7 via live chat or at least 24 hours via email.',
      cta: 'Contact Support',
      icon: true,
    },
    {
      question: 'Can I upgrade or downgrade my plan later?',
      answer: 'Yes! You can change your plan at any time through your dashboard. Upgrades take effect immediately, and we will prorate your next billing cycle automatically at the start of your next payment period.',
    },
    {
      question: 'What is the 30-day money-back guarantee?',
      answer: 'We offer a full refund within the first 30 days if you are not satisfied with our service. No questions asked, and no hidden fees.',
    },
    {
      question: 'Are there any hidden setup fees?',
      answer: 'No hidden fees! The price you see is the price you pay. All our plans include free setup, free SSL certificates, and free migration assistance.',
    },
    {
      question: 'Do you offer discounts for non-profits?',
      answer: 'Yes, we offer special pricing for registered non-profit organizations and educational institutions. Contact our sales team for more information.',
    },
    {
      question: 'Which payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans.',
    },
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-24 bg-slate-950">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Billing & Pricing FAQ</h2>
          <p className="text-slate-400">
            Everything you need to know about our plans, billing cycles, and our 30-day money-back guarantee.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-colors"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  {faq.icon && (
                    <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Headphones className="h-5 w-5 text-indigo-400" />
                    </div>
                  )}
                  <span className="font-semibold text-lg text-white">{faq.question}</span>
                </div>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 text-slate-400 transition-transform flex-shrink-0',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 pt-0">
                  <p className="text-slate-400 leading-relaxed mb-4">{faq.answer}</p>
                  {faq.cta && (
                    <a
                      href="#footer"
                      className="inline-block text-indigo-400 hover:underline font-medium"
                    >
                      {faq.cta}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
