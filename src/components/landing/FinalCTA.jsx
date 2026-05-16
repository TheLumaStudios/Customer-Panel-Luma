import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

const perks = [
  'Anında kurulum',
  'Ücretsiz SSL dahil',
  'İptal garantisi',
  '7/24 destek',
]

export default function FinalCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#00f2ff]/[0.06] rounded-full blur-[130px]" />

      {/* Outer ring effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#00f2ff]/[0.06]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-[#00f2ff]/[0.08]" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-[#00f2ff]/[0.08] border border-[#00f2ff]/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="h-4 w-4 text-[#00f2ff]" />
          <span className="text-sm text-[#00f2ff]">Hemen başlayın, dakikalar içinde aktif</span>
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
          Dijital Varlığınızı{' '}
          <span className="bg-gradient-to-r from-[#00f2ff] via-cyan-300 to-blue-400 bg-clip-text text-transparent">
            Bir Üst Seviyeye
          </span>{' '}
          Taşıyın
        </h2>

        <p className="text-lg text-white/40 mb-10 max-w-2xl mx-auto leading-relaxed">
          Binlerce işletme ve geliştirici Luma altyapısını tercih ediyor.
          Siz de hızlı, güvenli ve ölçeklenebilir hosting ile farkı yaşayın.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-10">
          <Button
            size="lg"
            className="px-10 h-12 text-base bg-[#00f2ff] text-black font-semibold hover:bg-[#00f2ff]/90 shadow-[0_0_30px_rgba(0,242,255,0.35)] hover:shadow-[0_0_45px_rgba(0,242,255,0.55)] transition-all hover:scale-[1.02]"
            asChild
          >
            <Link to="/register">
              Ücretsiz Başla
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="px-10 h-12 text-base border border-white/10 text-white/70 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#00f2ff]/30 hover:text-white transition-all"
            asChild
          >
            <Link to="/contact">Satış Ekibiyle Konuş</Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-white/40">
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#00f2ff]" />
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
