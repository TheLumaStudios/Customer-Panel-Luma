import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Globe, Server, FileText, TrendingUp, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6366f1']

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    domains: 0,
    hosting: 0,
    pendingInvoices: 0,
  })
  const [revenueData, setRevenueData] = useState([])
  const [invoiceStatusData, setInvoiceStatusData] = useState([])
  const [newCustomerData, setNewCustomerData] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [upcomingRenewals, setUpcomingRenewals] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    // Fetch counts
    const [customersRes, domainsRes, hostingRes, invoicesRes] = await Promise.all([
      supabase.from('customers').select('id, created_at', { count: 'exact' }).eq('status', 'active'),
      supabase.from('domains').select('id', { count: 'exact' }),
      supabase.from('hosting').select('id', { count: 'exact' }).in('status', ['active', 'enabled']),
      supabase.from('invoices').select('id', { count: 'exact' }).in('status', ['pending', 'sent']),
    ])

    setStats({
      customers: customersRes.count || 0,
      domains: domainsRes.count || 0,
      hosting: hostingRes.count || 0,
      pendingInvoices: invoicesRes.count || 0,
    })

    // Fetch revenue data (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: paidInvoices } = await supabase
      .from('invoices')
      .select('subtotal, paid_date')
      .eq('status', 'paid')
      .gte('paid_date', sixMonthsAgo.toISOString())

    // Aggregate by month
    const monthlyRevenue = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })
      monthlyRevenue[key] = { month: label, gelir: 0 }
    }
    ;(paidInvoices || []).forEach(inv => {
      if (inv.paid_date) {
        const d = new Date(inv.paid_date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (monthlyRevenue[key]) {
          monthlyRevenue[key].gelir += inv.subtotal || 0
        }
      }
    })
    setRevenueData(Object.values(monthlyRevenue))

    // Fetch invoice status distribution
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('status')

    const statusCounts = { paid: 0, pending: 0, overdue: 0, other: 0 }
    ;(allInvoices || []).forEach(inv => {
      if (inv.status === 'paid') statusCounts.paid++
      else if (inv.status === 'pending' || inv.status === 'sent') statusCounts.pending++
      else if (inv.status === 'overdue') statusCounts.overdue++
      else statusCounts.other++
    })
    const pieData = [
      { name: 'Ödendi', value: statusCounts.paid },
      { name: 'Bekliyor', value: statusCounts.pending },
      { name: 'Gecikmiş', value: statusCounts.overdue },
    ].filter(d => d.value > 0)
    if (statusCounts.other > 0) pieData.push({ name: 'Diğer', value: statusCounts.other })
    setInvoiceStatusData(pieData)

    // New customers per month (last 6 months)
    const customerMonthly = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('tr-TR', { month: 'short' })
      customerMonthly[key] = { month: label, yeniMusteri: 0 }
    }
    ;(customersRes.data || []).forEach(c => {
      if (c.created_at) {
        const d = new Date(c.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (customerMonthly[key]) {
          customerMonthly[key].yeniMusteri++
        }
      }
    })
    setNewCustomerData(Object.values(customerMonthly))

    // Recent activities (latest invoices)
    const { data: recentInv } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, created_at, total')
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentActivities(recentInv || [])

    // Upcoming renewals (domains expiring in 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const { data: expiringDomains } = await supabase
      .from('domains')
      .select('id, domain_name, expiry_date')
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gte('expiry_date', new Date().toISOString())
      .order('expiry_date', { ascending: true })
      .limit(5)
    setUpcomingRenewals(expiringDomains || [])
  }

  const formatCurrency = (val) => `₺${(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR') : '-'

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>
              {p.name === 'gelir' ? 'Gelir' : p.name === 'yeniMusteri' ? 'Yeni Müşteri' : p.name}: {p.name === 'gelir' ? formatCurrency(p.value) : p.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Hoşgeldiniz! İşte sistemin genel durumu
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers}</div>
            <p className="text-xs text-muted-foreground">Aktif müşteri sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktif Domainler</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.domains}</div>
            <p className="text-xs text-muted-foreground">Kayıtlı domain</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktif Hosting</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hosting}</div>
            <p className="text-xs text-muted-foreground">Hosting paketi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Fatura</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Ödenmemiş fatura</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Gelir Trendi (Son 6 Ay)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="gelir"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#22c55e' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Henüz veri bulunmuyor</p>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Fatura Durumu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoiceStatusData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {invoiceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {invoiceStatusData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Henüz veri bulunmuyor</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Customers Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-purple-600" />
            Aylık Yeni Müşteri
          </CardTitle>
        </CardHeader>
        <CardContent>
          {newCustomerData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={newCustomerData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="yeniMusteri" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">Henüz veri bulunmuyor</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan Yenilemeler</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRenewals.length > 0 ? (
              <div className="space-y-3">
                {upcomingRenewals.map(domain => (
                  <div key={domain.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{domain.domain_name}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(domain.expiry_date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Yaklaşan yenileme bulunmuyor
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="text-sm font-medium">{inv.invoice_number}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                        inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.status === 'paid' ? 'Ödendi' : inv.status === 'overdue' ? 'Gecikti' : 'Bekliyor'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatCurrency(inv.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Henüz aktivite bulunmuyor
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
