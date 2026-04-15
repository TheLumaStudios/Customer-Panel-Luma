import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Server } from 'lucide-react'

export default function LandingFooter() {
  const currentYear = new Date().getFullYear()

  const sections = [
    {
      title: 'Hosting',
      links: [
        { label: 'Linux Hosting', href: '/linux-hosting' },
        { label: 'WordPress Hosting', href: '/wordpress-hosting' },
        { label: 'Plesk Hosting', href: '/plesk-hosting' },
        { label: 'Reseller Hosting', href: '/reseller-hosting' },
      ],
    },
    {
      title: 'Sunucu',
      links: [
        { label: 'VPS Sunucu', href: '/vps' },
        { label: 'VDS Sunucu', href: '/vds' },
        { label: 'Dedicated Sunucu', href: '/dedicated' },
        { label: 'Oyun Sunucusu', href: '/minecraft' },
      ],
    },
    {
      title: 'Kurumsal',
      links: [
        { label: 'Hakkımızda', href: '/about' },
        { label: 'Fiyatlandırma', href: '/pricing' },
        { label: 'İletişim', href: '/contact' },
        { label: 'Teslimat & İade', href: '/delivery-return' },
      ],
    },
  ]

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="container px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Server className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Luma</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
              Yüksek performanslı altyapı ve kurumsal destek ile dijital varlığınızı güçlendirin.
            </p>
            <div className="space-y-2.5" id="iletisim">
              <div className="text-sm text-slate-400">
                <strong className="text-slate-300">Yetkili:</strong> Enes POYRAZ
              </div>
              <a href="mailto:info@lumayazilim.com" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                <Mail className="h-4 w-4" />
                info@lumayazilim.com
              </a>
              <a href="tel:+905449796257" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                <Phone className="h-4 w-4" />
                0544 979 62 57
              </a>
              <div className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                Üçevler Mah. Dumlupınar Cd. No:5/A Nilüfer/Bursa
              </div>
            </div>
          </div>

          {/* Link sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-white mb-4 text-sm">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Logos */}
        <div className="flex items-center justify-center gap-6 pb-8 border-b border-slate-800 mb-8">
          <img src="/kart-logolari.png" alt="Mastercard, Visa, American Express, Troy" className="h-7 w-auto opacity-60 hover:opacity-90 transition-opacity" />
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5 opacity-60">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
            <span className="text-xs text-slate-500">SSL Korumalı Ödeme</span>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {currentYear} Luma. Tüm hakları saklıdır.
          </p>
          <div className="flex flex-wrap gap-4 md:gap-6 text-sm text-slate-500">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Gizlilik</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Kullanım Koşulları</Link>
            <Link to="/kvkk" className="hover:text-slate-300 transition-colors">KVKK</Link>
            <Link to="/distance-sales" className="hover:text-slate-300 transition-colors">Mesafeli Satış</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
