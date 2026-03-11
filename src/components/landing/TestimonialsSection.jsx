import { Star } from 'lucide-react'

export default function TestimonialsSection() {
  const testimonials = [
    {
      quote: 'Luma\'ya geçmek yaptığım en iyi teknik karardı. Eski sunucuma göre %90 daha hızlı yanıt süresi elde ettim ve bu farkı anında hissediyorum.',
      author: 'Ahmet Yılmaz',
      role: 'CTO & Kurucu',
      company: 'TechFlow',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmet',
    },
    {
      quote: 'Destek ekibi inanılmaz. Gece yarısı 3\'te API entegrasyonumda sorun yaşadım ve 5 dakika içinde canlı yardım aldım. Gerçekten efsaneler.',
      author: 'Zeynep Kaya',
      role: 'Backend Geliştirici',
      company: 'Zenith Digital',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zeynep',
    },
    {
      quote: 'E-commerce sitelerimizi yönetmek için birçok hosting denedik ama Luma ile performans ve güvenilirlik açısından en iyisini bulduk.',
      author: 'Mehmet Öz',
      role: 'Kurucu',
      company: 'Velocity Commerce',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mehmet',
    },
  ]

  return (
    <section className="py-24 bg-muted">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-4">Sektör Liderlerinin Güvendiği</h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            50.000\'den fazla geliştirici ve işletme, dijital varlıklarını ayakta tutmak ve en üst seviyede performans göstermek için Luma\'ya güveniyor.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-8 hover:border-primary hover:shadow-lg transition-all">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-sm text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="h-12 w-12 rounded-full border-2 border-border"
                />
                <div>
                  <div className="font-semibold text-sm">{testimonial.author}</div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
