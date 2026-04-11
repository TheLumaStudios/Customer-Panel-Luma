import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCart } from '@/contexts/CartContext'
import { useCustomerView } from '@/contexts/CustomerViewContext'
import { useExchangeRate } from '@/hooks/useCurrency'
import { convertUsdToTry } from '@/lib/api/currency'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Home,
  Search,
  Bell,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Trash2,
  Code,
  Server as ServerIcon,
  Globe,
  FileText,
  Ticket,
  Monitor,
  Users,
  TrendingUp,
  HardDrive,
  Package,
  CheckSquare,
  FileSignature,
  Mail,
  Building,
  BookOpen,
  Megaphone,
  Sliders,
  UserCog,
  Cpu,
  Wifi,
  Key,
  Cloud,
  Shield,
  Wallet as WalletIcon,
  Landmark,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { UserAvatar } from '@/components/ui/user-avatar'

// ─── Kategorize edilmiş menüler ───

const adminNav = [
  { name: 'Ana Sayfa', path: '/admin/dashboard', icon: Home },
  {
    name: 'Müşteriler',
    icon: Users,
    children: [
      { name: 'Müşteri Listesi', path: '/admin/customers', icon: Users, desc: 'Tüm müşterileri yönetin', color: 'bg-blue-100 text-blue-600' },
      { name: 'Çalışanlar', path: '/admin/employees', icon: UserCog, desc: 'Ekip üyelerini yönetin', color: 'bg-violet-100 text-violet-600' },
    ],
  },
  {
    name: 'Hizmetler',
    icon: ServerIcon,
    children: [
      { name: 'Hosting', path: '/admin/hosting', icon: ServerIcon, desc: 'Aktif hosting hesapları', color: 'bg-emerald-100 text-emerald-600' },
      { name: 'Hosting Paketleri', path: '/admin/hosting-packages', icon: Package, desc: 'cPanel paket tanımları', color: 'bg-teal-100 text-teal-600' },
      { name: 'Ürün Paketleri', path: '/admin/product-packages', icon: Package, desc: 'Fiyat ve maliyet yönetimi', color: 'bg-amber-100 text-amber-600' },
      { name: 'VDS / VPS', path: '/admin/vds', icon: Monitor, desc: 'Sanal sunucu yönetimi', color: 'bg-indigo-100 text-indigo-600' },
      { name: 'Sunucular', path: '/admin/servers', icon: HardDrive, desc: 'Fiziksel sunucu bağlantıları', color: 'bg-slate-100 text-slate-600' },
    ],
  },
  {
    name: 'Domain',
    icon: Globe,
    children: [
      { name: 'Domain Ara', path: '/admin/domain-search', icon: Search, desc: 'Yeni domain sorgula', color: 'bg-cyan-100 text-cyan-600' },
      { name: 'Domainler', path: '/admin/domains', icon: Globe, desc: 'Kayıtlı domainler', color: 'bg-sky-100 text-sky-600' },
    ],
  },
  {
    name: 'Finans',
    icon: FileText,
    children: [
      { name: 'Faturalar', path: '/admin/invoices', icon: FileText, desc: 'Fatura oluştur ve yönet', color: 'bg-orange-100 text-orange-600' },
      { name: 'Analiz', path: '/admin/analytics', icon: TrendingUp, desc: 'Gelir analizi ve raporlar', color: 'bg-rose-100 text-rose-600' },
      { name: 'Gelir Paylaşımı', path: '/admin/revenue-split', icon: TrendingUp, desc: 'Partner gelir dağılımı', color: 'bg-emerald-100 text-emerald-600' },
      { name: 'Proje Faturaları', path: '/admin/project-milestones', icon: FileText, desc: 'Milestone bazlı faturalandırma', color: 'bg-indigo-100 text-indigo-600' },
    ],
  },
  {
    name: 'Destek',
    icon: Ticket,
    children: [
      { name: 'Talepler', path: '/admin/tickets', icon: Ticket, desc: 'Destek taleplerini yönet', color: 'bg-purple-100 text-purple-600' },
      { name: 'Departmanlar', path: '/admin/ticket-departments', icon: Building, desc: 'Destek departmanları', color: 'bg-fuchsia-100 text-fuchsia-600' },
      { name: 'Bilgi Bankası', path: '/admin/knowledge-base', icon: BookOpen, desc: 'Yardım makaleleri', color: 'bg-lime-100 text-lime-600' },
      { name: 'Duyurular', path: '/admin/announcements', icon: Megaphone, desc: 'Sistem duyuruları', color: 'bg-yellow-100 text-yellow-600' },
    ],
  },
  {
    name: 'Sözleşmeler',
    icon: FileSignature,
    children: [
      { name: 'Sözleşmeler', path: '/admin/contracts', icon: FileSignature, desc: 'Sözleşme şablonları', color: 'bg-stone-100 text-stone-600' },
      { name: 'Onaylar', path: '/admin/approvals', icon: CheckSquare, desc: 'Onay bekleyen işlemler', color: 'bg-green-100 text-green-600' },
    ],
  },
  {
    name: 'Ayarlar',
    icon: Settings,
    children: [
      { name: 'Sistem Ayarları', path: '/admin/system-settings', icon: Sliders, desc: 'Otomasyon ve fiyatlandırma', color: 'bg-gray-100 text-gray-600' },
      { name: 'Banka Hesapları', path: '/admin/bank-accounts', icon: Landmark, desc: 'Müşteri havale/EFT bilgileri', color: 'bg-emerald-100 text-emerald-600' },
      { name: 'Genel Ayarlar', path: '/admin/settings', icon: Settings, desc: 'Şirket ve banka bilgileri', color: 'bg-zinc-100 text-zinc-600' },
      { name: 'E-posta Şablonları', path: '/admin/email-templates', icon: Mail, desc: 'Otomatik e-posta şablonları', color: 'bg-pink-100 text-pink-600' },
      { name: 'Cloudflare', path: '/admin/cloudflare', icon: Cloud, desc: 'DNS ve CDN yönetimi', color: 'bg-orange-100 text-orange-600' },
      { name: 'İşlem Logları', path: '/admin/audit-logs', icon: Shield, desc: 'Tüm sistem değişiklikleri', color: 'bg-red-100 text-red-600' },
    ],
  },
]

