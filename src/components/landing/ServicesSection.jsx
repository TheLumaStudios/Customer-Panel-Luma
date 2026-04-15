import { Link } from 'react-router-dom'
import {
  Server,
  HardDrive,
  Gamepad2,
  ArrowRight,
  Cpu,
  Cloud,
  MonitorSmartphone,
} from 'lucide-react'

const services = [
  {
    icon: Cloud,
    title: 'Web Hosting',
    description: 'LiteSpeed, NVMe SSD ve cPanel ile yüksek performanslı paylaşımlı hosting.',
    features: ['cPanel Kontrol Paneli', 'Ücretsiz SSL', 'Günlük Yedekleme', 'LiteSpeed Cache'],
    href: '/linux-hosting',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    price: '₺49',
  },
  {
    icon: Server,
    title: 'VPS Sunucu',
    description: 'Tam root erişimi ile esnek ve ölçeklenebilir sanal özel sunucu.',
    features: ['Full Root Erişim', 'SSD Depolama', 'Anlık Kurulum', 'Ölçeklenebilir'],
    href: '/vps',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-400',
    price: '₺199',
  },
  {
    icon: Cpu,
    title: 'VDS Sunucu',
    description: 'KVM sanallaştırma ile dedicated performans garantisi. AMD EPYC işlemciler.',
    features: ['KVM Sanallaştırma', 'AMD EPYC CPU', 'NVMe Gen4', 'DDoS Koruması'],
    href: '/vds',
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-400',
    price: '₺349',
  },
  {
    icon: HardDrive,
    title: 'Dedicated Sunucu',
    description: 'Tamamen size özel fiziksel sunucu. Maksimum performans ve kontrol.',
    features: ['Fiziksel Sunucu', 'Özel Donanım', 'IPMI Erişim', '1Gbps Port'],
    href: '/dedicated',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    price: '₺1.499',
  },
  {
    icon: Gamepad2,
    title: 'Oyun Sunucusu',
    description: 'Düşük gecikme süresi ile Minecraft, CS:GO ve daha fazlası.',
    features: ['Düşük Ping', 'DDoS Koruması', 'Mod Desteği', 'Anlık Kurulum'],
    href: '/minecraft',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
    price: '₺99',
  },
]

export default function ServicesSection() {
  return (
    <section className="relative py-24 bg-slate-950">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <MonitorSmartphone className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-slate-300">Hizmetlerimiz</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            İhtiyacınıza Uygun Çözümler
          </h2>
          <p className="text-lg text-slate-400">
            Kişisel web sitesinden kurumsal altyapıya kadar, her ölçekte güvenilir hosting çözümleri sunuyoruz.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => (
            <Link
              key={service.title}
              to={service.href}
              className="group relative bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-slate-900 transition-all duration-300"
            >
              {/* Icon */}
              <div className={`h-12 w-12 rounded-xl ${service.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className={`h-6 w-6 ${service.textColor}`} />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                {service.description}
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {service.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className={`h-1 w-1 rounded-full bg-gradient-to-r ${service.color}`} />
                    {feature}
                  </div>
                ))}
              </div>

              {/* Price & CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <span className="text-lg font-bold text-white">{service.price}</span>
                  <span className="text-xs text-slate-500">/ay'dan</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  İncele
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Hover gradient line */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${service.color} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
