import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function PricingCTA() {
  return (
    <section className="py-24 bg-indigo-600">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Online Varlığınızı Hızlandırmaya Hazır mısınız?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Luma'yı kullanan binlerce başarılı işletmeye katılın. Online varlığınızı güvenle oluşturmayı, yönetmeyi ve büyütmeyi kolaylaştırıyoruz.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-indigo-600 hover:bg-white/90 px-8"
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
              <Link to="/features">Özellikleri Keşfet</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
