import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Server, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function LandingFooter() {
  const currentYear = new Date().getFullYear()

  const footerSections = {
    product: {
      title: 'Ürünler',
      links: [
        { label: 'Web Hosting', href: '/register' },
        { label: 'Cloud Hosting', href: '/register' },
        { label: 'Dedicated Servers', href: '/register' },
        { label: 'Domain Names', href: '/register' },
      ],
    },
    support: {
      title: 'Destek',
      links: [
        { label: 'Yardım Merkezi', href: '#' },
        { label: 'Bilgi Bankası', href: '#' },
        { label: 'Durum Sayfası', href: '#' },
        { label: 'Sistem Testi', href: '#' },
      ],
    },
  }

  return (
    <footer id="footer" className="bg-muted border-t">
      <div className="container px-4 sm:px-6 lg:px-8 py-12 md:py-16 max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Server className="h-5 w-5 text-primary-foreground" />
              </div>
              <span>Luma</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Yüksek performanslı altyapı ve kurumsal sınıf destek ile dijital varlığınızı en üst seviyeye taşıyın.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a href="#" className="h-9 w-9 rounded-lg bg-muted-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-lg bg-muted-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-lg bg-muted-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-lg bg-muted-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">{footerSections.product.title}</h4>
            <ul className="space-y-2">
              {footerSections.product.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">{footerSections.support.title}</h4>
            <ul className="space-y-2">
              {footerSections.support.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">İletişim</h4>
            <ul className="space-y-3">
              <li className="text-sm text-muted-foreground">
                <a href="mailto:destek@luma.com" className="hover:text-foreground transition-colors flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  destek@luma.com
                </a>
              </li>
              <li className="text-sm text-muted-foreground">
                <a href="tel:+908501234567" className="hover:text-foreground transition-colors flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +90 (850) 123 45 67
                </a>
              </li>
              <li className="text-sm text-muted-foreground flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                Maslak, İstanbul, Türkiye
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {currentYear} Luma. Tüm hakları saklıdır.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">
              Gizlilik Politikası
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Kullanım Koşulları
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Çerezler
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
