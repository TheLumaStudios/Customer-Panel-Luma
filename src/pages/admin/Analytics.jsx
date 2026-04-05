import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Users, Package, Calendar, CreditCard } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']

export default function Analytics() {
  // Fetch all paid invoices
  const { data: invoicesData } = useQuery({
    queryKey: ['analytics-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('status', 'paid')

      if (error) throw error
      return data || []
    }
  })

  // Fetch all hosting records with package pricing
  const { data: hostingRecords } = useQuery({
    queryKey: ['analytics-hosting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosting')
        .select(`
          *,
          package:hosting_packages(
            monthly_price,
            yearly_price,
            package_name
          )
        `)
        .in('status', ['active', 'suspended', 'pending', 'enabled'])

      if (error) throw error
      return data || []
    }
  })

  // Fetch all VDS/VPS records
  const { data: vdsRecords } = useQuery({
    queryKey: ['analytics-vds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vds')
        .select('*')
        .in('status', ['active', 'suspended', 'pending'])

      if (error) throw error
      return data || []
    }
  })

  // Fetch all customers
  const { data: customers } = useQuery({
    queryKey: ['analytics-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, status')
        .eq('status', 'active')

      if (error) throw error
      return data || []
    }
  })

  const invoices = invoicesData || []
  const hostings = hostingRecords || []
  const vdsList = vdsRecords || []
  const customerList = customers || []

  // Calculate MRR (Monthly Recurring Revenue) with detailed breakdown
  const calculateMRRWithBreakdown = () => {
    if (!hostings.length && !vdsList.length) return { total: 0, breakdown: [] }

    let mrr = 0
    const breakdown = []

    // Process hosting records
    hostings.forEach(hosting => {
      // Get pricing from package relation
      const packageData = hosting.package
      if (!packageData) return // Skip if no package data

      const billingCycle = hosting.billing_cycle || 'monthly'
      let price = 0
      let monthlyEquivalent = 0
      let divisor = 1

      // Determine price based on billing cycle
      if (billingCycle === 'annually' || billingCycle === 'yearly') {
        price = packageData.yearly_price || (packageData.monthly_price * 12) || 0
        monthlyEquivalent = price / 12
        divisor = 12
      } else if (billingCycle === 'quarterly') {
        price = packageData.quarterly_price || (packageData.monthly_price * 3) || 0
        monthlyEquivalent = price / 3
        divisor = 3
      } else {
        // monthly or default
        price = packageData.monthly_price || 0
        monthlyEquivalent = price
        divisor = 1
      }

      if (price === 0 || !monthlyEquivalent) return // Skip if no price

      mrr += monthlyEquivalent
      breakdown.push({
        type: 'Hosting',
        package_name: packageData.package_name || hosting.package_name || hosting.domain || 'Bilinmeyen Paket',
        billing_cycle: billingCycle,
        price: price,
        monthly_equivalent: monthlyEquivalent,
        divisor: divisor
      })
    })

    // Process VDS records
    vdsList.forEach(vds => {
      const billingCycle = vds.billing_cycle || 'monthly'
      let price = 0
      let monthlyEquivalent = 0
      let divisor = 1

      // Determine price based on billing cycle
      if (billingCycle === 'yearly') {
        price = vds.yearly_price || 0
        monthlyEquivalent = price / 12
        divisor = 12
      } else if (billingCycle === 'quarterly') {
        price = vds.quarterly_price || (vds.monthly_price * 3) || 0
        monthlyEquivalent = price / 3
        divisor = 3
      } else {
        // monthly or default
        price = vds.monthly_price || 0
        monthlyEquivalent = price
        divisor = 1
      }

      if (price === 0) return // Skip if no price

      mrr += monthlyEquivalent
      breakdown.push({
        type: 'VDS/VPS',
        package_name: vds.vds_name || vds.hostname || 'Bilinmeyen VDS',
        billing_cycle: billingCycle,
        price: price,
        monthly_equivalent: monthlyEquivalent,
        divisor: divisor
      })
    })

    return { total: mrr, breakdown }
  }

  // Calculate MRR (Monthly Recurring Revenue)
  const calculateMRR = () => {
    return calculateMRRWithBreakdown().total
  }

  // Calculate ARR (Annual Recurring Revenue)
  const calculateARR = () => {
    return calculateMRR() * 12
  }

  // Calculate total net revenue (KDV hariç)
  const totalNetRevenue = invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0)

  // Calculate revenue by type
  const officialInvoiceRevenue = invoices
    .filter(inv => inv.requires_official_invoice !== false)
    .reduce((sum, inv) => sum + (inv.subtotal || 0), 0)

  const mukerrerRevenue = invoices
    .filter(inv => inv.requires_official_invoice === false)
    .reduce((sum, inv) => sum + (inv.subtotal || 0), 0)

  // Calculate average invoice value
  const averageInvoiceValue = invoices.length > 0
    ? totalNetRevenue / invoices.length
    : 0

  // Calculate revenue by month (last 12 months)
  const getMonthlyRevenue = () => {
    const monthlyData = {}
    const now = new Date()

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = 0
    }

    // Sum up revenue by month
    invoices.forEach(inv => {
      if (inv.paid_date) {
        const date = new Date(inv.paid_date)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (monthlyData.hasOwnProperty(key)) {
          monthlyData[key] += inv.subtotal || 0
        }
      }
    })

    return monthlyData
  }

  const monthlyRevenue = getMonthlyRevenue()

  const formatCurrency = (amount, currency = 'TRY') => {
    const value = amount || 0
    if (currency === 'TRY') {
      return `₺${value.toFixed(2)}`
    }
    return `$${value.toFixed(2)}`
  }

  const mrrData = calculateMRRWithBreakdown()
  const mrr = mrrData.total
  const arr = calculateARR()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analiz ve Raporlama</h1>
        <p className="text-muted-foreground mt-1">
          Gelir metrikleri ve iş analitiği
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR (Aylık Tekrarlayan Gelir)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(mrr)}</div>
            <p className="text-xs text-muted-foreground">
              {hostings.length + vdsList.length} aktif abonelik
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR (Yıllık Tekrarlayan Gelir)</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(arr)}</div>
            <p className="text-xs text-muted-foreground">
              MRR × 12 ay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Net Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalNetRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.length} ödenen fatura (KDV hariç)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Müşteri</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{customerList.length}</div>
            <p className="text-xs text-muted-foreground">
              Aktif durumdaki müşteriler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Fatura Değeri</CardTitle>
            <CreditCard className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{formatCurrency(averageInvoiceValue)}</div>
            <p className="text-xs text-muted-foreground">
              Fatura başına ortalama
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Abonelik</CardTitle>
            <Package className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{hostings.length + vdsList.length}</div>
            <p className="text-xs text-muted-foreground">
              {hostings.length} hosting + {vdsList.length} VDS/VPS
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MRR Breakdown */}
      {mrrData.breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>MRR Detayı (Aylık Karşılıklar)</CardTitle>
            <CardDescription>Her aboneliğin aylık tekrarlayan gelir karşılığı</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mrrData.breakdown.map((item, index) => {
              const labels = {
                monthly: 'Aylık',
                quarterly: 'Üç Aylık',
                'semi-annually': 'Altı Aylık',
                annually: 'Yıllık',
                biennially: 'İki Yıllık',
                triennially: 'Üç Yıllık'
              }
              const cycleLabel = labels[item.billing_cycle] || item.billing_cycle

              return (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {item.package_name}
                      <span className="ml-2 text-xs text-muted-foreground">({item.type})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cycleLabel} • {formatCurrency(item.price)}
                      {item.divisor > 1 && ` ÷ ${item.divisor} ay`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">
                      {formatCurrency(item.monthly_equivalent)}
                    </div>
                    <div className="text-xs text-muted-foreground">/ay</div>
                  </div>
                </div>
              )
            })}
            <div className="pt-2 border-t mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Toplam MRR</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(mrr)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gelir Dağılımı (Tip)</CardTitle>
            <CardDescription>Resmi fatura vs Mükerrer 20/B</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                <span className="text-sm font-medium">Resmi Fatura</span>
              </div>
              <span className="text-sm font-bold">{formatCurrency(officialInvoiceRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                <span className="text-sm font-medium">Mükerrer 20/B</span>
              </div>
              <span className="text-sm font-bold">{formatCurrency(mukerrerRevenue)}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Toplam</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(totalNetRevenue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Abonelik Dağılımı (Periyot)</CardTitle>
            <CardDescription>Faturalandırma döngüsüne göre</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {['monthly', 'quarterly', 'semi-annually', 'annually', 'biennially', 'triennially'].map(cycle => {
              const hostingCount = hostings.filter(h => h.billing_cycle === cycle).length
              const vdsCount = vdsList.filter(v => v.billing_cycle === cycle).length
              const totalCount = hostingCount + vdsCount

              const labels = {
                monthly: 'Aylık',
                quarterly: 'Üç Aylık',
                'semi-annually': 'Altı Aylık',
                annually: 'Yıllık',
                biennially: 'İki Yıllık',
                triennially: 'Üç Yıllık'
              }

              if (totalCount === 0) return null

              return (
                <div key={cycle} className="flex items-center justify-between">
                  <span className="text-sm">{labels[cycle]}</span>
                  <span className="text-sm font-semibold">
                    {totalCount} abonelik
                    <span className="text-xs text-muted-foreground ml-2">
                      ({hostingCount} hosting + {vdsCount} VDS)
                    </span>
                  </span>
                </div>
              )
            })}
            {hostings.length === 0 && vdsList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz abonelik bulunmuyor
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Aylık Gelir Trendi (Son 12 Ay)</CardTitle>
          <CardDescription>KDV hariç net gelir</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const chartData = Object.entries(monthlyRevenue).map(([month, revenue]) => {
              const [year, monthNum] = month.split('-')
              const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
              const label = date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
              return { month: label, gelir: revenue }
            })
            const hasData = chartData.some(d => d.gelir > 0)

            return hasData ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Gelir']}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gelir"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#22c55e' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="space-y-2">
                {chartData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{item.month}</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(item.gelir)}</span>
                  </div>
                ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Subscription Distribution Pie Chart */}
      {(hostings.length > 0 || vdsList.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Hizmet Türü Dağılımı</CardTitle>
              <CardDescription>Hosting vs VDS/VPS abonelik sayısı</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Hosting', value: hostings.length },
                      { name: 'VDS/VPS', value: vdsList.length },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#8b5cf6" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MRR Kaynak Dağılımı</CardTitle>
              <CardDescription>Aylık gelir kaynakları</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const hostingMrr = mrrData.breakdown
                  .filter(b => b.type === 'Hosting')
                  .reduce((sum, b) => sum + b.monthly_equivalent, 0)
                const vdsMrr = mrrData.breakdown
                  .filter(b => b.type === 'VDS/VPS')
                  .reduce((sum, b) => sum + b.monthly_equivalent, 0)
                const pieData = [
                  { name: 'Hosting', value: Math.round(hostingMrr * 100) / 100 },
                  { name: 'VDS/VPS', value: Math.round(vdsMrr * 100) / 100 },
                ].filter(d => d.value > 0)

                return pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ₺${value.toFixed(0)}`}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">Henüz veri bulunmuyor</p>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
