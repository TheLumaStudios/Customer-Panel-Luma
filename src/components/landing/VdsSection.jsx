import { useNavigate } from 'react-router-dom'
import { Cpu } from 'lucide-react'
import ServiceCard from './ServiceCard'

export default function VdsSection() {
  const navigate = useNavigate()

  const handleCtaClick = () => {
    navigate('/register')
  }

  const vdsPackages = [
    {
      title: 'VDS Starter',
      description: 'Başlangıç seviyesi sanal sunucu',
      features: [
        '4 CPU Core',
        '8 GB RAM',
        '100 GB NVMe SSD',
        'Full Root Erişim',
        '5 TB Trafik',
        'DDoS Koruması',
      ],
      price: 64.99,
    },
    {
      title: 'VDS Standard',
      description: 'Orta ölçekli projeler için ideal',
      features: [
        '6 CPU Core',
        '16 GB RAM',
        '200 GB NVMe SSD',
        'Full Root Erişim',
        '10 TB Trafik',
        'Gelişmiş DDoS Koruması',
      ],
      price: 119.99,
      badge: 'Popüler',
    },
    {
      title: 'VDS Advanced',
      description: 'Yüksek performans gerektiren uygulamalar',
      features: [
        '8 CPU Core',
        '32 GB RAM',
        '400 GB NVMe SSD',
        'Full Root Erişim',
        'Sınırsız Trafik',
        'Premium DDoS Koruması',
      ],
      price: 229.99,
    },
    {
      title: 'VDS Enterprise',
      description: 'Kurumsal çözümler için güç merkezi',
      features: [
        '16 CPU Core',
        '64 GB RAM',
        '800 GB NVMe SSD',
        'Full Root Erişim',
        'Sınırsız Trafik',
        'Yönetilen Servis',
      ],
      price: 449.99,
    },
  ]

  return (
    <section id="vds" className="py-16 md:py-24 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl font-bold mb-3">VDS Sunucular</h2>
          <p className="text-muted-foreground">
            Yüksek performans ve güvenlik gerektiren projeler için sanal dedicated server çözümleri.
          </p>
        </div>

        {/* VDS Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vdsPackages.map((pkg, index) => (
            <ServiceCard
              key={index}
              icon={Cpu}
              title={pkg.title}
              description={pkg.description}
              features={pkg.features}
              price={pkg.price}
              priceLabel="Aylık, KDV Hariç"
              badge={pkg.badge}
              onCtaClick={handleCtaClick}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
