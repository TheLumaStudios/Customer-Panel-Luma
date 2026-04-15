import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    quote: 'Luma\'ya geçmek yaptığım en iyi teknik karardı. Eski sunucuma göre %90 daha hızlı yanıt süresi elde ettim ve bu farkı müşterilerim de anında hissetti.',
    author: 'Ahmet Yılmaz',
    role: 'CTO & Kurucu',
    company: 'TechFlow',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmet',
    rating: 5,
  },
  {
    quote: 'Destek ekibi inanılmaz. Gece yarısı 3\'te API entegrasyonumda sorun yaşadım ve 5 dakika içinde canlı yardım aldım. Gerçekten efsaneler.',
    author: 'Zeynep Kaya',
    role: 'Backend Geliştirici',
    company: 'Zenith Digital',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zeynep',
    rating: 5,
  },
  {
    quote: 'E-commerce sitelerimizi yönetmek için birçok hosting denedik ama Luma ile performans ve güvenilirlik açısından en iyisini bulduk.',
    author: 'Mehmet Öz',
    role: 'Kurucu',
    company: 'Velocity Commerce',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mehmet',
    rating: 5,
  },
  {
    quote: 'Sunucu göçü sırasında sıfır kesinti yaşadık. Migration ekibi her şeyi sorunsuz şekilde taşıdı. Profesyonellik konusunda sınıf atlattılar.',
    author: 'Elif Demir',
    role: 'Proje Yöneticisi',
    company: 'NovaSoft',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elif',
    rating: 5,
  },
]

export default function TestimonialsSection() {
  return (
    <section className="relative py-24 bg-slate-950 overflow-hidden">
      {/* Gradient orb */}
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-violet-500/5 rounded-full blur-[120px]" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-medium text-slate-300">Müşteri Yorumları</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Binlerce Müşterimiz Bize Güveniyor
          </h2>
          <p className="text-lg text-slate-400">
            İşletmeler ve geliştiriciler dijital altyapıları için neden Luma'yı tercih ediyor?
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group relative bg-slate-900/60 border border-slate-800 rounded-2xl p-8 hover:border-indigo-500/30 hover:bg-slate-900 transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="absolute top-6 right-6 h-8 w-8 text-slate-800 group-hover:text-slate-700 transition-colors" />

              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote text */}
              <blockquote className="text-slate-300 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-slate-800">
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="h-11 w-11 rounded-full bg-slate-800 border-2 border-slate-700"
                />
                <div>
                  <div className="font-semibold text-sm text-white">{t.author}</div>
                  <div className="text-xs text-slate-500">
                    {t.role} &bull; {t.company}
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
