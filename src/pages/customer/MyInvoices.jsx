import { useInvoices } from '@/hooks/useInvoices'
import { useAuth } from '@/hooks/useAuth.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Eye, Download } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function MyInvoices() {
  const { profile } = useAuth()
  const { data: allInvoices, isLoading, error } = useInvoices()

  // Filter invoices for current customer
  const invoices = allInvoices?.filter(invoice => invoice.customer?.profile?.email === profile?.email)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Hata</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      cancelled: 'secondary',
    }
    const labels = {
      paid: 'Ödendi',
      pending: 'Beklemede',
      overdue: 'Vadesi Geçti',
      cancelled: 'İptal',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  // Calculate summary statistics
  const totalPaid = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0) || 0
  const pendingAmount = invoices?.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.total_amount, 0) || 0
  const overdueAmount = invoices?.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total_amount, 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Faturalarım</h1>
        <p className="text-muted-foreground mt-1">
          Faturalarınızı görüntüleyin ve ödeme durumlarını takip edin
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ödenen Faturalar</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices?.filter(inv => inv.status === 'paid').length || 0} fatura
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Ödemeler</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices?.filter(inv => inv.status === 'pending').length || 0} fatura
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vadesi Geçen</CardTitle>
            <FileText className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(overdueAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices?.filter(inv => inv.status === 'overdue').length || 0} fatura
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fatura Listesi</CardTitle>
          <CardDescription>
            Toplam {invoices?.length || 0} fatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz faturanız bulunmuyor.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Fatura Tarihi</TableHead>
                  <TableHead>Vade Tarihi</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
