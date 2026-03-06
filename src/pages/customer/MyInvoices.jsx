import { useState } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCustomers } from '@/hooks/useCustomers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Eye, Download, Printer } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'

export default function MyInvoices() {
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { profile } = useAuth()
  const { data: allInvoices, isLoading, error } = useInvoices()
  const { data: customers } = useCustomers()

  // Find current customer
  const currentCustomer = customers?.find(c => c.email === profile?.email)

  // Filter invoices for current customer
  const invoices = allInvoices?.filter(invoice => invoice.customer_id === currentCustomer?.id)

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

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice)
    setDetailsOpen(true)
  }

  const handleDownloadInvoice = async (invoice) => {
    try {
      // Create invoice HTML content
      const invoiceHTML = generateInvoiceHTML(invoice, currentCustomer)

      // Create a blob and download
      const blob = new Blob([invoiceHTML], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `fatura_${invoice.invoice_number}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Fatura indirildi', {
        description: `${invoice.invoice_number} numaralı fatura indirildi`
      })
    } catch (error) {
      console.error('Download error:', error)
      toast.error('İndirme başarısız', {
        description: error.message
      })
    }
  }

  const handlePrintInvoice = () => {
    window.print()
  }

  const generateInvoiceHTML = (invoice, customer) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Fatura ${invoice.invoice_number}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .invoice-details { margin-bottom: 30px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    .items-table th { background-color: #f5f5f5; }
    .totals { text-align: right; margin-top: 20px; }
    .total-row { font-size: 18px; font-weight: bold; margin-top: 10px; }
    @media print {
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Customer Panel</h1>
      <p>Hosting & Domain Hizmetleri</p>
    </div>
    <div>
      <h2>FATURA</h2>
      <p><strong>Fatura No:</strong> ${invoice.invoice_number}</p>
      <p><strong>Tarih:</strong> ${formatDate(invoice.invoice_date)}</p>
      <p><strong>Vade:</strong> ${formatDate(invoice.due_date)}</p>
    </div>
  </div>

  <div class="invoice-details">
    <h3>Müşteri Bilgileri</h3>
    <p><strong>Ad Soyad:</strong> ${customer?.full_name || '-'}</p>
    <p><strong>E-posta:</strong> ${customer?.email || '-'}</p>
    <p><strong>Telefon:</strong> ${customer?.phone || '-'}</p>
    <p><strong>Adres:</strong> ${customer?.billing_address || '-'}</p>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Hizmet Açıklaması</th>
        <th>Miktar</th>
        <th>Birim Fiyat</th>
        <th>Toplam</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items?.map(item => `
        <tr>
          <td>${item.description || '-'}</td>
          <td>${item.quantity || 1}</td>
          <td>${formatCurrency(item.unit_price || 0)}</td>
          <td>${formatCurrency(item.total || 0)}</td>
        </tr>
      `).join('') || '<tr><td colspan="4">Kalem bulunamadı</td></tr>'}
    </tbody>
  </table>

  <div class="totals">
    <p><strong>Ara Toplam:</strong> ${formatCurrency(invoice.subtotal || 0)}</p>
    <p><strong>KDV (%${invoice.tax_rate || 20}):</strong> ${formatCurrency(invoice.tax_amount || 0)}</p>
    <p class="total-row"><strong>TOPLAM:</strong> ${formatCurrency(invoice.total_amount || 0)}</p>
  </div>

  <div style="margin-top: 40px; text-align: center; color: #666;">
    <p>Bu fatura elektronik olarak oluşturulmuştur.</p>
  </div>
</body>
</html>
    `.trim()
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewInvoice(invoice)}
                          title="Görüntüle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadInvoice(invoice)}
                          title="İndir"
                        >
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

      {/* Invoice Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Fatura Detayları</DialogTitle>
            <DialogDescription>
              Fatura No: {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Invoice Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-md">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Fatura Tarihi</div>
                <div className="font-medium">{formatDate(selectedInvoice?.invoice_date)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Vade Tarihi</div>
                <div className="font-medium">{formatDate(selectedInvoice?.due_date)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Durum</div>
                <div>{getStatusBadge(selectedInvoice?.status)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Toplam Tutar</div>
                <div className="font-bold text-lg">{formatCurrency(selectedInvoice?.total_amount)}</div>
              </div>
            </div>

            {/* Invoice Items */}
            <div>
              <h4 className="font-semibold mb-3">Fatura Kalemleri</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead className="text-right">Birim Fiyat</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice?.items?.length > 0 ? (
                    selectedInvoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description || '-'}</TableCell>
                        <TableCell className="text-right">{item.quantity || 1}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price || 0)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.total || 0)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Kalem bulunamadı
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-3 border-t">
              <div className="flex justify-between">
                <span className="text-sm">Ara Toplam:</span>
                <span className="font-medium">{formatCurrency(selectedInvoice?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">KDV (%{selectedInvoice?.tax_rate || 20}):</span>
                <span className="font-medium">{formatCurrency(selectedInvoice?.tax_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>TOPLAM:</span>
                <span>{formatCurrency(selectedInvoice?.total_amount || 0)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => handleDownloadInvoice(selectedInvoice)}
              >
                <Download className="h-4 w-4 mr-2" />
                İndir
              </Button>
              <Button
                variant="default"
                onClick={handlePrintInvoice}
              >
                <Printer className="h-4 w-4 mr-2" />
                Yazdır
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
