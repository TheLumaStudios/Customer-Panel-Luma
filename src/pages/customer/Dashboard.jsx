import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCustomers } from '@/hooks/useCustomers'
import { useContractCheck } from '@/hooks/useContractCheck'
import ContractApprovalModal from '@/components/contracts/ContractApprovalModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency, getDaysUntil } from '@/lib/utils'
import { toast } from '@/lib/toast'
import {
  Server,
  Globe,
  FileText,
  HeadphonesIcon,
  Search,
  MessageSquarePlus,
  CreditCard,
  UserCog,
  CalendarClock,
  AlertTriangle,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react'

export default function CustomerDashboard() {
  const { currentContract, showModal, setShowModal, pendingCount } = useContractCheck()
  const { profile } = useAuth()
  const { data: customers } = useCustomers()
  const currentCustomer = customers?.find(c => c.email === profile?.email)

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    hostingCount: 0,
    domainCount: 0,
    unpaidInvoiceCount: 0,
    openTicketCount: 0,
  })
  const [recentInvoices, setRecentInvoices] = useState([])
  const [activeServices, setActiveServices] = useState([])
  const [upcomingRenewals, setUpcomingRenewals] = useState([])

  const fetchDashboardData = async () => {
    if (!currentCustomer?.id) return

    setLoading(true)
    try {
      const customerId = currentCustomer.id

      // Run all queries in parallel
      const [
        hostingResult,
        domainResult,
        invoiceCountResult,
        ticketResult,
        recentInvoicesResult,
        hostingListResult,
        domainListResult,
      ] = await Promise.all([
        // Stat: active hosting count
        supabase
          .from('hosting')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .eq('status', 'active'),

        // Stat: active domain count
        supabase
          .from('domains')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .eq('status', 'active'),

        // Stat: unpaid invoice count
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .eq('status', 'unpaid'),

        // Stat: open ticket count
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .eq('status', 'open'),

        // Recent invoices (last 5)
        supabase
          .from('invoices')
          .select('id, invoice_number, total, currency, status, due_date, created_at')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(5),

        // Active hosting list
        supabase
          .from('hosting')
          .select('id, package_name, status, expiration_date, package_type')
          .eq('customer_id', customerId)
          .eq('status', 'active')
          .order('expiration_date', { ascending: true })
          .limit(10),

        // Active domain list
        supabase
          .from('domains')
          .select('id, domain_name, status, expiration_date')
          .eq('customer_id', customerId)
          .eq('status', 'active')
          .order('expiration_date', { ascending: true })
          .limit(10),
      ])

      // Set stats
      setStats({
        hostingCount: hostingResult.count || 0,
        domainCount: domainResult.count || 0,
        unpaidInvoiceCount: invoiceCountResult.count || 0,
        openTicketCount: ticketResult.count || 0,
      })

      // Set recent invoices
      setRecentInvoices(recentInvoicesResult.data || [])

      // Combine hosting + domains into active services
      const hostingServices = (hostingListResult.data || []).map(h => ({
        id: h.id,
        name: h.package_name,
        type: 'hosting',
        typeLabel: 'Hosting',
        status: h.status,
        expirationDate: h.expiration_date,
        extra: h.package_type,
      }))
      const domainServices = (domainListResult.data || []).map(d => ({
        id: d.id,
        name: d.domain_name,
        type: 'domain',
        typeLabel: 'Domain',
        status: d.status,
        expirationDate: d.expiration_date,
      }))
      const combined = [...hostingServices, ...domainServices]
      setActiveServices(combined)

      // Upcoming renewals: services expiring within 30 days
      const now = new Date()
      const in30Days = new Date()
      in30Days.setDate(now.getDate() + 30)
      const renewals = combined
        .filter(s => {
          if (!s.expirationDate) return false
          const exp = new Date(s.expirationDate)
          return exp >= now && exp <= in30Days
        })
        .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate))
      setUpcomingRenewals(renewals)
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentCustomer?.id) {
      fetchDashboardData()
    }
  }, [currentCustomer?.id])

  // Helpers
  const getInvoiceStatusBadge = (status) => {
    const config = {
      paid: { label: 'Ödendi', className: 'bg-green-100 text-green-800 border-green-200' },
      unpaid: { label: 'Ödenmedi', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      overdue: { label: 'Vadesi Geçti', className: 'bg-red-100 text-red-800 border-red-200' },
      cancelled: { label: 'İptal', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      refunded: { label: 'İade', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    }
    const { label, className } = config[status] || config.unpaid
    return <Badge variant="outline" className={className}>{label}</Badge>
  }

  const getRenewalBadge = (expirationDate) => {
    const days = getDaysUntil(expirationDate)
    if (days === null) return null
    if (days < 0) {
      return <Badge variant="destructive">Süresi Doldu</Badge>
    }
    if (days <= 7) {
      return <Badge variant="destructive">{days} gün kaldı</Badge>
    }
    if (days <= 14) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200" variant="outline">{days} gün kaldı</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" variant="outline">{days} gün kaldı</Badge>
  }

  const todayFormatted = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Müşteri'

  return (
    <>
      <ContractApprovalModal
        contract={currentContract}
        open={showModal}
        onOpenChange={setShowModal}
      />

      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-lg border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Hoş geldiniz, {displayName}
              </h1>
              <p className="text-muted-foreground mt-1">{todayFormatted}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aktif Hosting</CardTitle>
              <Server className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.hostingCount}
              </div>
              <p className="text-xs text-muted-foreground">Hosting paketi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aktif Domain</CardTitle>
              <Globe className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.domainCount}
              </div>
              <p className="text-xs text-muted-foreground">Kayıtlı domain</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Fatura</CardTitle>
              <FileText className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <span className={stats.unpaidInvoiceCount > 0 ? 'text-yellow-600' : ''}>
                    {stats.unpaidInvoiceCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Ödenmemiş fatura</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Destek Talepleri</CardTitle>
              <HeadphonesIcon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.openTicketCount}
              </div>
              <p className="text-xs text-muted-foreground">Açık talep</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link to="/domains">
              <Search className="h-5 w-5" />
              <span className="text-sm font-medium">Domain Ara</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link to="/tickets">
              <MessageSquarePlus className="h-5 w-5" />
              <span className="text-sm font-medium">Destek Talebi</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link to="/invoices">
              <CreditCard className="h-5 w-5" />
              <span className="text-sm font-medium">Fatura Öde</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link to="/profile">
              <UserCog className="h-5 w-5" />
              <span className="text-sm font-medium">Profil</span>
            </Link>
          </Button>
        </div>

        {/* Two-column layout: Recent Invoices + Active Services */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Son Faturalar</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/invoices" className="text-sm">
                  Tümünü Gör
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Henüz fatura bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      to={`/invoice/${invoice.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {invoice.invoice_number}
                          </span>
                          {getInvoiceStatusBadge(invoice.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vade: {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <span className="font-semibold text-sm">
                          {formatCurrency(invoice.total)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Services */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Aktif Servisler</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/hosting" className="text-sm">
                    Hosting
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aktif servis bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeServices.slice(0, 6).map((service) => (
                    <div
                      key={`${service.type}-${service.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {service.type === 'hosting' ? (
                          <Server className="h-4 w-4 text-blue-600 shrink-0" />
                        ) : (
                          <Globe className="h-4 w-4 text-green-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.typeLabel}
                            {service.extra ? ` - ${service.extra}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(service.expirationDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activeServices.length > 6 && (
                    <p className="text-xs text-center text-muted-foreground pt-1">
                      +{activeServices.length - 6} servis daha
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Renewals */}
        <Card className={upcomingRenewals.length > 0 ? 'border-yellow-300' : ''}>
          <CardHeader className="flex flex-row items-center gap-2">
            <CalendarClock className={`h-5 w-5 ${upcomingRenewals.length > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`} />
            <CardTitle className="text-lg">Yaklaşan Yenilemeler</CardTitle>
            {upcomingRenewals.length > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 ml-auto" variant="outline">
                {upcomingRenewals.length} servis
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingRenewals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                30 gün içinde yenilenmesi gereken servis bulunmuyor.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingRenewals.map((service) => (
                  <div
                    key={`renewal-${service.type}-${service.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.typeLabel} - Bitiş: {formatDate(service.expirationDate)}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 shrink-0">
                      {getRenewalBadge(service.expirationDate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
