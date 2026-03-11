import { useNavigate } from 'react-router-dom'
import { HardDrive } from 'lucide-react'
import ServiceCard from './ServiceCard'

export default function DedicatedSection() {
  const navigate = useNavigate()

  const handleCtaClick = () => {
    navigate('/register')
  }

  const dedicatedPackages = [
    {
      title: 'Intel Xeon E-2236',
      description: 'Başlangıç seviyesi dedicated sunucu',
      features: [
        'Intel Xeon E-2236',
        '32 GB DDR4 RAM',
        '2x 1 TB NVMe SSD',
        '100 Mbps Bağlantı',
        '480 Gbps DDoS Koruması',
        'Özel IP Adresi',
      ],
      price: 1499.99,
    },
    {
      title: 'Intel Xeon E-2288G',
      description: 'Yüksek performanslı sunucu',
      features: [
        'Intel Xeon E-2288G',
        '64 GB DDR4 RAM',
        '2x 2 TB NVMe SSD',
        '1 Gbps Bağlantı',
        '480 Gbps DDoS Koruması',
        'Yönetilen Servis',
      ],
      price: 2499.99,
      badge: 'Popüler',
    },
    {
      title: 'AMD EPYC 7502P',
      description: 'Kurumsal sınıf sunucu',
      features: [
        'AMD EPYC 7502P (32 Core)',
        '128 GB DDR4 RAM',
        '4x 2 TB NVMe SSD',
        '10 Gbps Bağlantı',
        'Premium DDoS Koruması',
        'Yönetilen Premium Servis',
      ],
      price: 4999.99,
      badge: 'Premium',
    },
    {
      title: 'Dual AMD EPYC 7763',
      description: 'Maksimum performans ve güç',
      features: [
        '2x AMD EPYC 7763 (128 Core)',
        '512 GB DDR4 RAM',
        '8x 4 TB NVMe SSD',
        '2x 10 Gbps Bağlantı',
        'Premium DDoS Koruması',
        'Tam Yönetilen Servis',
      ],
      price: 9999.99,
      badge: 'Enterprise',
    },
  ]

  return (
    <section id="dedicated" className="py-16 md:py-24 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl font-bold mb-3">Dedicated Sunucular</h2>
          <p className="text-muted-foreground">
            Kurumsal projeler için özel fiziksel sunucular. Tam kontrol, maksimum güvenlik ve performans.
          </p>
        </div>

        {/* Dedicated Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dedicatedPackages.map((pkg, index) => (
            <ServiceCard
              key={index}
              icon={HardDrive}
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