const employeeNav = [
  { name: 'Ana Sayfa', path: '/employee/dashboard', icon: Home },
  { name: 'Müşteriler', path: '/employee/customers', icon: Users },
  { name: 'Domainler', path: '/employee/domains', icon: Globe },
  { name: 'Hosting', path: '/employee/hosting', icon: ServerIcon },
  { name: 'Faturalar', path: '/employee/invoices', icon: FileText },
  { name: 'Onaylar', path: '/employee/approvals', icon: CheckSquare },
  { name: 'Destek', path: '/employee/tickets', icon: Ticket },
]

const customerNav = [
  { name: 'Ana Sayfa', path: '/dashboard', icon: Home },
  { name: 'Domain Ara', path: '/domain-search', icon: Search },
  { name: 'Domainlerim', path: '/domains', icon: Globe },
  { name: 'Hostingim', path: '/hosting', icon: ServerIcon },
  { name: 'VDS / VPS', path: '/my-vds', icon: Cpu },
  { name: 'Faturalarım', path: '/invoices', icon: FileText },
  { name: 'Cüzdanım', path: '/wallet', icon: WalletIcon },
  { name: 'Havale Bilgileri', path: '/bank-info', icon: Landmark },
  { name: 'Destek', path: '/tickets', icon: Ticket },
  {
    name: 'Diğer İşlemler',
    icon: Settings,
    children: [
      { name: 'Bilgi Bankası', path: '/knowledge-base', icon: BookOpen, desc: 'Yardım ve rehberler', color: 'bg-lime-100 text-lime-600' },
      { name: 'Ağ Durumu', path: '/network-status', icon: Wifi, desc: 'Sunucu ve servis durumları', color: 'bg-emerald-100 text-emerald-600' },
      { name: 'API Anahtarları', path: '/api-keys', icon: Key, desc: 'API erişim yönetimi', color: 'bg-amber-100 text-amber-600' },
      { name: 'Geliştirici', path: '/developer', icon: Code, desc: 'API ve deploy hooks', color: 'bg-slate-100 text-slate-600' },
      { name: 'Profil', path: '/profile', icon: Settings, desc: 'Hesap ve kişisel bilgiler', color: 'bg-blue-100 text-blue-600' },
    ],
  },
]

