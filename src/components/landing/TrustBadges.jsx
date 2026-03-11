import { Shield, Award, Clock, CheckCircle } from 'lucide-react'

export default function TrustBadges() {
  const badges = [
    { icon: Shield, text: 'SSL Güvenlik' },
    { icon: Award, text: 'ISO Sertifikalı' },
    { icon: Clock, text: '10+ Yıl Deneyim' },
    { icon: CheckCircle, text: '25K+ Müşteri' },
  ]

  return (
    <div className="border-t border-b bg-muted/50 py-8">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {badges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
