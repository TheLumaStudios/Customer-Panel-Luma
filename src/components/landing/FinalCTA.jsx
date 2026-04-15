import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/15 rounded-full blur-[120px]" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span className="text-sm text-slate-300">Hemen başlayın, dakikalar içinde aktif</span>
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Dijital Varlığınızı{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Bir Üst Seviyeye
          </span>{' '}
          Taşıyın
        </h2>

        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Binlerce işletme ve geliştirici Luma altyapısını tercih ediyor. Siz de hızlı, güvenli ve ölçeklenebilir hosting ile farkı yaşayın.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            size="lg"
            className="px-8 h-12 text-base bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25"
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
            className="px-8 h-12 text-base border border-slate-600 text-slate-200 bg-transparent hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link to="/contact">Satış Ekibiyle Konuş</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
