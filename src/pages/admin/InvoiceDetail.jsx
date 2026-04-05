import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
