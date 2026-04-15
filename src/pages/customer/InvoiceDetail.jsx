import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useInvoice, usePayInvoice, useCustomerCredit, useInitializeIyzicoPayment } from '@/hooks/useInvoices'
import { useCustomers } from '@/hooks/useCustomers'
import { useCreateTicket } from '@/hooks/useTickets'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
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
  Wallet,
  XCircle,
  Loader2,
  Clock,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'
import BankTransferForm from '@/components/invoices/BankTransferForm'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Turkce karakter donusumu (Helvetica Turkce desteklemez)
const tr = (text) => {
  if (!text) return ''
  return String(text)
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
}

const generateInvoicePdf = (invoice) => {
  const doc = new jsPDF()
  const pw = doc.internal.pageSize.getWidth()

  // -- PROFORMA FATURA HEADER --
  doc.setFillColor(30, 41, 59)
  doc.rect(0, 0, pw, 42, 'F')

  doc.setTextColor(255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('PROFORMA FATURA', 14, 20)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180)
  doc.text('Luma Yazilim - Enes POYRAZ', 14, 28)
  doc.text('VKN: 7330923351 | Ucevler Mah. Dumlupinar Cd. No:5/A Nilufer/Bursa', 14, 33)
  doc.text('Tel: 0544 979 62 57 | info@lumayazilim.com', 14, 38)

  // Invoice number - right
  doc.setTextColor(255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(invoice.invoice_number || '', pw - 14, 20, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(180)
  doc.text(`Tarih: ${invoice.invoice_date || ''}`, pw - 14, 28, { align: 'right' })
  doc.text(`Vade: ${invoice.due_date || ''}`, pw - 14, 33, { align: 'right' })

  const statusText = invoice.status === 'paid' ? 'ODENMIS' : invoice.status === 'unpaid' ? 'ODENMEDI' : (invoice.status || '').toUpperCase()
  doc.text(`Durum: ${statusText}`, pw - 14, 38, { align: 'right' })

  // -- CUSTOMER INFO --
  doc.setTextColor(0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(tr('Musteri Bilgileri'), 14, 54)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80)

  const cust = invoice.customer || {}
  doc.text(tr(cust.full_name || '-'), 14, 60)
  doc.text(cust.email || '-', 14, 65)
  if (cust.phone) doc.text(`Tel: ${cust.phone}`, 14, 70)
  if (cust.billing_address) doc.text(tr(cust.billing_address), 14, 75)

  // -- ITEMS TABLE --
  // invoice_items veya items
  const rawItems = invoice.invoice_items || invoice.items || []
  const tableBody = rawItems.map(item => [
    tr(item.description || item.type || '-'),
    String(item.quantity || 1),
    `${Number(item.unit_price || item.amount || 0).toFixed(2)} TL`,
    `${Number(item.amount || item.total_price || item.total || 0).toFixed(2)} TL`,
  ])

  // Eger tablo bossa placeholder ekle
  if (tableBody.length === 0) {
    tableBody.push([tr('Fatura kalemi bulunamadi'), '–', '–', '–'])
  }

  const startY = cust.billing_address ? 82 : cust.phone ? 78 : 74

  doc.autoTable({
    startY,
    head: [[tr('Aciklama'), 'Adet', 'Birim Fiyat', 'Tutar']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9, font: 'helvetica' },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  // -- TOTALS --
  const finalY = doc.lastAutoTable.finalY + 8
  const rightCol = pw - 14

  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text('Ara Toplam:', rightCol - 55, finalY)
  doc.text(`${Number(invoice.subtotal || 0).toFixed(2)} TL`, rightCol, finalY, { align: 'right' })

  doc.text('KDV (%20):', rightCol - 55, finalY + 6)
  doc.text(`${Number(invoice.tax || invoice.tax_amount || 0).toFixed(2)} TL`, rightCol, finalY + 6, { align: 'right' })

  doc.setDrawColor(200)
  doc.line(rightCol - 65, finalY + 10, rightCol, finalY + 10)

  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text('TOPLAM:', rightCol - 55, finalY + 18)
  doc.text(`${Number(invoice.total_amount || invoice.total || 0).toFixed(2)} TL`, rightCol, finalY + 18, { align: 'right' })

  // Payment method
  if (invoice.payment_method) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120)
    doc.text(tr(`Odeme Yontemi: ${invoice.payment_method}`), 14, finalY + 18)
  }

  // -- PROFORMA NOTE --
  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.setFont('helvetica', 'italic')
  doc.text('Bu belge proforma fatura niteligindedir, resmi fatura yerine gecmez.', pw / 2, 275, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Luma Yazilim | lumayazilim.com | info@lumayazilim.com', pw / 2, 280, { align: 'center' })

  doc.save(`${invoice.invoice_number || 'fatura'}.pdf`)
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [iyzicoModalOpen, setIyzicoModalOpen] = useState(false)
  const [iyzicoContent, setIyzicoContent] = useState('')
  const [bankTransferOpen, setBankTransferOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [existingCancelTicket, setExistingCancelTicket] = useState(null)
  const [hasBankTransfer, setHasBankTransfer] = useState(false)

  const { data: invoice, isLoading, error } = useInvoice(id)
  const { data: credit } = useCustomerCredit(user?.id)
  const { data: customers } = useCustomers()
  const payInvoice = usePayInvoice()
  const initializeIyzico = useInitializeIyzicoPayment()
  const createTicket = useCreateTicket()

  const currentCustomer = customers?.find(c => c.email === user?.email)

// Look for an existing cancel request for this invoice so we don't let
// the customer spam the support team with duplicates.
  useEffect(() => {
    if (!currentCustomer?.id || !invoice?.invoice_number) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('id, ticket_number, status, created_at')
        .eq('customer_id', currentCustomer.id)
        .like('subject', `%${invoice.invoice_number}%`)
        .in('status', ['open', 'in_progress', 'waiting_customer'])
        .order('created_at', { ascending: false })
        .limit(1)
      if (cancelled) return
      setExistingCancelTicket(data?.[0] || null)
    })()
    return () => { cancelled = true }
  }, [currentCustomer?.id, invoice?.invoice_number])

  // Check if bank transfer confirmation exists for this invoice
  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('bank_transfer_confirmations')
        .select('id, status')
        .eq('invoice_id', id)
        .in('status', ['pending', 'approved'])
        .limit(1)
      if (!cancelled && data?.length > 0) {
        setHasBankTransfer(true)
      }
    })()
    return () => { cancelled = true }
  }, [id, bankTransferOpen])

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

  const handleCancelRequest = async () => {
    if (!currentCustomer?.id) {
      toast.error('Müşteri bilgisi bulunamadı', { description: 'Lütfen sayfayı yenileyin' })
      return
    }
    if (!cancelReason.trim() || cancelReason.trim().length < 10) {
      toast.error('Lütfen en az 10 karakterlik bir sebep yazın')
      return
    }

    try {
      const ticketNumber = `TK-${Date.now().toString(36).toUpperCase()}`
      const created = await createTicket.mutateAsync({
        ticket_number: ticketNumber,
        customer_id: currentCustomer.id,
        subject: `Fatura İptal Talebi - ${invoice.invoice_number}`,
        description: `Müşteri, aşağıdaki fatura için iptal talebinde bulundu. Lütfen inceleyip onaylayın.

        Fatura Bilgileri:
        - Fatura No: ${invoice.invoice_number}
        - Fatura ID: ${invoice.id}
        - Tutar: ${(invoice.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${invoice.currency || 'TRY'}
        - Oluşturulma: ${new Date(invoice.created_at).toLocaleString('tr-TR')}
        - Durum: ${invoice.status}

        İptal Sebebi:
        ${cancelReason.trim()}

        ---
        Bu bildirim müşteri panelinden otomatik oluşturulmuştur.`,
        category: 'billing',
        priority: 'medium',
        status: 'open',
      })

      toast.success('İptal talebiniz alındı', {
        description: 'Ekibimiz en kısa sürede dönüş yapacak'
      })
      setExistingCancelTicket({
        id: created?.id || ticketNumber,
        ticket_number: ticketNumber,
        status: 'open',
      })
      setCancelDialogOpen(false)
      setCancelReason('')
    } catch (err) {
      toast.error('Talep gönderilemedi', { description: err.message })
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

  const formatCurrency = (amount) => {
    return `${(amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
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
    return <StatusBadge status={status} />
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
            <>
              {hasBankTransfer ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1.5 text-sm">
                  <Clock className="h-4 w-4 mr-1.5" />
                  Havale bildirimi gönderildi - İnceleme bekleniyor
                </Badge>
              ) : (
                <>
                  <Button onClick={() => setPaymentModalOpen(true)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Ödeme Yap
                  </Button>
                  <Button variant="outline" onClick={() => setBankTransferOpen(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Havale/EFT ile Öde
                  </Button>
                </>
              )}
              {existingCancelTicket ? (
                <Button
                  variant="outline"
                  disabled
                  title={`Bu fatura için açık destek talebi var (${existingCancelTicket.ticket_number || existingCancelTicket.id.slice(0, 8)})`}
                  className="text-muted-foreground"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  İptal Talebi Gönderildi
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  İptal Talebi
                </Button>
              )}
            </>
          )}
          <Button variant="outline" onClick={() => generateInvoicePdf(invoice)}>
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

              {invoice.status === 'unpaid' && !hasBankTransfer && (
                <Button className="w-full" onClick={() => setPaymentModalOpen(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Şimdi Öde
                </Button>
              )}
              {invoice.status === 'unpaid' && hasBankTransfer && (
                <div className="text-center text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Havale bildirimi inceleniyor
                </div>
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
              <Button variant="outline" className="w-full justify-start" onClick={() => generateInvoicePdf(invoice)}>
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

      {/* Bank Transfer Modal */}
      <Dialog open={bankTransferOpen} onOpenChange={setBankTransferOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Havale / EFT ile Ödeme</DialogTitle>
            <DialogDescription>
              {invoice.invoice_number} numaralı fatura için havale/EFT bildiriminde bulunun
            </DialogDescription>
          </DialogHeader>
          <BankTransferForm
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoice_number}
            invoiceTotal={invoice.total_amount || invoice.total}
            onSuccess={() => {
              setBankTransferOpen(false)
              toast.success('Havale bildirimi gönderildi', {
                description: 'Faturanız inceleme sonrası onaylanacaktır',
              })
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Cancel Request Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Fatura İptal Talebi
            </DialogTitle>
            <DialogDescription>
              {invoice.invoice_number} numaralı faturanızı iptal ettirmek için
              sebebini yazın. Talebiniz destek ekibine bildirim olarak iletilir
              ve incelendikten sonra geri dönüş yapılır.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fatura No:</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tutar:</span>
                <span className="font-medium">
                  {formatCurrency(total, invoice.currency)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                İptal Sebebi <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Örn. Hizmeti yanlışlıkla satın aldım / Başka bir pakete geçmek istiyorum..."
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                En az 10 karakter ({cancelReason.trim().length}/10)
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={createTicket.isPending}
              className="w-full sm:w-auto"
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelRequest}
              disabled={createTicket.isPending || cancelReason.trim().length < 10}
              className="w-full sm:w-auto"
            >
              {createTicket.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  İptal Talebini Gönder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
