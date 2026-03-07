import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInvoices, usePayInvoice } from '@/hooks/useInvoices'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Eye, FileText, RefreshCw, DollarSign, AlertCircle, CheckCircle2, CreditCard, Wallet } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const { data: invoicesData, isLoading, error, refetch } = useInvoices({
    status: statusFilter || undefined,
  })
  const payInvoice = usePayInvoice()

  const invoices = invoicesData?.invoices || []
  const total = invoicesData?.total || 0

  const handlePayInvoice = async (paymentMethod) => {
    try {
      await payInvoice.mutateAsync({
        invoice_id: selectedInvoice.id,
        payment_method: paymentMethod,
      })

      toast.success('Fatura ödendi', {
        description: `${selectedInvoice.invoice_number} numaralı fatura başarıyla ödendi`,
      })

      setPaymentModalOpen(false)
      setSelectedInvoice(null)
    } catch (error) {
      toast.error('Ödeme başarısız', {
        description: error.message,
      })
    }
  }

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

  const formatCurrency = (amount, currency = 'USD') => {
    if (currency === 'TRY') {
      return `₺${amount.toFixed(2)}`
    }
    return `$${amount.toFixed(2)}`
  }

  // Calculate summary statistics
  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0)
  const pendingAmount = invoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + inv.total, 0)
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturalar</h1>
          <p className="text-muted-foreground mt-1">
            Tüm faturaları görüntüleyin ve yönetin
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/invoice/new">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Fatura
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue, invoices[0]?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'paid').length} ödenen fatura
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Ödemeler</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount, invoices[0]?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'unpaid').length} bekleyen fatura
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vadesi Geçen</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount, invoices[0]?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'overdue').length} vadesi geçmiş fatura
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fatura Listesi</CardTitle>
              <CardDescription>
                Toplam {total} fatura
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tüm Durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tüm Faturalar</SelectItem>
                  <SelectItem value="paid">Ödenenler</SelectItem>
                  <SelectItem value="unpaid">Ödenmeyenler</SelectItem>
                  <SelectItem value="overdue">Vadesi Geçenler</SelectItem>
                  <SelectItem value="cancelled">İptal Edilenler</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">
                {statusFilter
                  ? 'Bu filtreye uygun fatura bulunamadı'
                  : 'Henüz fatura bulunmuyor'
                }
              </p>
              {!statusFilter && (
                <p className="text-sm mt-1">Yeni bir fatura oluşturun</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Oluşturma</TableHead>
                  <TableHead>Vade Tarihi</TableHead>
                  <TableHead>Ödeme Tarihi</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {invoice.customer?.full_name || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.customer?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(invoice.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {invoice.status === 'overdue' && (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        )}
                        {formatDate(invoice.due_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.paid_date ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          {formatDate(invoice.paid_date)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link to={`/admin/invoice/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {invoice.status === 'unpaid' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setPaymentModalOpen(true)
                            }}
                          >
                            <CreditCard className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faturayı Öde</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoice_number} numaralı faturayı nasıl ödemek istersiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ödenecek Tutar:</span>
                <span className="text-2xl font-bold">
                  {selectedInvoice && formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => handlePayInvoice('wallet')}
              disabled={payInvoice.isPending}
              className="w-full sm:w-auto"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Wallet ile Öde
            </Button>
            <Button
              onClick={() => handlePayInvoice('bank_transfer')}
              disabled={payInvoice.isPending}
              className="w-full sm:w-auto"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manuel Ödeme İşaretle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
