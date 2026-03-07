import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Users,
  Globe,
  Server,
  FileText,
  Ticket,
  Settings,
  Plus,
  Search,
  Cpu,
  Package,
  HardDrive,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCustomers } from '@/hooks/useCustomers'
import { useInvoices } from '@/hooks/useInvoices'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: customers } = useCustomers()
  const { data: invoices } = useInvoices()

  const isAdmin = profile?.role === 'admin'

  // Keyboard shortcut
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = useCallback((callback) => {
    setOpen(false)
    callback()
  }, [])

  // Navigation items
  const adminPages = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Müşteriler', path: '/admin/customers' },
    { icon: Search, label: 'Domain Ara', path: '/admin/domain-search' },
    { icon: Globe, label: 'Domainler', path: '/admin/domains' },
    { icon: Server, label: 'Hosting', path: '/admin/hosting' },
    { icon: Package, label: 'Hosting Paketleri', path: '/admin/hosting-packages' },
    { icon: Cpu, label: 'VDS / VPS', path: '/admin/vds' },
    { icon: HardDrive, label: 'Sunucular', path: '/admin/servers' },
    { icon: FileText, label: 'Faturalar', path: '/admin/invoices' },
    { icon: Ticket, label: 'Destek', path: '/admin/tickets' },
    { icon: Settings, label: 'Ayarlar', path: '/admin/settings' },
  ]

  const customerPages = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Search, label: 'Domain Ara', path: '/domain-search' },
    { icon: Globe, label: 'Domainlerim', path: '/domains' },
    { icon: Server, label: 'Hostingim', path: '/hosting' },
    { icon: Cpu, label: 'VDS / VPS', path: '/vds' },
    { icon: FileText, label: 'Faturalarım', path: '/invoices' },
    { icon: Ticket, label: 'Destek', path: '/tickets' },
    { icon: Settings, label: 'Profil', path: '/profile' },
  ]

  const pages = isAdmin ? adminPages : customerPages

  // Quick actions
  const adminActions = [
    { icon: Plus, label: 'Yeni Müşteri', path: '/admin/customers', action: 'create' },
    { icon: Plus, label: 'Yeni Fatura', path: '/admin/invoices', action: 'create' },
    { icon: Plus, label: 'Yeni Domain', path: '/admin/domains', action: 'create' },
    { icon: Plus, label: 'Yeni Hosting', path: '/admin/hosting', action: 'create' },
    { icon: Plus, label: 'Yeni VDS', path: '/admin/vds', action: 'create' },
  ]

  const customerActions = [
    { icon: Plus, label: 'Yeni Destek Talebi', path: '/tickets', action: 'create' },
  ]

  const actions = isAdmin ? adminActions : customerActions

  // Filter customers
  const filteredCustomers = customers?.filter(c =>
    search && (
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_code?.toLowerCase().includes(search.toLowerCase())
    )
  ).slice(0, 5) || []

  // Filter invoices
  const filteredInvoices = invoices?.filter(inv =>
    search && (
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase())
    )
  ).slice(0, 5) || []

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Ara... (Sayfalar, müşteriler, faturalar)"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>

        {!search && (
          <>
            <CommandGroup heading="Quick Actions">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <CommandItem
                    key={action.label}
                    onSelect={() => handleSelect(() => navigate(action.path))}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{action.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Sayfalar">
          {pages
            .filter(page => !search || page.label.toLowerCase().includes(search.toLowerCase()))
            .map((page) => {
              const Icon = page.icon
              return (
                <CommandItem
                  key={page.path}
                  onSelect={() => handleSelect(() => navigate(page.path))}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{page.label}</span>
                </CommandItem>
              )
            })}
        </CommandGroup>

        {isAdmin && filteredCustomers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Müşteriler">
              {filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  onSelect={() => handleSelect(() => navigate(`/admin/customers/${customer.id}`))}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{customer.full_name || customer.email}</span>
                    <span className="text-xs text-muted-foreground">{customer.customer_code}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {isAdmin && filteredInvoices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Faturalar">
              {filteredInvoices.map((invoice) => (
                <CommandItem
                  key={invoice.id}
                  onSelect={() => handleSelect(() => navigate(`/admin/invoices`))}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{invoice.invoice_number}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
