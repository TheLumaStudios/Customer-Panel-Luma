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
import TiltCard from '@/components/landing/TiltCard'
import ScrollReveal from '@/components/landing/ScrollReveal'

const services = [
  {
    icon: Cloud,
    title: 'Web Hosting',
    description: 'LiteSpeed, NVMe SSD ve cPanel ile yüksek performanslı paylaşımlı hosting.',
    features: ['cPanel Kontrol Paneli', 'Ücretsiz SSL', 'Günlük Yedekleme', 'LiteSpeed Cache'],
    href: '/linux-hosting',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    accentColor: 'text-blue-400',
    hoverBorder: 'hover:border-blue-500/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]',
    gradient: 'from-blue-500 to-cyan-500',
    price: '₺49',
  },
  {
    icon: Server,
    title: 'VPS Sunucu',
    description: 'Tam root erişimi ile esnek ve ölçeklenebilir sanal özel sunucu.',
    features: ['Full Root Erişim', 'SSD Depolama', 'Anlık Kurulum', 'Ölçeklenebilir'],
    href: '/vps',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/10 border-violet-500/20',
    accentColor: 'text-violet-400',
    hoverBorder: 'hover:border-violet-500/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]',
    gradient: 'from-violet-500 to-purple-500',
    price: '₺199',
  },
  {
    icon: Cpu,
    title: 'VDS Sunucu',
    description: 'KVM sanallaştırma ile dedicated performans garantisi. AMD EPYC işlemciler.',
    features: ['KVM Sanallaştırma', 'AMD EPYC CPU', 'NVMe Gen4', 'DDoS Koruması'],
    href: '/vds',
    iconColor: 'text-[#00f2ff]',
    iconBg: 'bg-[#00f2ff]/10 border-[#00f2ff]/20',
    accentColor: 'text-[#00f2ff]',
    hoverBorder: 'hover:border-[#00f2ff]/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(0,242,255,0.08)]',
    gradient: 'from-[#00f2ff] to-blue-500',
    price: '₺349',
    badge: '%30 İndirim',
  },
  {
    icon: HardDrive,
    title: 'Dedicated Sunucu',
    description: 'Tamamen size özel fiziksel sunucu. Maksimum performans ve kontrol.',
    features: ['Fiziksel Sunucu', 'Özel Donanım', 'IPMI Erişim', '1Gbps Port'],
    href: '/dedicated',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    accentColor: 'text-amber-400',
    hoverBorder: 'hover:border-amber-500/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.08)]',
    gradient: 'from-amber-500 to-orange-500',
    price: '₺1.499',
  },
  {
    icon: Gamepad2,
    title: 'Oyun Sunucusu',
    description: 'Düşük gecikme süresi ile Minecraft, CS:GO ve daha fazlası.',
    features: ['Düşük Ping', 'DDoS Koruması', 'Mod Desteği', 'Anlık Kurulum'],
    href: '/minecraft',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/20',
    accentColor: 'text-rose-400',
    hoverBorder: 'hover:border-rose-500/30',
    hoverGlow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.08)]',
    gradient: 'from-rose-500 to-pink-500',
    price: '₺99',
  },
]

export default function ServicesSection() {
  return (
    <section className="relative py-28">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#00f2ff]/[0.03] rounded-full blur-[120px]" />

      <div className="relative container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-[#00f2ff]/[0.08] border border-[#00f2ff]/20 rounded-full px-4 py-1.5 mb-6">
              <MonitorSmartphone className="h-4 w-4 text-[#00f2ff]" />
              <span className="text-sm font-medium text-[#00f2ff]">Hizmetlerimiz</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              İhtiyacınıza Uygun{' '}
              <span className="bg-gradient-to-r from-[#00f2ff] to-cyan-300 bg-clip-text text-transparent">
                Çözümler
              </span>
            </h2>
            <p className="text-lg text-white/40">
              Kişisel web sitesinden kurumsal altyapıya kadar, her ölçekte güvenilir hosting çözümleri.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service, i) => (
            <ScrollReveal key={service.title} delay={i * 80}>
              <TiltCard>
                <Link
                  to={service.href}
                  className={`group relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 flex flex-col ${service.hoverBorder} transition-all duration-300 ${service.hoverGlow} hover:bg-white/[0.05]`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${service.gradient} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {service.badge && (
                    <div className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20">
                      {service.badge}
                    </div>
                  )}

                  <div className={`h-12 w-12 rounded-xl ${service.iconBg} border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon className={`h-6 w-6 ${service.iconColor}`} />
                  </div>

                  <h3 className={`text-lg font-bold text-white mb-2 group-hover:${service.accentColor} transition-colors`}>
                    {service.title}
                  </h3>
                  <p className="text-sm text-white/40 mb-5 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-1.5 text-xs text-white/40">
                        <div className={`h-1 w-1 rounded-full bg-gradient-to-r ${service.gradient} shrink-0`} />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] mt-auto">
                    <div>
                      <span className="text-lg font-bold text-white">{service.price}</span>
                      <span className="text-xs text-white/30">/ay'dan</span>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${service.accentColor} opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0`}>
                      İncele
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
