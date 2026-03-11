import { useNavigate } from 'react-router-dom'
import { Server } from 'lucide-react'
import ServiceCard from './ServiceCard'

export default function VpsSection() {
  const navigate = useNavigate()

  const handleCtaClick = () => {
    navigate('/register')
  }

  const vpsPackages = [
    {
      title: 'VPS Starter',
      description: 'Küçük projeler ve test ortamları için',
      features: [
        '1 CPU Core',
        '2 GB RAM',
        '20 GB NVMe SSD',
        'Root Erişim',
        '1 TB Trafik',
        'Haftalık Yedekleme',
      ],
      price: 29.99,
    },
    {
      title: 'VPS Basic',
      description: 'Küçük ve orta ölçekli web siteleri',
      features: [
        '2 CPU Core',
        '4 GB RAM',
        '50 GB NVMe SSD',
        'Root Erişim',
        '2 TB Trafik',
        'Günlük Yedekleme',
      ],
      price: 49.99,
    },
    {
      title: 'VPS Professional',
      description: 'Yoğun trafikli siteler ve uygulamalar',
      features: [
        '4 CPU Core',
        '8 GB RAM',
        '100 GB NVMe SSD',
        'Root Erişim',
        '4 TB Trafik',
        'Günlük Yedekleme',
      ],
      price: 89.99,
      badge: 'Popüler',
    },
    {
      title: 'VPS Business',
      description: 'Kurumsal uygulamalar ve yüksek performans',
      features: [
        '8 CPU Core',
        '16 GB RAM',
        '200 GB NVMe SSD',
        'Root Erişim',
        'Sınırsız Trafik',
        'Anlık Yedekleme',
      ],
      price: 159.99,
    },
  ]

  return (
    <section id="vps" className="py-16 md:py-24 bg-secondary">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl font-bold mb-3">VPS Sunucular</h2>
          <p className="text-muted-foreground">
            Tam root erişimi ve izole kaynaklar ile esnek sanal sunucu çözümleri.
          </p>
        </div>

        {/* VPS Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vpsPackages.map((pkg, index) => (
            <ServiceCard
              key={index}
              icon={Server}
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
