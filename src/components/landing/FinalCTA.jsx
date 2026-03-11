import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function FinalCTA() {
  return (
    <section className="py-24 bg-primary">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Harika Bir Şeyler İnşa Etmeye Hazır mısınız?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            On binlerce başarılı işletme sahibi zaten Luma'yı kullanıyor. Dijital varlığınızı bir sonraki seviyeye taşımak için gereken tek şey, bir adım atmak.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 px-8"
              asChild
            >
              <Link to="/register">Ücretsiz Başla</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 px-8"
              asChild
            >
              <Link to="/contact">Uzmanla Konuş</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
