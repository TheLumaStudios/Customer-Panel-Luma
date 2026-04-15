import { Check, Shield, HardDrive, Lock, Zap, Database, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-slate-950">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* All-Flash NVMe SSD Storage */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-indigo-400 text-sm font-semibold rounded-full mb-4">
              DEPOLAMA
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Tamamen NVMe SSD Depolama</h3>
            <p className="text-slate-400 mb-6">
              Legacy SATA SSD'ler darboğaz yaratır. Altyapımız native NVMe depolama protokollerini kullanarak geleneksel hosting ortamlarından 5 kat daha hızlı yanıt süreleri sunar.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">Ağır yükler için veritabanı performansını garanti edin</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">Gen4 NVMe ile dosya işlemlerinde %400 hız artışı</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">Dedicated caching katmanları ile ultra-hız</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">Her alanda proaktif disk sağlığı izleme</span>
              </li>
            </ul>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" asChild>
              <Link to="/register">Hemen Başla</Link>
            </Button>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=800&q=80"
                alt="NVMe Storage"
                className="w-full h-[400px] object-cover"
              />
            </div>
            <div className="absolute top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
              5x Daha Hızlı
            </div>
          </div>
        </div>

        {/* Data-Driven Performance */}
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 mb-24">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-3">Veriye Dayalı Performans</h3>
            <p className="text-slate-400">
              Gerçek dünya testlerinde %42 daha hızlı yanıt süreleri. Sektör standartlarına karşı ortalama yanıt sürelerini karşılaştırın.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Chart Placeholder */}
            <div className="bg-slate-800/40 rounded-2xl p-8 border border-slate-700/50">
              <h4 className="font-semibold text-white mb-6">Yanıt Süresi Karşılaştırması</h4>
              <p className="text-xs text-slate-400 mb-4">Ortalama sunucu yanıt süresi (TTFB) testinde 6 global region</p>

              {/* Simple Bar Chart */}
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <div className="h-24 bg-indigo-600 rounded-t flex items-end justify-center pb-2">
                      <span className="text-xs font-semibold text-white">45ms</span>
                    </div>
                    <p className="text-xs text-center mt-2 text-slate-400">Hostify</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-32 bg-slate-600/30 rounded-t flex items-end justify-center pb-2">
                      <span className="text-xs font-semibold text-slate-300">78ms</span>
                    </div>
                    <p className="text-xs text-center mt-2 text-slate-400">Rakip A</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-28 bg-slate-600/30 rounded-t flex items-end justify-center pb-2">
                      <span className="text-xs font-semibold text-slate-300">65ms</span>
                    </div>
                    <p className="text-xs text-center mt-2 text-slate-400">Rakip B</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-32 bg-slate-600/30 rounded-t flex items-end justify-center pb-2">
                      <span className="text-xs font-semibold text-slate-300">82ms</span>
                    </div>
                    <p className="text-xs text-center mt-2 text-slate-400">Rakip C</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-8">
              <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="h-5 w-5 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-400">HIZIMIZ AVANTAJI</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1">%42 Daha Hızlı</div>
                <p className="text-sm text-slate-400">
                  Ortalama sayfa yükleme süresi en yakın rakibe göre %3 daha hızlı
                </p>
              </div>

              <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <Server className="h-5 w-5 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-400">24/7 UPTIME</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1">99.99%</div>
                <p className="text-sm text-slate-400">
                  Uptime SLA ile garantili Hizmet Seviyesi Anlaşması (SLA)
                </p>
              </div>

              <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="h-5 w-5 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-400">PERFORMANS</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1">12 Puan</div>
                <p className="text-sm text-slate-400">
                  GTmetrix üzerinde ortalama A skoru 6 benchmark testi
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LiteSpeed Web Server */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div className="relative order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 p-12">
              <img
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80"
                alt="LiteSpeed"
                className="w-full h-[300px] object-cover rounded-xl opacity-80"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-indigo-400 text-sm font-semibold rounded-full mb-4">
              WEB SERVER
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">LiteSpeed Web Server Entegrasyonu</h3>
            <p className="text-slate-400 mb-6">
              Hostify, sektörün önde gelen yüksek performanslı web sunucusu LiteSpeed'i kullanır. WordPress, Magento ve Drupal gibi popüler platformlarla maksimum trafik yüklerini kolayca yönetir.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">WordPress, Magento ve Drupal için LS Cache</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">Anında HTTP/2 ve QUIC desteği</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">Otomatik görsel optimizasyonu ve sıkıştırma</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">PHP 8 ve statik içerik için verimli önbellek</span>
              </li>
            </ul>
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:border-indigo-500/30" asChild>
              <Link to="#pricing">Daha Fazla Bilgi</Link>
            </Button>
          </div>
        </div>

        {/* Reliable by Design */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-indigo-400 text-sm font-semibold rounded-full mb-4">
              GÜVENİLİRLİK
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">Tasarımdan Güvenilir</h3>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Platformumuz günlük yedeklemelerden DDoS korumasına kadar, sitenizin güvenliğini en öncelikli konumuzda tutar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/30 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-indigo-400" />
              </div>
              <h4 className="font-bold text-white mb-2">DDoS Koruması</h4>
              <p className="text-sm text-slate-400">
                Ağınızı ve hosting'inizi çevrimiçi saldırılara karşı korumak için çok katmanlı savunma kullanıyoruz.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/30 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <HardDrive className="h-6 w-6 text-indigo-400" />
              </div>
              <h4 className="font-bold text-white mb-2">Otomatik Yedekleme</h4>
              <p className="text-sm text-slate-400">
                Günlük otomatik yedeklemeler her zaman dashboard'unuzdan geri yükleme seçeneği sunar.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/30 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-indigo-400" />
              </div>
              <h4 className="font-bold text-white mb-2">Anycast DNS</h4>
              <p className="text-sm text-slate-400">
                Global CDN ağımız sitenizi hızlı, güvenilir ve dağıtık DNS name serverları ile teslim eder.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/30 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-indigo-400" />
              </div>
              <h4 className="font-bold text-white mb-2">Ücretsiz SSL</h4>
              <p className="text-sm text-slate-400">
                Let's Encrypt SSL ile otomatik olarak tüm verilerinizi şifreleyip güvenli hale getirin.
              </p>
            </div>
          </div>
        </div>

        {/* Tech Stack Comparison */}
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-800">
          <div className="mb-8">
            <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-indigo-400 text-sm font-semibold rounded-full mb-4">
              TEKNOLOJİ YIĞINI
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">Stack Neden Önemli</h3>
            <p className="text-slate-400">
              Hosting %99.9 uptime süresi sunar, ama gerçek başarı sizin ne kadar hızlı büyüdüğünüzdür. Altyapımız performans üzerine kurulmuştur.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-bold mb-4 text-indigo-400">COMPUTE POWER</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Architecture</span>
                  <span className="font-medium text-slate-300">Intel Lake / AMD EPYC</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Base Speed</span>
                  <span className="font-medium text-slate-300">3.5Ghz+</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Isolation</span>
                  <span className="font-medium text-slate-300">CloudLinux LVE</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-indigo-400">DATA ACCESS</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Storage Tier</span>
                  <span className="font-medium text-slate-300">NVMe Gen 4</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">IOPS</span>
                  <span className="font-medium text-slate-300">Up to 1000 MB/s</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="font-medium text-slate-300">MariaDB / PostgreSQL</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-indigo-400">CONNECTIVITY</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Bandwidth</span>
                  <span className="font-medium text-slate-300">Sınırsız</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">CDN</span>
                  <span className="font-medium text-slate-300">Cloudflare</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">HTTP Protocol</span>
                  <span className="font-medium text-slate-300">HTTP/3 (QUIC)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400 mb-4">
              Farkı deneyimlemek için hazır mısınız?<br />
              Tüm özelliklerimiz Hostify'a dahildir.
            </p>
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white" asChild>
              <Link to="/register">Ücretsiz Başla</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
