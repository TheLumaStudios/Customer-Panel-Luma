import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Server, Phone, Mail, User, LogIn, UserPlus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, profile } = useAuth()

  const navLinks = [
    { label: 'Ana sayfa', href: '/' },
    {
      label: 'Sunucu',
      hasDropdown: true,
      badge: 'KAMPANYA',
      badgeColor: 'bg-blue-600',
      items: [
        { label: 'VPS Sunucu', href: '/vps' },
        { label: 'VDS Sunucu', href: '/vds' },
        { label: 'Dedicated Sunucu', href: '/dedicated' },
      ]
    },
    {
      label: 'Web Hosting',
      hasDropdown: true,
      badge: 'KAMPANYA',
      badgeColor: 'bg-green-600',
      items: [
        { label: 'Linux Hosting', href: '/linux-hosting' },
        { label: 'WordPress Hosting', href: '/wordpress-hosting' },
      ]
    },
    {
      label: 'Oyun Sunucusu',
      hasDropdown: true,
      items: [
        { label: 'Minecraft', href: '/minecraft' },
        { label: 'CS:GO', href: '/csgo' },
      ]
    },
    { label: 'Alan Adı', href: '/domain' },
    {
      label: 'Kurumsal',
      hasDropdown: true,
      items: [
        { label: 'Özellikler', href: '/features' },
        { label: 'Fiyatlandırma', href: '/pricing' },
        { label: 'İletişim', href: '/contact' },
      ]
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-10 text-xs">
            {/* Left - Contact Info */}
            <div className="hidden md:flex items-center gap-6">
              <a href="tel:+908501234567" className="flex items-center gap-2 hover:text-gray-300 transition-colors">
                <Phone className="h-3 w-3" />
                <span>+90 850 123 45 67</span>
              </a>
              <a href="mailto:destek@luma.com" className="flex items-center gap-2 hover:text-gray-300 transition-colors">
                <Mail className="h-3 w-3" />
                <span>destek@luma.com</span>
              </a>
            </div>

            {/* Right - Auth Links */}
            <div className="flex items-center gap-4 ml-auto">
              {user && profile ? (
                <Link
                  to={profile.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                  className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                >
                  <User className="h-3 w-3" />
                  <span>Müşteri Paneli</span>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-1 hover:text-gray-300 transition-colors">
                    <LogIn className="h-3 w-3" />
                    <span>Giriş</span>
                  </Link>
                  <Link to="/register" className="flex items-center gap-1 hover:text-gray-300 transition-colors">
                    <UserPlus className="h-3 w-3" />
                    <span>Kayıt</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-white border-b">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Server className="h-5 w-5 text-primary-foreground" />
              </div>
              <span>Luma</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                link.hasDropdown ? (
                  <DropdownMenu key={link.label}>
                    <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-primary transition-colors outline-none">
                      {link.label}
                      <ChevronDown className="h-4 w-4" />
                      {link.badge && (
                        <Badge className={`ml-1 text-[10px] px-1.5 py-0 ${link.badgeColor} text-white border-0`}>
                          {link.badge}
                        </Badge>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {link.items.map((item) => (
                        <DropdownMenuItem key={item.label} asChild>
                          <Link to={item.href} className="w-full cursor-pointer">
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="container px-4 py-4 space-y-3 max-w-7xl mx-auto">
            {navLinks.map((link) => (
              <div key={link.label}>
                {link.hasDropdown ? (
                  <div>
                    <div className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700">
                      {link.label}
                      {link.badge && (
                        <Badge className={`text-[10px] px-1.5 py-0 ${link.badgeColor} text-white border-0`}>
                          {link.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="pl-4 space-y-2">
                      {link.items.map((item) => (
                        <Link
                          key={item.label}
                          to={item.href}
                          className="block py-1 text-sm text-gray-600 hover:text-primary transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    to={link.href}
                    className="block py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
