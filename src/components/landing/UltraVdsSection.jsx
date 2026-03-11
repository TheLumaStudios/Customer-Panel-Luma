import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import ServiceCard from './ServiceCard'

export default function UltraVdsSection() {
  const navigate = useNavigate()

  const handleCtaClick = () => {
    navigate('/register')
  }

  const ultraVdsPackages = [
    {
      title: 'Ryzen 9 - Başlangıç',
      description: 'AMD Ryzen 9 9950X - Türkiye Lokasyon',
      features: [
        'AMD Ryzen 9 9950X',
        '16 GB DDR5 RAM',
        '500 GB NVMe Gen4 SSD',
        'Türkiye Veri Merkezi',
        '1 Gbps Bağlantı',
        'Gelişmiş DDoS Koruması',
      ],
      price: 299.99,
      badge: 'İNDİRİM',
    },
    {
      title: 'Ryzen 9 - Profesyonel',
      description: 'AMD Ryzen 9 5950X - Türkiye Lokasyon',
      features: [
        'AMD Ryzen 9 5950X',
        '32 GB DDR5 RAM',
        '1 TB NVMe Gen4 SSD',
        'Türkiye Veri Merkezi',
        '1 Gbps Bağlantı',
        'Premium DDoS Koruması',
      ],
      price: 499.99,
      badge: 'Popüler',
    },
    {
      title: 'Ryzen 9 - Ultra',
      description: 'AMD Ryzen 9 9950X - Türkiye Lokasyon',
      features: [
        'AMD Ryzen 9 9950X',
        '64 GB DDR5 RAM',
        '2 TB NVMe Gen4 SSD',
        'Türkiye Veri Merkezi',
        '10 Gbps Bağlantı',
        'Premium DDoS Koruması',
      ],
      price: 799.99,
    },
    {
      title: 'Ryzen 9 - Enterprise',
      description: 'AMD Ryzen 9 9950X - Türkiye Lokasyon',
      features: [
        'AMD Ryzen 9 9950X',
        '128 GB DDR5 RAM',
        '4 TB NVMe Gen4 SSD',
        'Türkiye Veri Merkezi',
        '10 Gbps Bağlantı',
        'Yönetilen Premium Servis',
      ],
      price: 1299.99,
      badge: 'Premium',
    },
  ]

  return (
    <section id="ultra-vds" className="py-16 md:py-24 bg-secondary">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl font-bold mb-3">Ultra Performans VDS</h2>
          <p className="text-muted-foreground">
            AMD Ryzen 9 9950X/5950X işlemci, DDR5 RAM ve Gen4 NVMe SSD. Türkiye lokasyonunda maksimum hız.
          </p>
        </div>

        {/* Ultra VDS Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ultraVdsPackages.map((pkg, index) => (
            <ServiceCard
              key={index}
              icon={Zap}
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
