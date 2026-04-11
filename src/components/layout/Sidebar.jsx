import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Globe,
  Server,
  HardDrive,
  Package,
  FileText,
  Ticket,
  Settings,
  LogOut,
  Monitor,
  Cpu,
  Search,
  TrendingUp,
  UserCog,
  CheckSquare,
  Sliders,
  FileSignature,
  Mail,
  Building,
  BookOpen,
  Megaphone,
  Wifi,
  Key,
  Wallet as WalletIcon
} from 'lucide-react'

const adminMenuItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Analiz', path: '/admin/analytics', icon: TrendingUp },
  { name: 'Müşteriler', path: '/admin/customers', icon: Users },
  { name: 'Çalışanlar', path: '/admin/employees', icon: UserCog },
  { name: 'Domain Ara', path: '/admin/domain-search', icon: Search },
  { name: 'Domainler', path: '/admin/domains', icon: Globe },
  { name: 'Hosting', path: '/admin/hosting', icon: Server },
  { name: 'Hosting Paketleri', path: '/admin/hosting-packages', icon: Package },
  { name: 'Ürün Paketleri', path: '/admin/product-packages', icon: Package },
  { name: 'VDS / VPS', path: '/admin/vds', icon: Monitor },
  { name: 'Sunucular', path: '/admin/servers', icon: HardDrive },
  { name: 'Faturalar', path: '/admin/invoices', icon: FileText },
  { name: 'Sözleşmeler', path: '/admin/contracts', icon: FileSignature },
  { name: 'Onaylar', path: '/admin/approvals', icon: CheckSquare },
  { name: 'Destek', path: '/admin/tickets', icon: Ticket },
  { name: 'E-posta Şablonları', path: '/admin/email-templates', icon: Mail },
  { name: 'Departmanlar', path: '/admin/ticket-departments', icon: Building },
  { name: 'Bilgi Bankası', path: '/admin/knowledge-base', icon: BookOpen },
  { name: 'Duyurular', path: '/admin/announcements', icon: Megaphone },
  { name: 'Sistem Ayarları', path: '/admin/system-settings', icon: Sliders },
  { name: 'Ayarlar', path: '/admin/settings', icon: Settings },
]

const employeeMenuItems = [
  { name: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
  { name: 'Müşteriler', path: '/employee/customers', icon: Users },
  { name: 'Domainler', path: '/employee/domains', icon: Globe },
  { name: 'Hosting', path: '/employee/hosting', icon: Server },
  { name: 'Faturalar', path: '/employee/invoices', icon: FileText },
  { name: 'Onay Taleplerim', path: '/employee/approvals', icon: CheckSquare },
  { name: 'Destek', path: '/employee/tickets', icon: Ticket },
]

const customerMenuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Domain Ara', path: '/domain-search', icon: Search },
  { name: 'Domainlerim', path: '/domains', icon: Globe },
  { name: 'Hostingim', path: '/hosting', icon: Server },
  { name: 'VDS / VPS', path: '/my-vds', icon: Cpu },
  { name: 'Faturalarım', path: '/invoices', icon: FileText },
  { name: 'Cüzdanım', path: '/wallet', icon: WalletIcon },
  { name: 'Destek', path: '/tickets', icon: Ticket },
  { name: 'Bilgi Bankası', path: '/knowledge-base', icon: BookOpen },
  { name: 'Ağ Durumu', path: '/network-status', icon: Wifi },
  { name: 'API Anahtarları', path: '/api-keys', icon: Key },
  { name: 'Profil', path: '/profile', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const { profile, signOut, user } = useAuth()

  // Determine menu items based on role (fallback to customer if profile not loaded)
  const role = profile?.role || 'customer'
  let menuItems = customerMenuItems
  if (role === 'admin') {
    menuItems = adminMenuItems
  } else if (role === 'employee') {
    menuItems = employeeMenuItems
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sidebar-accent flex items-center justify-center shadow-lg shadow-primary/25">
            <Server className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Luma Yazılım</h1>
            <p className="text-2xs text-sidebar-foreground">
              {role === 'admin' ? 'Admin Panel' : role === 'employee' ? 'Çalışan Paneli' : 'Müşteri Paneli'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-thin">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-sidebar-accent text-white shadow-sm shadow-primary/20'
                  : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-sidebar-foreground')} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent/20 flex items-center justify-center text-xs font-bold text-sidebar-accent flex-shrink-0">
            {(profile?.full_name || 'K')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.full_name || 'Kullanıcı'}
            </p>
            <p className="text-2xs text-sidebar-foreground truncate">
              {profile?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-foreground hover:bg-white/5 hover:text-white transition-all duration-150 w-full mt-1"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
