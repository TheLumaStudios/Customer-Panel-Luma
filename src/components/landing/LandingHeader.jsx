import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Menu, X, User, ChevronDown, ChevronRight,
  Server, Cpu, HardDrive, Cloud, Layers,
  Shield, Gamepad2, Zap, ArrowRight,
  MonitorSmartphone, Rocket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth.jsx'
import { Badge } from '@/components/ui/badge'
import CartDropdown from '@/components/landing/CartDropdown'

const megaMenus = {
  sunucu: {
    label: 'Sunucu',
    badge: 'KAMPANYA',
    sections: [
      {
        title: 'Sanal Sunucu',
        items: [
          {
            label: 'VPS Sunucu',
            href: '/vps',
            desc: 'Esnek ve ölçeklenebilir sanal özel sunucu',
            icon: Server,
            color: 'text-violet-400',
            bgColor: 'bg-violet-500/15',
            price: '₺199/ay',
          },
          {
            label: 'VDS Sunucu',
            href: '/vds',
            desc: 'KVM sanallaştırma ile dedicated performans',
            icon: Cpu,
            color: 'text-indigo-400',
            bgColor: 'bg-indigo-500/15',
            tag: '%30 İndirim',
            tagColor: 'bg-emerald-500',
            price: '₺349/ay',
          },
        ],
      },
      {
        title: 'Fiziksel Sunucu',
        items: [
          {
            label: 'Dedicated Sunucu',
            href: '/dedicated',
            desc: 'Tamamen size özel fiziksel donanım',
            icon: HardDrive,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/15',
            price: '₺1.499/ay',
          },
        ],
      },
    ],
    highlight: {
      title: 'VDS Kampanyası',
      desc: 'AMD EPYC işlemcili VDS sunucularında %30 indirim fırsatını kaçırmayın.',
      href: '/vds',
    },
  },
  hosting: {
    label: 'Web Hosting',
    sections: [
      {
        title: 'Hosting Paketleri',
        items: [
          {
            label: 'Linux Hosting',
            href: '/linux-hosting',
            desc: 'cPanel & LiteSpeed ile yüksek performans',
            icon: Cloud,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/15',
            tag: 'En Çok Tercih',
            price: '₺49/ay',
          },
          {
            label: 'WordPress Hosting',
            href: '/wordpress-hosting',
            desc: 'WordPress için optimize edilmiş altyapı',
            icon: Layers,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/15',
            price: '₺69/ay',
          },
          {
            label: 'Plesk Hosting',
            href: '/plesk-hosting',
            desc: 'Plesk panel ile kolay yönetim',
            icon: MonitorSmartphone,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/15',
            price: '₺59/ay',
          },
          {
            label: 'Reseller Hosting',
            href: '/reseller-hosting',
            desc: 'Kendi hosting işinizi kurun',
            icon: Rocket,
            color: 'text-fuchsia-400',
            bgColor: 'bg-fuchsia-500/15',
            price: '₺149/ay',
          },
        ],
      },
    ],
    highlight: {
      title: 'Neden LiteSpeed?',
      desc: "Apache'ye göre 6x daha hızlı. HTTP/3, QUIC ve LSCache dahil.",
      href: '/linux-hosting',
    },
  },
  oyun: {
    label: 'Oyun Sunucusu',
    sections: [
      {
        title: 'Oyun Sunucuları',
        items: [
          {
            label: 'Minecraft Sunucu',
            href: '/minecraft',
            desc: 'Düşük ping, mod desteği, anlık kurulum',
            icon: Gamepad2,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/15',
            tag: 'Popüler',
            price: '₺99/ay',
          },
          {
            label: 'CS:GO / CS2 Sunucu',
            href: '/csgo',
            desc: '128 tick, DDoS koruması, rekabetçi altyapı',
            icon: Shield,
            color: 'text-rose-400',
            bgColor: 'bg-rose-500/15',
            price: '₺129/ay',
          },
        ],
      },
    ],
  },
}

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const menuTimeoutRef = useRef(null)
  const { user, profile } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setActiveMenu(null)
    setMobileMenuOpen(false)
  }, [location.pathname])

  const isHome = location.pathname === '/'

  const handleMenuEnter = (key) => {
    clearTimeout(menuTimeoutRef.current)
    setActiveMenu(key)
  }

  const handleMenuLeave = () => {
    menuTimeoutRef.current = setTimeout(() => setActiveMenu(null), 200)
  }

  const headerBg = scrolled
    ? 'bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 shadow-lg shadow-black/20'
    : 'bg-slate-950/70 backdrop-blur-md'

  const textColor = 'text-slate-200'

  const logoSrc = '/lumawhite.png'

  const simpleLinks = [
    { label: 'Fiyatlandırma', href: '/pricing' },
    { label: 'İletişim', href: '/contact' },
  ]

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${headerBg}`}>
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex h-16 lg:h-18 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logoSrc} alt="Luma" className="h-7 transition-all" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {Object.entries(megaMenus).map(([key, menu]) => (
              <div
                key={key}
                className="relative"
                onMouseEnter={() => handleMenuEnter(key)}
                onMouseLeave={handleMenuLeave}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium ${textColor} hover:text-primary transition-colors outline-none rounded-lg hover:bg-black/5`}
                >
                  {menu.label}
                  <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition-transform duration-200 ${activeMenu === key ? 'rotate-180' : ''}`} />
                  {menu.badge && (
                    <Badge className="ml-1 text-[9px] px-1.5 py-0 bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
                      {menu.badge}
                    </Badge>
                  )}
                </button>

                {/* Dropdown */}
                {activeMenu === key && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50"
                    onMouseEnter={() => handleMenuEnter(key)}
                    onMouseLeave={handleMenuLeave}
                  >
                    <div className="bg-slate-900 rounded-2xl border border-slate-700/60 shadow-2xl shadow-black/40 overflow-hidden animate-fade-in min-w-[580px]">
                      <div className="flex">
                        {/* Items */}
                        <div className="flex-1 p-5 space-y-5">
                          {menu.sections.map((section) => (
                            <div key={section.title}>
                              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                                {section.title}
                              </div>
                              <div className="space-y-1">
                                {section.items.map((item) => (
                                  <Link
                                    key={item.label}
                                    to={item.href}
                                    className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-slate-800/80 transition-colors group"
                                  >
                                    <div className={`h-10 w-10 rounded-lg ${item.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                      <item.icon className={`h-5 w-5 ${item.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-100 group-hover:text-indigo-400 transition-colors">
                                          {item.label}
                                        </span>
                                        {item.tag && (
                                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${item.tagColor || 'bg-indigo-500'} text-white leading-none`}>
                                            {item.tag}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-xs text-slate-400">{item.desc}</span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0 pl-3">
                                      <div className="text-xs font-semibold text-slate-300">{item.price}</div>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Highlight */}
                        {menu.highlight && (
                          <div className="w-52 border-l border-slate-700/60 bg-slate-800/50 p-5 flex flex-col justify-between">
                            <div>
                              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4">
                                <Zap className="h-4 w-4 text-white" />
                              </div>
                              <div className="text-sm font-semibold text-slate-100 mb-2">{menu.highlight.title}</div>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {menu.highlight.desc}
                              </p>
                            </div>
                            <Link
                              to={menu.highlight.href}
                              className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              Detayları gör
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {simpleLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`px-3 py-2 text-sm font-medium ${textColor} hover:text-primary transition-colors rounded-lg hover:bg-black/5`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <CartDropdown />
            {user && profile ? (
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500" asChild>
                <Link to={profile.role === 'admin' ? '/admin/dashboard' : '/dashboard'}>
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Panel
                </Link>
              </Button>
            ) : (
              <>
                <Button size="sm" variant="ghost" className={`hidden sm:inline-flex ${textColor} hover:text-foreground`} asChild>
                  <Link to="/login">Giriş Yap</Link>
                </Button>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 shadow-sm" asChild>
                  <Link to="/register">Kayıt Ol</Link>
                </Button>
              </>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg ${textColor}`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-950 border-t border-border max-h-[80vh] overflow-y-auto">
          <div className="container px-4 py-4 space-y-1 max-w-7xl mx-auto">
            {Object.entries(megaMenus).map(([key, menu]) => (
              <div key={key}>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === key ? null : key)}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {menu.label}
                    {menu.badge && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
                        {menu.badge}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${mobileExpanded === key ? 'rotate-180' : ''}`} />
                </button>

                {mobileExpanded === key && (
                  <div className="pl-2 pb-2 space-y-0.5 animate-fade-in">
                    {menu.sections.flatMap(s => s.items).map((item) => (
                      <Link
                        key={item.label}
                        to={item.href}
                        className="flex items-center gap-3 px-3 py-3 text-sm text-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className={`h-9 w-9 rounded-lg ${item.bgColor} flex items-center justify-center shrink-0`}>
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.label}</span>
                            {item.tag && (
                              <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${item.tagColor || 'bg-indigo-500'} text-white leading-none`}>
                                {item.tag}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{item.price}'dan</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {simpleLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="block px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
