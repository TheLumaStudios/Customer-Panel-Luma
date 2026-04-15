import { MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalPresence() {
  const offices = [
    {
      city: 'San Francisco',
      country: 'United States',
      address: '456 Silicon Valley Blvd, Suite 100, San Francisco, CA 94107',
      phone: '+1 (555) 123-4567',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80',
      badge: 'NORTH AMERICA HQ',
    },
    {
      city: 'London',
      country: 'United Kingdom',
      address: '22 Bishopsgate, Level 16, London EC2N 4BQ, United Kingdom',
      phone: '+44 20 7946 0123',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
      badge: 'EMEA HQ (EUROPE)',
    },
    {
      city: 'Singapore',
      country: 'Singapore',
      address: '10 Marina Boulevard, Tower 2, Singapore 018983',
      phone: '+65 6789 1234',
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80',
      badge: 'APAC HQ (ASIA)',
    },
  ]

  return (
    <section className="py-24 bg-slate-900">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Global Presence</h2>
            <p className="text-slate-400 max-w-2xl">
              Visit one of our innovation hubs across the world. We combine global reach with local expertise to keep you connected.
            </p>
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:border-indigo-500/30">View All Locations</Button>
        </div>

        {/* Office Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {offices.map((office, index) => (
            <div
              key={index}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/30 hover:shadow-lg transition-all group"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={office.image}
                  alt={office.city}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <div className="bg-white/5 border border-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white">
                    {office.badge}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1">{office.city}</h3>
                <p className="text-sm text-slate-400 mb-4">{office.country}</p>

                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-400">{office.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                    <a
                      href={`tel:${office.phone}`}
                      className="text-indigo-400 hover:underline font-medium"
                    >
                      {office.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
