import { useEffect } from 'react'
import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Shield, Cpu, Terminal, Headphones, Wifi, Zap, HardDrive } from 'lucide-react'
import { useProductCache } from '@/contexts/ProductCacheContext'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { toast } from 'sonner'
import { viewContent } from '@/lib/metaPixel'

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(price)

export default function VdsPage() {
  const { packages } = useProductCache('vds')
  const addToCheckout = useCheckoutStore(s => s.addItem)

  useEffect(() => {
    viewContent({ contentId: 'vds', contentName: 'VDS Sunucu', contentType: 'product_group', value: 129.99 })
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      <SEO
        title="VDS Sunucu - Sanal Dedicated Sunucu"
        description="Yüksek performanslı VDS sunucu. 1-64 GB RAM, NVMe SSD, KVM sanallaştırma, 10 Gbit bağlantı. Aylık 129,99₺'den başlayan fiyatlarla."
        path="/vds"
        schema={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "VDS Sunucu",
          "description": "Sanal dedicated sunucu kiralama hizmeti",
          "brand": {"@type": "Brand", "name": "Luma Yazılım"},
          "offers": {"@type": "AggregateOffer", "lowPrice": "129.99", "highPrice": "1345.99", "priceCurrency": "TRY", "offerCount": "20"}
        }}
      />
      <LandingHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[128px]" />

        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm mb-6">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <span className="text-sm text-slate-300">KVM Sanallaştırma &bull; Tam Root Erişim &bull; 10 Gbit İnternet</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            VDS Sunucu
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Dedicated kaynaklarla güçlendirilmiş KVM sanal sunucular. AMD EPYC işlemciler ve NVMe SSD.
          </p>
        </div>
      </section>

      {/* Packages */}
      <section className="pb-24">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/80 text-sm">
                  <th className="text-left py-4 px-5 font-semibold text-slate-300">Paket</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-300">CPU</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-300">RAM</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-300">Disk</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-300">Bant Genişliği</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-300">Fiyat</th>
                  <th className="text-center py-4 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg, i) => {
                  const hasDiscount = pkg.price_original && pkg.price_original > pkg.price_monthly
                  return (
                    <tr
                      key={pkg.id || i}
                      className={`border-t border-slate-800 hover:bg-indigo-500/5 transition-colors ${i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/70'}`}
                    >
                      <td className="py-5 px-5">
                        <span className="font-semibold text-white">{pkg.name}</span>
                      </td>
                      <td className="text-center py-5 px-4 text-sm text-slate-400">
                        <div className="flex items-center justify-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-slate-500" />
                          {pkg.cpu_cores} Çekirdek
                        </div>
                      </td>
                      <td className="text-center py-5 px-4">
                        <span className="font-medium text-white">{pkg.ram_gb} GB</span>
                        <span className="text-xs text-slate-500 ml-1">{pkg.ram_type || 'DDR4'}</span>
                      </td>
                      <td className="text-center py-5 px-4">
                        <span className="font-medium text-white">{pkg.disk_gb} GB</span>
                        <span className="text-xs text-slate-500 ml-1">{pkg.disk_type || 'NVMe SSD'}</span>
                      </td>
                      <td className="text-center py-5 px-4 text-sm text-slate-400">
                        <div className="flex items-center justify-center gap-1.5">
                          <Wifi className="h-3.5 w-3.5 text-slate-500" />
                          {pkg.bandwidth || '10 Gbit'}
                        </div>
                      </td>
                      <td className="text-center py-5 px-4">
                        <div className="flex flex-col items-center">
                          {hasDiscount && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="line-through text-slate-600 text-xs">{formatPrice(pkg.price_original)}₺</span>
                              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">İNDİRİM</span>
                            </div>
                          )}
                          <span className="text-lg font-bold text-white">{formatPrice(pkg.price_monthly)}₺</span>
                          <span className="text-[11px] text-slate-500">/ay +KDV</span>
                        </div>
                      </td>
                      <td className="text-center py-5 px-4">
                        <Button
                          size="sm"
                          className="rounded-full px-5 bg-indigo-600 hover:bg-indigo-500"
                          onClick={() => {
                            addToCheckout({ id: pkg.id, slug: pkg.slug, name: pkg.name, price_monthly: pkg.price_monthly, product_type: 'vds', package_id: pkg.id })
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
      <section className="py-20 bg-slate-900">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-10">Tüm VDS Paketlerinde</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Shield, title: 'DDoS Koruması', desc: 'Gelişmiş DDoS koruma sistemi ile sunucunuz güvende', gradient: 'from-emerald-500 to-teal-500' },
              { icon: Cpu, title: 'KVM Sanallaştırma', desc: 'İzole kaynaklar ile maksimum performans garantisi', gradient: 'from-indigo-500 to-blue-500' },
              { icon: Terminal, title: 'Tam Root Erişim', desc: 'Sunucunuz üzerinde tam yönetici yetkileri', gradient: 'from-amber-500 to-orange-500' },
              { icon: Headphones, title: '7/24 Teknik Destek', desc: 'Uzman teknik ekibimiz her zaman yanınızda', gradient: 'from-violet-500 to-purple-500' },
            ].map((f) => (
              <div key={f.title} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 text-center hover:border-indigo-500/30 transition-all">
                <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br ${f.gradient} mb-4 shadow-lg`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
