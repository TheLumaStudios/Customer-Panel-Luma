import { Search, ShoppingCart, Server, CheckCircle } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: 'Paketinizi Seçin',
      description: 'İhtiyacınıza uygun hosting, VPS veya sunucu paketini seçin. Tüm paketlerimizde ücretsiz deneme süresi mevcuttur.'
    },
    {
      icon: ShoppingCart,
      title: 'Sipariş Verin',
      description: 'Güvenli ödeme sistemi ile kredi kartı veya banka havalesi ile ödeme yapın. 256-bit SSL şifrelemesi ile güvenli alışveriş.'
    },
    {
      icon: Server,
      title: 'Anında Aktivasyon',
      description: 'Ödemeniz onaylandıktan sonra hizmetiniz dakikalar içinde aktif edilir. Giriş bilgileriniz e-posta ile gönderilir.'
    },
    {
      icon: CheckCircle,
      title: 'Kullanmaya Başlayın',
      description: 'Kontrol panelinize giriş yapın ve hizmetinizi kullanmaya başlayın. 7/24 teknik destek ekibimiz her an yanınızda.'
    },
  ]

  return (
    <section className="py-24 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Nasıl Başlarım?</h2>
          <p className="text-lg text-muted-foreground">
            Sadece 4 basit adımda hizmetinizi aktif edin ve kullanmaya başlayın.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border z-0"></div>
                )}

                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center mb-4">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background relative">
                      <Icon className="h-10 w-10 text-primary" />
                      <div className="absolute -top-2 -right-2 h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
