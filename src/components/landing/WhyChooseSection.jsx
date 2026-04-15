import {
  Shield,
  Zap,
  Headphones,
  HardDrive,
  Lock,
  Globe,
  Gauge,
  RefreshCw,
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'NVMe SSD Depolama',
    description: 'Gen4 NVMe diskler ile geleneksel SSD\'ye kıyasla 5 kat daha hızlı okuma/yazma hızı.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'DDoS Koruması',
    description: 'Çok katmanlı DDoS koruma sistemi ile sunucunuz her an güvende.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Headphones,
    title: '7/24 Uzman Destek',
    description: 'Teknik destek ekibimiz 7 gün 24 saat yanınızda. Ortalama yanıt süresi 5 dakika.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Gauge,
    title: 'LiteSpeed Web Server',
    description: 'Apache\'ye göre 6x daha hızlı. HTTP/3, QUIC ve LSCache desteği.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: HardDrive,
    title: 'Günlük Yedekleme',
    description: 'Otomatik günlük yedeklemeler ile verileriniz her zaman güvende. Tek tıkla geri yükleme.',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    icon: Lock,
    title: 'Ücretsiz SSL',
    description: 'Let\'s Encrypt SSL sertifikası tüm planlarımıza dahildir. Otomatik yenileme.',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: Globe,
    title: 'Cloudflare CDN',
    description: 'Entegre CDN ağı ile içeriğinizi dünya genelinde hızlı şekilde sunun.',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: RefreshCw,
    title: 'Anlık Kurulum',
    description: 'Sipariş sonrası saniyeler içinde hosting hesabınız otomatik olarak aktif edilir.',
    gradient: 'from-fuchsia-500 to-violet-500',
  },
]

export default function WhyChooseSection() {
  return (
    <section className="relative py-24 bg-slate-900">
      {/* Gradient accent */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-indigo-500/5 rounded-full blur-[120px]" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <Shield className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-slate-300">Neden Biz?</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Altyapınız İçin En Doğru Tercih
          </h2>
          <p className="text-lg text-slate-400">
            Kurumsal düzeyde altyapı, bütçe dostu fiyatlar. Performanstan ödün vermeden büyüyün.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-slate-800/70 transition-all duration-300"
            >
              {/* Icon */}
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>

              <h3 className="font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
