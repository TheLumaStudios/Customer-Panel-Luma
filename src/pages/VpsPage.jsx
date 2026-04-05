import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Shield, Zap, HardDrive, Headphones, Wifi } from 'lucide-react'
import { useProductCache } from '@/contexts/ProductCacheContext'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { toast } from 'sonner'

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(price)

export default function VpsPage() {
  const { packages } = useProductCache('vps')
  const addToCheckout = useCheckoutStore(s => s.addItem)

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-purple-950 via-violet-950 to-slate-900 text-white">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white text-sm font-medium px-5 py-2.5 rounded-full mb-6">
            <Zap className="h-4 w-4" />
            Y&#252;ksek Performans &bull; NVMe SSD &bull; 10 Gbit &#304;nternet
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            VPS Sunucu
          </h1>
          <p className="text-lg md:text-xl text-purple-200 max-w-2xl mx-auto">
            Sana uygun olan VPS sunucunu se&#231; ve kirala. NVMe SSD diskler ve son teknoloji donan&#305;mlar.
          </p>
        </div>
      </section>

      {/* Table */}
      <section className="py-16">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800 text-white text-sm">
                  <th className="text-left py-4 px-5 font-semibold">Paket</th>
                  <th className="text-center py-4 px-4 font-semibold">CPU</th>
                  <th className="text-center py-4 px-4 font-semibold">RAM</th>
                  <th className="text-center py-4 px-4 font-semibold">Disk</th>
                  <th className="text-center py-4 px-4 font-semibold">Bant Geni&#351;li&#287;i</th>
                  <th className="text-center py-4 px-4 font-semibold">Fiyat</th>
                  <th className="text-center py-4 px-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg, i) => {
                  const hasDiscount = pkg.price_original && pkg.price_original > pkg.price_monthly
                  return (
                    <tr key={pkg.id || i} className={`border-t border-slate-100 hover:bg-purple-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-900">{pkg.name}</span>
                      </td>
                      <td className="text-center py-4 px-4 text-sm text-slate-600">
                        {pkg.cpu_cores} &#199;ekirdek
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="font-medium text-slate-900">{pkg.ram_gb} GB</span>
                        <span className="text-xs text-slate-500 ml-1">{pkg.ram_type || 'DDR4'}</span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="font-medium text-slate-900">{pkg.disk_gb} GB</span>
                        <span className="text-xs text-slate-500 ml-1">{pkg.disk_type || 'NVMe SSD'}</span>
                      </td>
                      <td className="text-center py-4 px-4 text-sm text-slate-600">
                        <div className="flex items-center justify-center gap-1">
                          <Wifi className="h-3.5 w-3.5" />
                          {pkg.bandwidth || '10 Gbit'}
                        </div>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className="flex flex-col items-center">
                          {hasDiscount && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="line-through text-slate-400 text-xs">{formatPrice(pkg.price_original)}&#8378;</span>
                              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">&#304;ND&#304;R&#304;M</span>
                            </div>
                          )}
                          <span className="text-lg font-bold text-slate-900">{formatPrice(pkg.price_monthly)}&#8378;</span>
                          <span className="text-[11px] text-slate-500">/ay +KDV</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4">
                        <Button size="sm" className="rounded-full px-5" onClick={() => {
                          addToCheckout({ id: pkg.id, name: pkg.name, price_monthly: pkg.price_monthly, product_type: 'vps', package_id: pkg.id })
                          toast.success('Sepete eklendi', { description: pkg.name })
                        }}>Sepete Ekle</Button>
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
      <section className="py-16 bg-slate-50">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">T&#252;m VPS Paketlerinde</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'DDoS Korumas\u0131', desc: 'Geli\u015Fmi\u015F DDoS koruma sistemi ile sunucunuz g\u00FCvende' },
              { icon: Zap, title: 'Anl\u0131k Kurulum', desc: 'Sipari\u015Finiz an\u0131nda kurulur ve kullan\u0131ma haz\u0131r' },
              { icon: HardDrive, title: 'NVMe SSD Disk', desc: 'Y\u00FCksek h\u0131zl\u0131 NVMe SSD diskler ile maksimum performans' },
              { icon: Headphones, title: '7/24 Teknik Destek', desc: 'Uzman teknik ekibimiz her zaman yan\u0131n\u0131zda' },
            ].map((f) => (
              <Card key={f.title} className="p-6 text-center border-0 shadow-sm">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-purple-100 mb-4">
                  <f.icon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
