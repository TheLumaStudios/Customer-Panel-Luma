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
  Cpu
} from 'lucide-react'

const adminMenuItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Müşteriler', path: '/admin/customers', icon: Users },
  { name: 'Domainler', path: '/admin/domains', icon: Globe },
  { name: 'Hosting', path: '/admin/hosting', icon: Server },
  { name: 'Hosting Paketleri', path: '/admin/hosting-packages', icon: Package },
  { name: 'VDS / VPS', path: '/admin/vds', icon: Monitor },
  { name: 'Sunucular', path: '/admin/servers', icon: HardDrive },
  { name: 'Faturalar', path: '/admin/invoices', icon: FileText },
  { name: 'Destek', path: '/admin/tickets', icon: Ticket },
  { name: 'Ayarlar', path: '/admin/settings', icon: Settings },
]

const customerMenuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Domainlerim', path: '/domains', icon: Globe },
  { name: 'Hostingim', path: '/hosting', icon: Server },
  { name: 'VDS / VPS', path: '/vds', icon: Cpu },
  { name: 'Faturalarım', path: '/invoices', icon: FileText },
  { name: 'Destek', path: '/tickets', icon: Ticket },
  { name: 'Profil', path: '/profile', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const { profile, signOut, user } = useAuth()

  // Determine menu items based on role (fallback to customer if profile not loaded)
  const isAdmin = profile?.role === 'admin'
  const menuItems = isAdmin ? adminMenuItems : customerMenuItems

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Customer Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {profile?.role === 'admin' ? 'Admin Panel' : 'Müşteri Paneli'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="mb-3 px-4">
          <p className="text-sm font-medium text-foreground truncate">
            {profile?.full_name || 'Kullanıcı'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {profile?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
