import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useInvoice, useUploadInvoiceFile, useDeleteInvoiceFile, useUploadTaxReceipt, useDeleteTaxReceipt } from '@/hooks/useInvoices'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Download,
  Upload,
  FileText,
  Trash2,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

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

  const rawItems = invoice.invoice_items || invoice.items || []
  const tableBody = rawItems.map(item => [
    tr(item.description || item.type || '-'),
    String(item.quantity || 1),
    `${Number(item.unit_price || item.amount || 0).toFixed(2)} TL`,
    `${Number(item.amount || item.total_price || item.total || 0).toFixed(2)} TL`,
  ])
  if (tableBody.length === 0) tableBody.push([tr('Fatura kalemi bulunamadi'), '-', '-', '-'])

  const startY = cust.phone ? 78 : 74
  doc.autoTable({
    startY,
    head: [[tr('Aciklama'), 'Adet', 'Birim Fiyat', 'Tutar']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 35, halign: 'right' }, 3: { cellWidth: 35, halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  const finalY = doc.lastAutoTable.finalY + 8
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text('Ara Toplam:', pw - 69, finalY)
  doc.text(`${Number(invoice.subtotal || 0).toFixed(2)} TL`, pw - 14, finalY, { align: 'right' })
  doc.text('KDV (%20):', pw - 69, finalY + 6)
  doc.text(`${Number(invoice.tax || invoice.tax_amount || 0).toFixed(2)} TL`, pw - 14, finalY + 6, { align: 'right' })
  doc.setDrawColor(200)
  doc.line(pw - 75, finalY + 10, pw - 14, finalY + 10)
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text('TOPLAM:', pw - 69, finalY + 18)
  doc.text(`${Number(invoice.total_amount || invoice.total || 0).toFixed(2)} TL`, pw - 14, finalY + 18, { align: 'right' })

  if (invoice.payment_method) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120)
    doc.text(tr(`Odeme Yontemi: ${invoice.payment_method}`), 14, finalY + 18)
  }

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
  const { profile } = useAuth()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  // Determine base path based on role
  const basePath = profile?.role === 'employee' ? '/employee' : '/admin'

  // Redirect if id is "new" (invalid UUID)
  if (id === 'new') {
    navigate(`${basePath}/invoices`, { replace: true })
    return null
  }

  const { data: invoice, isLoading, error } = useInvoice(id)
  const [bankTransferInfo, setBankTransferInfo] = useState(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data } = await supabase
        .from('bank_transfer_confirmations')
        .select('*')
        .eq('invoice_id', id)
        .in('status', ['pending', 'approved'])
        .limit(1)
      if (data?.length > 0) setBankTransferInfo(data[0])
    })()
  }, [id])

  const uploadFile = useUploadInvoiceFile()
  const deleteFile = useDeleteInvoiceFile()
  const uploadTaxReceipt = useUploadTaxReceipt()
  const deleteTaxReceipt = useDeleteTaxReceipt()

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
            <Button onClick={() => navigate(`${basePath}/invoices`)} className="mt-4">
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

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Geçersiz dosya formatı', {
        description: 'Sadece PDF, JPG ve PNG dosyaları yüklenebilir'
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya çok büyük', {
        description: 'Maksimum dosya boyutu 5MB olmalıdır'
      })
      return
    }

    setUploading(true)
    try {
      await uploadFile.mutateAsync({ invoice_id: invoice.id, file })
      toast.success('Resmi fatura yüklendi', {
        description: 'Fatura dosyası başarıyla yüklendi'
      })
    } catch (error) {
      toast.error('Yükleme başarısız', {
        description: error.message
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileDelete = async () => {
    if (!confirm('Resmi faturayı silmek istediğinizden emin misiniz?')) return

    try {
      const fileName = invoice.official_invoice_url.split('/').pop()
      await deleteFile.mutateAsync({ invoice_id: invoice.id, filePath: fileName })
      toast.success('Resmi fatura silindi', {
        description: 'Fatura dosyası başarıyla silindi'
      })
    } catch (error) {
      toast.error('Silme başarısız', {
        description: error.message
      })
    }
  }

  const handleTaxReceiptUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Geçersiz dosya formatı', {
        description: 'Sadece PDF, JPG ve PNG dosyaları yüklenebilir'
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya çok büyük', {
        description: 'Maksimum dosya boyutu 5MB olmalıdır'
      })
      return
    }

    setUploading(true)
    try {
      await uploadTaxReceipt.mutateAsync({ invoice_id: invoice.id, file })
      toast.success('Vergi dekontu yüklendi', {
        description: 'Vergi dekontu başarıyla yüklendi'
      })
    } catch (error) {
      toast.error('Yükleme başarısız', {
        description: error.message
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleTaxReceiptDelete = async () => {
    if (!confirm('Vergi dekontunu silmek istediğinizden emin misiniz?')) return

    try {
      const fileName = invoice.tax_receipt_url.split('/').pop()
      await deleteTaxReceipt.mutateAsync({ invoice_id: invoice.id, filePath: fileName })
      toast.success('Vergi dekontu silindi', {
        description: 'Vergi dekontu başarıyla silindi'
      })
    } catch (error) {
      toast.error('Silme başarısız', {
        description: error.message
      })
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'unpaid' && bankTransferInfo) {
      return (
        <div className="space-y-1">
          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Bildirim Yapıldı
          </Badge>
          <p className="text-xs text-muted-foreground">{bankTransferInfo.bank_name} - {bankTransferInfo.sender_name}</p>
        </div>
      )
    }

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
          <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/invoices`)}>
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
                      <button
                        className="font-medium text-primary hover:underline text-left"
                        onClick={() => navigate(`${basePath}/customers/${invoice.customer.id}`)}
                      >
                        {invoice.customer.full_name}
                      </button>
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

              {invoice.admin_notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Admin Notları</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.admin_notes}</p>
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
              </div>
            </CardContent>
          </Card>

          {/* Official Invoice Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resmi Fatura</CardTitle>
              <CardDescription>PDF veya resim dosyası yükleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.official_invoice_url ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium flex-1">Fatura yüklendi</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <a href={invoice.official_invoice_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        İndir
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFileDelete}
                      disabled={deleteFile.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Yükleniyor...' : 'Fatura Yükle'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, JPG veya PNG (Maks. 5MB)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax Receipt Upload (for invoices that don't require official invoice) */}
          {!invoice.requires_official_invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vergi Dekontu</CardTitle>
                <CardDescription>Mükerrer 20/B kapsamında vergi ödeme dekontu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoice.tax_receipt_url ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium flex-1">Dekont yüklendi</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <a href={invoice.tax_receipt_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          İndir
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTaxReceiptDelete}
                        disabled={deleteTaxReceipt.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleTaxReceiptUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Yükleniyor...' : 'Dekont Yükle'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PDF, JPG veya PNG (Maks. 5MB)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