export default function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { cart, cartCount, cartTotal, currency, removeFromCart } = useCart()
  const { viewMode, changeView } = useCustomerView()
  const { data: exchangeRate } = useExchangeRate()
  const [searchQuery, setSearchQuery] = useState('')

  const role = profile?.role || 'customer'
  const isAdmin = role === 'admin' || role === 'employee'
  const nav = role === 'admin' ? adminNav : role === 'employee' ? employeeNav : customerNav

  const isActive = (item) => {
    if (item.path) {
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    }
    if (item.children) {
      return item.children.some(c => location.pathname === c.path || location.pathname.startsWith(c.path + '/'))
    }
    return false
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // Trigger CommandPalette açılması - Cmd+K event dispatch
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  }

  const formatPrice = (usdPrice) => {
    if (currency === 'TRY' && exchangeRate) {
      const tryPrice = parseFloat(convertUsdToTry(usdPrice, exchangeRate.sellRate))
      return `₺${(Math.ceil(tryPrice) - 0.01).toFixed(2)}`
    }
    return `$${usdPrice.toFixed(2)}`
  }

  return (
    <header className="sticky top-0 z-40 bg-card border-b">
      {/* ── Üst Satır: Logo | Arama | Avatar + İkonlar ── */}
      <div className="border-b bg-white">
        <div className="flex items-center h-16 px-6 max-w-[1600px] mx-auto gap-6">
          {/* Sol: Logo */}
          <Link to={role === 'admin' ? '/admin/dashboard' : role === 'employee' ? '/employee/dashboard' : '/dashboard'} className="flex items-center flex-shrink-0">
            <img src="/luma.png" alt="Luma" className="h-8" />
          </Link>

          {/* Orta: Arama - geniş, ortalı */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                className="pl-10 h-10 bg-muted/40 border border-border/50 rounded-xl focus-visible:ring-1 focus-visible:bg-white focus-visible:border-primary/30"
                onFocus={() => {
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
                }}
                readOnly
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Sağ: Avatar + İkon butonları yan yana */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Profil Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                  <UserAvatar name={profile?.full_name || profile?.email || 'User'} size={28} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <div className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={profile?.full_name || profile?.email || 'User'} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{profile?.full_name || 'Kullanıcı'}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <div className="px-1.5 py-1.5">
                      <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Görünüm</p>
                      <div className="flex items-center gap-1 px-2 py-1.5">
                        {[
                          { key: 'all', label: 'Tümü' },
                          { key: 'software', label: 'Yazılım', icon: Code, color: 'bg-violet-600' },
                          { key: 'host', label: 'Host', icon: ServerIcon, color: 'bg-emerald-600' },
                        ].map((v) => (
                          <button
                            key={v.key}
                            onClick={() => changeView(v.key)}
                            className={cn(
                              'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all flex-1 justify-center',
                              viewMode === v.key
                                ? v.color ? `${v.color} text-white shadow-sm` : 'bg-foreground text-white shadow-sm'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {v.icon && <v.icon className="h-3 w-3" />}
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to={role === 'admin' ? '/admin/settings' : '/profile'} className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    {role === 'admin' ? 'Ayarlar' : 'Profil'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sepet */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative h-9 w-9 flex items-center justify-center hover:bg-muted rounded-full transition-colors">
                  <ShoppingCart className="h-[18px] w-[18px] text-muted-foreground" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center p-0 text-[10px]">
                      {cartCount}
                    </Badge>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end">
                <DropdownMenuLabel>Sepetim ({cartCount})</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {cart.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Sepetiniz boş</div>
                ) : (
                  <DropdownMenuGroup className="max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <DropdownMenuItem key={item.domain} className="flex items-center justify-between p-2.5">
                        <div>
                          <p className="text-sm font-medium">{item.domain}</p>
                          <p className="text-xs text-muted-foreground">1 yıl</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">{formatPrice(item.price)}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeFromCart(item.domain) }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                )}
                {cart.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="p-2.5">
                      <div className="flex justify-between mb-2 text-sm">
                        <span>Toplam:</span>
                        <span className="font-bold">{formatPrice(cartTotal)}</span>
                      </div>
                      <Button className="w-full h-8 text-xs" onClick={() => navigate(location.pathname.startsWith('/admin') ? '/admin/domain-checkout' : '/domain-checkout')}>
                        Ödemeye Geç
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bildirimler */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative h-9 w-9 flex items-center justify-center hover:bg-muted rounded-full transition-colors">
                  <Bell className="h-[18px] w-[18px] text-muted-foreground" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end">
                <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Yeni bildirim yok
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Çıkış */}
            <button
              onClick={handleLogout}
              className="h-9 w-9 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="h-[18px] w-[18px] text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Alt Satır: Navigasyon ── */}
      <div className="bg-muted/20 border-b">
        <nav className="flex items-center justify-center gap-0 px-6 max-w-[1600px] mx-auto overflow-x-auto scrollbar-none">
          {nav.map((item) => {
            const Icon = item.icon
            const active = isActive(item)

            if (item.children) {
              return (
                <DropdownMenu key={item.name}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                        active
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                      )}
                    >
                      {item.name}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className={cn('p-2', item.children.length > 3 ? 'w-[320px]' : 'w-[280px]')}>
                    <div className="grid gap-0.5">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon
                        const childActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/')
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={cn(
                              'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/80 group',
                              childActive && 'bg-primary/5'
                            )}
                          >
                            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', child.color || 'bg-muted text-muted-foreground')}>
                              <ChildIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-medium leading-tight', childActive ? 'text-primary' : 'text-foreground group-hover:text-foreground')}>
                                {child.name}
                              </p>
                              {child.desc && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{child.desc}</p>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                )}
              >
                {item.name === 'Ana Sayfa' && <Home className="h-3.5 w-3.5" />}
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
