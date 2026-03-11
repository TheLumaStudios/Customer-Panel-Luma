import { useNavigate } from 'react-router-dom'
import { Server } from 'lucide-react'
import { usePublicHostingPackages } from '@/hooks/usePublicHostingPackages'
import ServiceCard from './ServiceCard'

export default function HostingSection() {
  const navigate = useNavigate()
  const { data: hostingPackages, isLoading, error } = usePublicHostingPackages()

  const handleCtaClick = () => {
    navigate('/register')
  }

  return (
    <section id="hosting" className="py-16 md:py-24 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl font-bold mb-3">Web Hosting</h2>
          <p className="text-muted-foreground">
            Her ölçekten web projesi için uygun maliyetli ve performanslı hosting çözümleri.
          </p>
        </div>

        {/* Hosting Packages Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-96 bg-card rounded-lg border animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Paketler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Hosting Packages from Database */}
            {hostingPackages?.map((pkg) => {
              const features = []

              if (pkg.disk_space_gb === 0 || pkg.disk_space_gb > 0) {
                features.push(
                  pkg.disk_space_gb === 0
                    ? 'Sınırsız Disk Alanı'
                    : `${pkg.disk_space_gb} GB Disk Alanı`
                )
              }

              if (pkg.bandwidth_gb === -1) {
                features.push('Sınırsız Trafik')
              } else if (pkg.bandwidth_gb > 0) {
                features.push(`${pkg.bandwidth_gb} GB Trafik`)
              }

              if (pkg.email_accounts) {
                features.push(
                  pkg.email_accounts === -1
                    ? 'Sınırsız E-posta'
                    : `${pkg.email_accounts} E-posta Hesabı`
                )
              }

              if (pkg.databases) {
                features.push(
                  pkg.databases === -1
                    ? 'Sınırsız Veritabanı'
                    : `${pkg.databases} Veritabanı`
                )
              }

              if (pkg.ssl_certificate) {
                features.push('Ücretsiz SSL Sertifikası')
              }

              features.push('cPanel Kontrol Paneli')
              features.push('7/24 Teknik Destek')

              return (
                <ServiceCard
                  key={pkg.id}
                  icon={Server}
                  title={pkg.package_name}
                  description={pkg.description}
                  features={features}
                  price={pkg.monthly_price}
                  priceLabel="Aylık, KDV Hariç"
                  onCtaClick={handleCtaClick}
                />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
