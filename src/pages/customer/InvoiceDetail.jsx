import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useInvoice, usePayInvoice, useCustomerCredit, useInitializeIyzicoPayment } from '@/hooks/useInvoices'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Download,
  CreditCard,
  ArrowLeft,
  Calendar,
  User,
  Hash,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wallet,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [iyzicoModalOpen, setIyzicoModalOpen] = useState(false)
  const [iyzicoContent, setIyzicoContent] = useState('')

  const { data: invoice, isLoading, error } = useInvoice(id)
  const { data: credit } = useCustomerCredit(user?.id)
  const payInvoice = usePayInvoice()
  const initializeIyzico = useInitializeIyzicoPayment()

  const handlePayInvoice = async (paymentMethod) => {
    try {
      await payInvoice.mutateAsync({
        invoice_id: invoice.id,
        payment_method: paymentMethod,
      })

      toast.success('Fatura ödendi', {
        description: `${invoice.invoice_number} numaralı fatura başarıyla ödendi`,
      })

      setPaymentModalOpen(false)
    } catch (error) {
      toast.error('Ödeme başarısız', {
        description: error.message,
      })
    }
  }

  const handleIyzicoPayment = async () => {
    try {
      const result = await initializeIyzico.mutateAsync({
        invoice_id: invoice.id,
        return_url: window.location.origin + '/payment-success',
      })

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

  if (error || !invoice) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Hata</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error?.message || 'Fatura bulunamadı'}</p>
            <Button onClick={() => navigate('/invoices')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Faturalara Dön
            </Button>
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

  // Calculate totals from items if not set in database
  const calculateTotals = () => {
    const itemsTotal = invoice.items?.reduce((sum, item) => {
      return sum + ((item.quantity || 1) * (item.unit_price || 0))
    }, 0) || 0

    const subtotal = invoice.subtotal || itemsTotal
    const tax = invoice.tax || 0
    const total = invoice.total || (subtotal + tax)

    return { subtotal, tax, total }
  }

  const { subtotal, tax, total } = calculateTotals()

  const getStatusBadge = (status) => {
    const config = {
      paid: { label: 'Ödendi', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      unpaid: { label: 'Ödenmedi', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      overdue: { label: 'Vadesi Geçti', className: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle },
      cancelled: { label: 'İptal', className: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle },
      refunded: { label: 'İade', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2 },
    }
    const { label, className, icon: Icon } = config[status] || config.unpaid
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Fatura Detayı</h1>
            <p className="text-muted-foreground mt-1">
              {invoice.invoice_number}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === 'unpaid' && (
            <Button onClick={() => setPaymentModalOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Ödeme Yap
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            PDF İndir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Invoice Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{invoice.invoice_number}</CardTitle>
                  <CardDescription>Fatura Bilgileri</CardDescription>
                </div>
                {getStatusBadge(invoice.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invoice Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Oluşturma Tarihi</p>
                    <p className="font-medium">{formatDate(invoice.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vade Tarihi</p>
                    <p className="font-medium">{formatDate(invoice.due_date)}</p>
                  </div>
                </div>
                {invoice.paid_date && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ödeme Tarihi</p>
                      <p className="font-medium">{formatDate(invoice.paid_date)}</p>
                    </div>
                  </div>
                )}
                {invoice.payment_method && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ödeme Yöntemi</p>
                      <p className="font-medium capitalize">{invoice.payment_method}</p>
                    </div>
                  </div>
                )}
              </div>

              {invoice.customer && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Müşteri</p>
                      <p className="font-medium">{invoice.customer.full_name}</p>
                      <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Invoice Items */}
              <div>
                <h3 className="font-semibold mb-3">Fatura Kalemleri</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="text-center">Miktar</TableHead>
                      <TableHead className="text-right">Birim Fiyat</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            {item.type && (
                              <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity || 1}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price, invoice.currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency((item.quantity || 1) * (item.unit_price || 0), invoice.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span className="font-medium">{formatCurrency(subtotal, invoice.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Vergi</span>
                  <span className="font-medium">{formatCurrency(tax, invoice.currency)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Toplam</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(total, invoice.currency)}
                  </span>
                </div>
              </div>

              {invoice.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Notlar</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ödeme Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Durum</span>
                  {getStatusBadge(invoice.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Toplam Tutar</span>
                  <span className="font-semibold">{formatCurrency(total, invoice.currency)}</span>
                </div>
                {invoice.status === 'unpaid' && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Wallet Bakiyeniz</span>
                    <span className="font-medium">{formatCurrency(credit?.balance || 0, credit?.currency)}</span>
                  </div>
                )}
              </div>

              {invoice.status === 'unpaid' && (
                <Button className="w-full" onClick={() => setPaymentModalOpen(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Şimdi Öde
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Official Invoice */}
          {invoice.official_invoice_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resmi Fatura</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <a href={invoice.official_invoice_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Resmi Faturayı İndir
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                PDF İndir
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/invoices">
                  <FileText className="h-4 w-4 mr-2" />
                  Tüm Faturalar
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faturayı Öde</DialogTitle>
            <DialogDescription>
              {invoice.invoice_number} numaralı faturayı nasıl ödemek istersiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Ödenecek Tutar:</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(total, invoice.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Wallet Bakiyeniz:</span>
                <span className="font-medium">
                  {formatCurrency(credit?.balance || 0, credit?.currency)}
                </span>
              </div>
              {credit?.balance < total && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Wallet bakiyeniz yetersiz. Lütfen bakiye yükleyin veya başka ödeme yöntemi seçin.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => handlePayInvoice('wallet')}
              disabled={payInvoice.isPending || (credit?.balance < total)}
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
