import { useEffect, useState, useCallback, useRef } from 'react'
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
  Clock,
  Key,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth.jsx'
import { supabase } from '@/lib/supabase'

const RECENT_ITEMS_KEY = 'command_palette_recent'
const MAX_RECENT = 5

function getRecentItems() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_ITEMS_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecentItem(item) {
  const recent = getRecentItems().filter(r => r.path !== item.path)
  recent.unshift({ label: item.label, path: item.path, type: item.type || 'page' })
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searchResults, setSearchResults] = useState({
    customers: [],
    invoices: [],
    tickets: [],
    domains: [],
    hosting: [],
  })
  const [searching, setSearching] = useState(false)
  const [recentItems, setRecentItems] = useState([])
  const navigate = useNavigate()
  const { profile } = useAuth()
  const debounceRef = useRef(null)

  const isAdmin = profile?.role === 'admin'

  // Load recent items when opening
  useEffect(() => {
    if (open) {
      setRecentItems(getRecentItems())
    }
  }, [open])

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

  // Debounced search (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!search || search.length < 2) {
      setDebouncedSearch('')
      setSearchResults({ customers: [], invoices: [], tickets: [], domains: [], hosting: [] })
      return
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  // Execute search when debounced value changes
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return

    const performSearch = async () => {
      setSearching(true)
      try {
        const term = `%${debouncedSearch}%`
        const queries = []

        // Search customers (admin only)
        if (isAdmin) {
          queries.push(
            supabase
              .from('customers')
              .select('id, full_name, email, customer_code')
              .or(`full_name.ilike.${term},email.ilike.${term},customer_code.ilike.${term}`)
              .limit(5)
          )
        } else {
          queries.push(Promise.resolve({ data: [] }))
        }

        // Search invoices
        queries.push(
          supabase
            .from('invoices')
            .select('id, invoice_number, status, total')
            .ilike('invoice_number', term)
            .limit(5)
        )

        // Search tickets
        queries.push(
          supabase
            .from('tickets')
            .select('id, subject, status')
            .ilike('subject', term)
            .limit(5)
        )

        // Search domains
        queries.push(
          supabase
            .from('domains')
            .select('id, domain_name, status')
            .ilike('domain_name', term)
            .limit(5)
        )

        // Search hosting
        queries.push(
          supabase
            .from('hosting')
            .select('id, domain, package_name, status')
            .or(`domain.ilike.${term},package_name.ilike.${term}`)
            .limit(5)
        )

        const [customersRes, invoicesRes, ticketsRes, domainsRes, hostingRes] = await Promise.all(queries)

        setSearchResults({
          customers: customersRes.data || [],
          invoices: invoicesRes.data || [],
          tickets: ticketsRes.data || [],
          domains: domainsRes.data || [],
          hosting: hostingRes.data || [],
        })
      } catch (err) {
        console.error('Command palette search error:', err)
      } finally {
        setSearching(false)
      }
    }

    performSearch()
  }, [debouncedSearch, isAdmin])

  const handleSelect = useCallback((item) => {
    setOpen(false)
    setSearch('')
    if (item.label && item.path) {
      addRecentItem(item)
    }
    navigate(item.path)
  }, [navigate])

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
    { icon: Cpu, label: 'VDS / VPS', path: '/my-vds' },
    { icon: FileText, label: 'Faturalarım', path: '/invoices' },
    { icon: Ticket, label: 'Destek', path: '/tickets' },
    { icon: Key, label: 'API Anahtarları', path: '/api-keys' },
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

  const hasSearchResults =
    searchResults.customers.length > 0 ||
    searchResults.invoices.length > 0 ||
    searchResults.tickets.length > 0 ||
    searchResults.domains.length > 0 ||
    searchResults.hosting.length > 0

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Ara... (Sayfalar, müşteriler, faturalar, domainler)"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {searching ? 'Aranıyor...' : 'Sonuç bulunamadı.'}
        </CommandEmpty>

        {/* Recent Items */}
        {!search && recentItems.length > 0 && (
          <>
            <CommandGroup heading="Son Ziyaret Edilenler">
              {recentItems.map((item, idx) => (
                <CommandItem
                  key={`recent-${idx}`}
                  onSelect={() => handleSelect(item)}
                >
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">{item.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {!search && (
          <>
            <CommandGroup heading="Hızlı İşlemler">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <CommandItem
                    key={action.label}
                    onSelect={() => handleSelect(action)}
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
                  onSelect={() => handleSelect(page)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{page.label}</span>
                </CommandItem>
              )
            })}
        </CommandGroup>

        {/* Search Results - Customers */}
        {isAdmin && searchResults.customers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Müşteriler">
              {searchResults.customers.map((customer) => (
                <CommandItem
                  key={`c-${customer.id}`}
                  onSelect={() => handleSelect({
                    label: customer.full_name || customer.email,
                    path: `/admin/customers/${customer.id}`,
                    type: 'musteri'
                  })}
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

        {/* Search Results - Invoices */}
        {searchResults.invoices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Faturalar">
              {searchResults.invoices.map((invoice) => (
                <CommandItem
                  key={`i-${invoice.id}`}
                  onSelect={() => handleSelect({
                    label: invoice.invoice_number,
                    path: isAdmin ? `/admin/invoice/${invoice.id}` : `/invoice/${invoice.id}`,
                    type: 'fatura'
                  })}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{invoice.invoice_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {invoice.status === 'paid' ? 'Ödendi' : invoice.status === 'overdue' ? 'Gecikti' : 'Bekliyor'}
                      {invoice.total ? ` - ₺${invoice.total.toFixed(2)}` : ''}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search Results - Tickets */}
        {searchResults.tickets.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Destek Talepleri">
              {searchResults.tickets.map((ticket) => (
                <CommandItem
                  key={`t-${ticket.id}`}
                  onSelect={() => handleSelect({
                    label: ticket.subject,
                    path: isAdmin ? `/admin/tickets` : `/tickets`,
                    type: 'destek'
                  })}
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{ticket.subject}</span>
                    <span className="text-xs text-muted-foreground capitalize">{ticket.status}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search Results - Domains */}
        {searchResults.domains.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Domainler">
              {searchResults.domains.map((domain) => (
                <CommandItem
                  key={`d-${domain.id}`}
                  onSelect={() => handleSelect({
                    label: domain.domain_name,
                    path: isAdmin ? `/admin/domains` : `/domains`,
                    type: 'domain'
                  })}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{domain.domain_name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{domain.status}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search Results - Hosting */}
        {searchResults.hosting.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Hosting">
              {searchResults.hosting.map((h) => (
                <CommandItem
                  key={`h-${h.id}`}
                  onSelect={() => handleSelect({
                    label: h.domain || h.package_name,
                    path: isAdmin ? `/admin/hosting` : `/hosting`,
                    type: 'hosting'
                  })}
                >
                  <Server className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{h.domain || h.package_name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{h.status}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
