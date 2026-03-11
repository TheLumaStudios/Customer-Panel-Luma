import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useInvoices, usePayInvoice, useCustomerCredit, useInitializeIyzicoPayment } from '@/hooks/useInvoices'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileText, Eye, CreditCard, DollarSign, AlertCircle, CheckCircle2, Wallet, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

export default function MyInvoices() {
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [iyzicoModalOpen, setIyzicoModalOpen] = useState(false)
  const [iyzicoContent, setIyzicoContent] = useState('')

  const { user } = useAuth()
  const { data: invoicesData, isLoading, error, refetch } = useInvoices()
  const { data: credit } = useCustomerCredit(user?.id)
  const payInvoice = usePayInvoice()
  const initializeIyzico = useInitializeIyzicoPayment()

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

  const handleIyzicoPayment = async () => {
    try {
      const result = await initializeIyzico.mutateAsync({
        invoice_id: selectedInvoice.id,
        return_url: window.location.origin + '/invoices',
      })

      // Show iyzico payment page in iframe
      setIyzicoContent(result.checkoutFormContent)
      setPaymentModalOpen(false)
      setIyzicoModalOpen(true)

      toast.success('iyzico ödeme sayfası açılıyor', {
        description: 'Ödeme bilgilerinizi girin',
      })
    } catch (error) {
      toast.error('iyzico ödeme başlatılamadı', {
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

  const formatCurrency = (amount, currency = 'USD') => {
    const value = amount || 0
    if (currency === 'TRY') {
      return `₺${value.toFixed(2)}`
    }
    return `$${value.toFixed(2)}`
  }

  // Helper to calculate invoice total
  const getInvoiceTotal = (invoice) => {
    if (invoice.total && invoice.total > 0) return invoice.total
    // Calculate from items if total is not set
    const itemsTotal = invoice.items?.reduce((sum, item) => {
      return sum + ((item.quantity || 1) * (item.unit_price || 0))
    }, 0) || 0
    return itemsTotal + (invoice.tax || 0)
  }

  const getStatusBadge = (status) => {
    const config = {
      paid: { label: 'Ödendi', className: 'bg-green-100 text-green-800 border-green-200' },
      unpaid: { label: 'Ödenmedi', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      overdue: { label: 'Vadesi Geçti', className: 'bg-red-100 text-red-800 border-red-200' },
      cancelled: { label: 'İptal', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      refunded: { label: 'İade', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    }
    const { label, className} = config[status] || config.unpaid
    return <Badge variant="outline" className={className}>{label}</Badge>
  }

  // Calculate summary statistics
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0)
  const pendingAmount = invoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + inv.total, 0)
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturalarım</h1>
          <p className="text-muted-foreground mt-1">
            Faturalarınızı görüntüleyin ve ödeme durumlarını takip edin
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Bakiyesi</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(credit?.balance || 0, credit?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              Kullanılabilir bakiye
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ödenen</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid, invoices[0]?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'paid').length} fatura
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount, invoices[0]?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'unpaid').length} fatura
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
              {invoices.filter(inv => inv.status === 'overdue').length} fatura
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fatura Listesi</CardTitle>
          <CardDescription>
            Toplam {total} fatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Henüz faturanız bulunmuyor</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
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
                    <TableCell>{formatDate(invoice.created_at)}</TableCell>
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
                      {formatCurrency(getInvoiceTotal(invoice), invoice.currency)}
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
                          <Link to={`/invoice/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {invoice.status === 'unpaid' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setPaymentModalOpen(true)
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Öde
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Ödenecek Tutar:</span>
                <span className="text-2xl font-bold">
                  {selectedInvoice && formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Wallet Bakiyeniz:</span>
                <span className="font-medium">
                  {formatCurrency(credit?.balance || 0, credit?.currency)}
                </span>
              </div>
              {credit?.balance < selectedInvoice?.total && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ Wallet bakiyeniz yetersiz. Lütfen bakiye yükleyin veya başka ödeme yöntemi seçin.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => handlePayInvoice('wallet')}
              disabled={payInvoice.isPending || (credit?.balance < selectedInvoice?.total)}
              className="w-full sm:w-auto"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Wallet ile Öde
            </Button>
            <Button
              onClick={handleIyzicoPayment}
              disabled={initializeIyzico.isPending}
              className="w-full sm:w-auto bg-gradient-to-r from-[#00A3FF] to-[#0088E0] hover:from-[#0088E0] hover:to-[#0066B3]"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              iyzico ile Öde
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* iyzico Payment Modal */}
      <Dialog open={iyzicoModalOpen} onOpenChange={setIyzicoModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>iyzico Ödeme</DialogTitle>
            <DialogDescription>
              Güvenli ödeme sayfasında kart bilgilerinizi girin
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-[600px] overflow-hidden rounded-lg border">
            {iyzicoContent && (
              <div
                dangerouslySetInnerHTML={{ __html: iyzicoContent }}
                className="w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
