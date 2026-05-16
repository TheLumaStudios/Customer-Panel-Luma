import { useEffect } from 'react'
import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Shield, Zap, HardDrive, Headphones, Wifi, Cpu, Server, ArrowRight } from 'lucide-react'
import { useProductCache } from '@/contexts/ProductCacheContext'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { viewContent } from '@/lib/metaPixel'

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(price)

export default function VpsPage() {
  const { packages } = useProductCache('vps')
  const addToCheckout = useCheckoutStore(s => s.addItem)

  useEffect(() => {
    viewContent({ contentId: 'vps', contentName: 'VPS Sunucu', contentType: 'product_group', value: 109.99 })
  }, [])

  return (
    <div className="min-h-screen bg-[#050505]">
      <SEO
        title="VPS Sunucu - Sanal Özel Sunucu"
        description="Türkiye lokasyonlu VPS sunucu kiralama. 1-16 GB RAM, NVMe SSD, KVM sanallaştırma, tam root erişim. Aylık 110,99₺'den başlayan fiyatlarla."
        path="/vps"
        schema={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "VPS Sunucu",
          "description": "Sanal özel sunucu kiralama hizmeti",
          "brand": {"@type": "Brand", "name": "Luma Yazılım"},
          "offers": {"@type": "AggregateOffer", "lowPrice": "110.99", "highPrice": "402.99", "priceCurrency": "TRY", "offerCount": "16"}
        }}
      />
      <LandingHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#00f2ff]/5 rounded-full blur-[128px]" />

        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm mb-6">
            <Zap className="h-4 w-4 text-[#00f2ff]" />
            <span className="text-sm text-white/70">Yüksek Performans &bull; NVMe SSD &bull; 10 Gbit İnternet</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            VPS Sunucu
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto">
            Sana uygun olan VPS sunucunu seç ve kirala. NVMe SSD diskler ve son teknoloji donanımlar.
          </p>
        </div>
      </section>

      {/* Packages */}
      <section className="pb-24">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.06] text-sm">
                  <th className="text-left py-4 px-5 font-semibold text-white/70">Paket</th>
                  <th className="text-center py-4 px-4 font-semibold text-white/70">CPU</th>
                  <th className="text-center py-4 px-4 font-semibold text-white/70">RAM</th>
                  <th className="text-center py-4 px-4 font-semibold text-white/70">Disk</th>
                  <th className="text-center py-4 px-4 font-semibold text-white/70">Bant Genişliği</th>
                  <th className="text-center py-4 px-4 font-semibold text-white/70">Fiyat</th>
                  <th className="text-center py-4 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg, i) => {
                  const hasDiscount = pkg.price_original && pkg.price_original > pkg.price_monthly
                  return (
                    <tr
                      key={pkg.id || i}
                      className={`border-t border-white/[0.08] hover:bg-[#00f2ff]/5 transition-colors ${i % 2 === 0 ? 'bg-white/[0.03]' : 'bg-white/[0.05]'}`}
                    >
                      <td className="py-5 px-5">
                        <span className="font-semibold text-white">{pkg.name}</span>
                      </td>
                      <td className="text-center py-5 px-4 text-sm text-white/50">
                        <div className="flex items-center justify-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-white/30" />
                          {pkg.cpu_cores} Çekirdek
                        </div>
                      </td>
                      <td className="text-center py-5 px-4">
                        <span className="font-medium text-white">{pkg.ram_gb} GB</span>
                        <span className="text-xs text-white/30 ml-1">{pkg.ram_type || 'DDR4'}</span>
                      </td>
                      <td className="text-center py-5 px-4">
                        <span className="font-medium text-white">{pkg.disk_gb} GB</span>
                        <span className="text-xs text-white/30 ml-1">{pkg.disk_type || 'NVMe SSD'}</span>
                      </td>
                      <td className="text-center py-5 px-4 text-sm text-white/50">
                        <div className="flex items-center justify-center gap-1.5">
                          <Wifi className="h-3.5 w-3.5 text-white/30" />
                          {pkg.bandwidth || '10 Gbit'}
                        </div>
                      </td>
                      <td className="text-center py-5 px-4">
                        <div className="flex flex-col items-center">
                          {hasDiscount && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="line-through text-white/20 text-xs">{formatPrice(pkg.price_original)}₺</span>
                              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">İNDİRİM</span>
                            </div>
                          )}
                          <span className="text-lg font-bold text-white">{formatPrice(pkg.price_monthly)}₺</span>
                          <span className="text-[11px] text-white/30">/ay +KDV</span>
                        </div>
                      </td>
                      <td className="text-center py-5 px-4">
                        <Button
                          size="sm"
                          className="rounded-full px-5 bg-[#00f2ff] text-black hover:bg-[#00f2ff]/90"
                          onClick={() => {
                            addToCheckout({ id: pkg.id, slug: pkg.slug, name: pkg.name, price_monthly: pkg.price_monthly, product_type: 'vps', package_id: pkg.id })
                            toast.success('Sepete eklendi', { description: pkg.name })
                          }}
                        >
                          Sepete Ekle
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-10">Tüm VPS Paketlerinde</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Shield, title: 'DDoS Koruması', desc: 'Gelişmiş DDoS koruma sistemi ile sunucunuz güvende', gradient: 'from-emerald-500 to-teal-500' },
              { icon: Zap, title: 'Anlık Kurulum', desc: 'Siparişiniz anında kurulur ve kullanıma hazır', gradient: 'from-amber-500 to-orange-500' },
              { icon: HardDrive, title: 'NVMe SSD Disk', desc: 'Yüksek hızlı NVMe SSD diskler ile maksimum performans', gradient: 'from-indigo-500 to-blue-500' },
              { icon: Headphones, title: '7/24 Teknik Destek', desc: 'Uzman teknik ekibimiz her zaman yanınızda', gradient: 'from-violet-500 to-purple-500' },
            ].map((f) => (
              <div key={f.title} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 text-center hover:border-[#00f2ff]/30 transition-all">
                <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br ${f.gradient} mb-4 shadow-lg`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
