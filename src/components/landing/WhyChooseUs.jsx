import { Shield, Clock, Award, Users, Headphones, Zap } from 'lucide-react'

export default function WhyChooseUs() {
  const reasons = [
    {
      icon: Shield,
      title: 'Güvenlik Önceliğimiz',
      description: 'Gelişmiş DDoS koruması, otomatik günlük yedekleme ve SSL sertifikası ile verileriniz her zaman güvende.',
      features: ['480 Gbps DDoS Koruması', 'Günlük Otomatik Yedekleme', 'Ücretsiz SSL Sertifikası']
    },
    {
      icon: Clock,
      title: '%99.9 Uptime Garantisi',
      description: 'Tier-3 veri merkezlerimiz ve yedekli altyapımız sayesinde kesintisiz hizmet sunuyoruz.',
      features: ['Tier-3 Veri Merkezi', 'Yedekli Altyapı', 'SLA Garantisi']
    },
    {
      icon: Zap,
      title: 'Yüksek Performans',
      description: 'NVMe SSD diskler, LiteSpeed web server ve CloudLinux işletim sistemi ile maksimum hız.',
      features: ['NVMe SSD Diskler', 'LiteSpeed Web Server', 'CloudLinux OS']
    },
    {
      icon: Headphones,
      title: '7/24 Canlı Destek',
      description: 'Deneyimli teknik ekibimiz her an yanınızda. Canlı destek, telefon ve ticket sistemi ile ulaşın.',
      features: ['Canlı Destek', 'Telefon Desteği', 'Ticket Sistemi']
    },
    {
      icon: Award,
      title: 'Profesyonel Çözümler',
      description: '10 yılı aşkın sektör deneyimi ile kurumsal ve bireysel ihtiyaçlarınıza özel çözümler.',
      features: ['Kurumsal Çözümler', 'Özel Projeler', 'Danışmanlık']
    },
    {
      icon: Users,
      title: 'Müşteri Memnuniyeti',
      description: '25.000+ aktif müşterimizin güvenini kazandık. Müşteri memnuniyeti oranımız %98.',
      features: ['25K+ Müşteri', '%98 Memnuniyet', 'Referans Programı']
    },
  ]

  return (
    <section className="py-24 bg-muted">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Neden Bizi Tercih Etmelisiniz?</h2>
          <p className="text-lg text-muted-foreground">
            Sektörde 10 yılı aşkın deneyimimiz ve 25.000+ mutlu müşterimizle güvenilir çözüm ortağınızız.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon
            return (
              <div key={index} className="bg-card p-8 rounded-lg border hover:border-primary hover:shadow-lg transition-all">
                <div className="mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{reason.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {reason.description}
                </p>
                <ul className="space-y-2">
                  {reason.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
