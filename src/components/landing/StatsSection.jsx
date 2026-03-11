export default function StatsSection() {
  const stats = [
    { number: '10+', label: 'Yıllık Deneyim' },
    { number: '25K+', label: 'Aktif Müşteri' },
    { number: '%99.9', label: 'Uptime Garantisi' },
    { number: '7/24', label: 'Teknik Destek' },
  ]

  return (
    <section className="py-16 bg-primary">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-sm lg:text-base text-white/90">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
