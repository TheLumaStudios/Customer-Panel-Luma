import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Building2, User, Calendar, Clock, DollarSign, FileText, CheckCircle2, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useSettings } from '@/hooks/useSettings'

export default function InvoiceDetails({ open, onOpenChange, invoice }) {
  const { data: settings } = useSettings()

  if (!invoice) return null

  console.log('Invoice data:', invoice)
  console.log('Invoice items:', invoice.invoice_items)

  const handleDownloadPDF = () => {
    const doc = new jsPDF()

    const customerName = invoice.customer?.full_name || invoice.customer?.profile?.full_name || '-'
    const customerCode = invoice.customer?.customer_code || '-'
    const companyName = invoice.customer?.company_name || ''
    const customerEmail = invoice.customer?.email || ''
    const customerPhone = invoice.customer?.phone || ''

    // Get settings or use defaults
    const companyInfo = {
      name: settings?.company_name || 'SIRKET ADIN',
      slogan: settings?.company_slogan || 'Musteri ve Hizmet Yonetim Sistemleri',
      website: settings?.company_website || 'www.sirketiniz.com',
      email: settings?.company_email || 'info@sirketiniz.com',
      phone: settings?.company_phone || '+90 (212) 123 45 67',
      address: settings?.company_address || '',
      taxOffice: settings?.company_tax_office || '',
      taxNumber: settings?.company_tax_number || '',
    }

    const bankInfo = {
      name: settings?.bank_name || 'Ziraat Bankasi',
      iban: settings?.bank_iban || 'TR00 0000 0000 0000 0000 0000 00',
      accountName: settings?.bank_account_name || 'SIRKET ADIN',
      swift: settings?.bank_swift || '',
      branch: settings?.bank_branch || '',
    }

    const supportInfo = {
      email: settings?.support_email || 'destek@sirketiniz.com',
      phone: settings?.support_phone || '+90 (212) 123 45 67',
    }

    const invoiceSettings = {
      footerText: settings?.invoice_footer_text || 'Bu belge elektronik ortamda olusturulmus olup, dijital imza ile gecerlidir.',
      legalText: settings?.invoice_legal_text || 'Isbu sozlesme elektronik ortamda taraflarin karsilikli irade beyani ile akdedilmistir. Sistem tarafindan atanan benzersiz islem numarasi ve zaman damgasi kayitlari kesin delil niteligindedir.',
      notes: settings?.invoice_notes || '',
      taxRate: Number(settings?.default_tax_rate || 0),
    }

    const primaryColor = [0, 0, 0] // Siyah
    const accentColor = [245, 245, 245] // #f5f5f5
    const darkGray = [0, 0, 0] // Siyah
    const lightGray = [245, 245, 245] // #f5f5f5

    // ============ HEADER ============
    // Top accent line (thin black line at very top)
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(2)
    doc.line(0, 0, 210, 0)

    // Company Name - Large and bold
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(32)
    doc.setFont('helvetica', 'bold')
    doc.text(companyInfo.name, 20, 22)

    // Slogan - Elegant subtitle
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(companyInfo.slogan, 20, 30)

    // Contact info - Smaller, lighter
    doc.setFontSize(8)
    doc.text(`${companyInfo.website}`, 20, 37)
    doc.text(`${companyInfo.email} | ${companyInfo.phone}`, 20, 42)

    // FATURA Label - Right side with sophisticated styling
    doc.setFillColor(245, 245, 245)
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.5)
    doc.roundedRect(145, 10, 50, 32, 2, 2, 'FD')

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('FATURA', 170, 18, { align: 'center' })

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(invoice.invoice_number, 170, 28, { align: 'center' })

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(formatDate(invoice.invoice_date), 170, 36, { align: 'center' })

    // Elegant separator line
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.3)
    doc.line(20, 50, 195, 50)

    // ============ INFO SECTION ============
    doc.setTextColor(0, 0, 0)

    // Left Box - Faturalanan Firma (FROM)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text('FATURALAYAN', 20, 58)

    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.setFillColor(252, 252, 252)
    doc.roundedRect(20, 60, 82, 42, 1, 1, 'FD')

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(companyInfo.name, 24, 68)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    let yPos = 74
    if (companyInfo.address) {
      const addressLines = doc.splitTextToSize(companyInfo.address, 74)
      doc.text(addressLines, 24, yPos)
      yPos += addressLines.length * 4
    }
    if (companyInfo.taxOffice) {
      doc.text(`${companyInfo.taxOffice}`, 24, yPos)
      yPos += 4
    }
    if (companyInfo.taxNumber) {
      doc.text(`VKN: ${companyInfo.taxNumber}`, 24, yPos)
    }

    // Right Box - Musteri Bilgileri (TO)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text('FATURALANAN', 113, 58)

    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.setFillColor(252, 252, 252)
    doc.roundedRect(113, 60, 82, 42, 1, 1, 'FD')

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(customerName, 117, 68)

    if (companyName) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text(companyName, 117, 74)
    }

    const customerDetailsY = companyName ? 80 : 74
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    doc.text(`Kod: ${customerCode}`, 117, customerDetailsY)

    if (customerEmail) {
      doc.text(customerEmail, 117, customerDetailsY + 5)
    }
    if (customerPhone) {
      doc.text(customerPhone, 117, customerDetailsY + 10)
    }

    // Invoice details - small box on the right
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text('FATURA DETAYLARI', 113, 110)

    doc.setDrawColor(220, 220, 220)
    doc.setFillColor(252, 252, 252)
    doc.roundedRect(113, 112, 82, 20, 1, 1, 'FD')

    doc.setTextColor(80, 80, 80)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Vade Tarihi:', 117, 118)
    doc.setFont('helvetica', 'bold')
    doc.text(formatDate(invoice.due_date), 190, 118, { align: 'right' })

    if (invoice.payment_date) {
      doc.setFont('helvetica', 'normal')
      doc.text('Odeme Tarihi:', 117, 123)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(34, 197, 94)
      doc.text(formatDate(invoice.payment_date), 190, 123, { align: 'right' })
    }

    // Status badge
    const statusY = invoice.payment_date ? 128 : 123
    const statusText = invoice.status === 'paid' ? 'ODENDI' :
                       invoice.status === 'pending' ? 'BEKLEMEDE' :
                       invoice.status === 'overdue' ? 'VADESI GECTI' : 'IPTAL'
    const statusBg = invoice.status === 'paid' ? [220, 252, 231] :
                        invoice.status === 'pending' ? [254, 249, 195] :
                        invoice.status === 'overdue' ? [254, 226, 226] : [243, 244, 246]
    const statusTextColor = invoice.status === 'paid' ? [21, 128, 61] :
                        invoice.status === 'pending' ? [161, 98, 7] :
                        invoice.status === 'overdue' ? [185, 28, 28] : [75, 85, 99]

    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2])
    doc.setDrawColor(statusTextColor[0], statusTextColor[1], statusTextColor[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(117, statusY - 3, 73, 6, 1, 1, 'FD')
    doc.setTextColor(statusTextColor[0], statusTextColor[1], statusTextColor[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text(statusText, 153.5, statusY, { align: 'center' })

    // ============ ITEMS TABLE ============
    const tableData = invoice.invoice_items?.map((item, index) => {
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unit_price)
      const total = quantity * unitPrice

      return [
        (index + 1).toString(),
        item.description,
        quantity.toString(),
        unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ]
    }) || []

    const subtotal = invoice.invoice_items?.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.unit_price))
    }, 0) || 0

    const taxAmount = (subtotal * invoiceSettings.taxRate) / 100
    const grandTotal = subtotal + taxAmount

    // Items table title
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('FATURA KALEMLERI', 20, 144)

    autoTable(doc, {
      startY: 148,
      head: [['#', 'ACIKLAMA', 'MIKTAR', 'BIRIM FIYAT', 'TUTAR']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [250, 250, 250],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        halign: 'left',
        valign: 'middle',
        lineWidth: { bottom: 0.5 },
        lineColor: [0, 0, 0]
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
        textColor: [0, 0, 0],
        lineWidth: 0,
      },
      alternateRowStyles: {
        fillColor: [252, 252, 252]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', textColor: [120, 120, 120], fontSize: 8 },
        1: { cellWidth: 95 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'right', cellWidth: 28 },
        4: { halign: 'right', cellWidth: 31, fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 },
      didDrawPage: (data) => {
        // Add subtle bottom border to each row
        if (data.row && data.row.section === 'body') {
          doc.setDrawColor(240, 240, 240)
          doc.setLineWidth(0.1)
        }
      }
    })

    // ============ TOTALS ============
    const finalY = doc.lastAutoTable.finalY + 8

    const totalsX = 128
    const totalsWidth = 67

    // Thin separator line
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.3)
    doc.line(totalsX, finalY - 2, totalsX + totalsWidth, finalY - 2)

    // Subtotal
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text('Ara Toplam:', totalsX + 2, finalY + 4)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL', totalsX + totalsWidth - 2, finalY + 4, { align: 'right' })

    // KDV
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(`KDV (%${invoiceSettings.taxRate}):`, totalsX + 2, finalY + 10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(taxAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL', totalsX + totalsWidth - 2, finalY + 10, { align: 'right' })

    // Separator before grand total
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(totalsX, finalY + 13, totalsX + totalsWidth, finalY + 13)

    // Grand Total - Prominent
    doc.setFillColor(250, 250, 250)
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.roundedRect(totalsX, finalY + 15, totalsWidth, 10, 1, 1, 'FD')

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('ODENECEK TUTAR:', totalsX + 2, finalY + 21)
    doc.setFontSize(13)
    doc.text(grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL', totalsX + totalsWidth - 2, finalY + 21, { align: 'right' })

    // ============ PAYMENT & NOTES ============
    const extraInfoY = finalY + 32

    if (invoice.status !== 'paid') {
      // Payment Info
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('ODEME BILGILERI', 20, extraInfoY)

      doc.setFillColor(252, 252, 252)
      doc.setDrawColor(230, 230, 230)
      doc.setLineWidth(0.3)
      doc.roundedRect(20, extraInfoY + 2, 90, 22, 1, 1, 'FD')

      doc.setTextColor(80, 80, 80)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text('Banka:', 24, extraInfoY + 8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(bankInfo.name, 24, extraInfoY + 12)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text('IBAN:', 24, extraInfoY + 16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      doc.text(bankInfo.iban, 24, extraInfoY + 20)
    }

    // Notes
    const displayNotes = invoice.notes || invoiceSettings.notes
    if (displayNotes) {
      const notesX = invoice.status !== 'paid' ? 115 : 20
      const notesWidth = invoice.status !== 'paid' ? 80 : 175

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('NOTLAR', notesX, extraInfoY)

      doc.setFillColor(255, 253, 245)
      doc.setDrawColor(240, 230, 200)
      doc.setLineWidth(0.3)
      doc.roundedRect(notesX, extraInfoY + 2, notesWidth, 22, 1, 1, 'FD')

      doc.setTextColor(60, 60, 60)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      const splitNotes = doc.splitTextToSize(displayNotes, notesWidth - 8)
      doc.text(splitNotes, notesX + 4, extraInfoY + 7)
    }

    // ============ FOOTER ============
    // Elegant separator
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.3)
    doc.line(20, 268, 195, 268)

    // Footer text - clean and minimal
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.setFont('helvetica', 'normal')
    doc.text(invoiceSettings.footerText, 105, 274, { align: 'center' })

    doc.setFontSize(6)
    doc.setTextColor(140, 140, 140)
    doc.text(`${supportInfo.email} | ${supportInfo.phone}`, 105, 279, { align: 'center' })

    // Legal text - very subtle
    doc.setFontSize(5)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'italic')
    const splitLegalText = doc.splitTextToSize(invoiceSettings.legalText, 170)
    doc.text(splitLegalText, 105, 284, { align: 'center' })

    // Creation timestamp - bottom right corner
    doc.setFontSize(5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 180, 180)
    doc.text(`Olusturulma: ${new Date().toLocaleString('tr-TR')}`, 195, 292, { align: 'right' })

    // Page number - bottom left
    doc.text('Sayfa 1/1', 20, 292)

    // Save PDF
    doc.save(`Fatura-${invoice.invoice_number}.pdf`)
  }

  const getStatusBadge = (status) => {
    const config = {
      paid: { label: 'Ödendi', className: 'bg-green-100 text-green-800 border-green-200' },
      pending: { label: 'Beklemede', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      overdue: { label: 'Vadesi Geçti', className: 'bg-red-100 text-red-800 border-red-200' },
      cancelled: { label: 'İptal', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    }
    const { label, className } = config[status] || config.pending
    return <Badge variant="outline" className={className}>{label}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Fatura Detayları</DialogTitle>
            {getStatusBadge(invoice.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Fatura Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Fatura No</span>
              </div>
              <p className="font-semibold text-lg">{invoice.invoice_number}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Toplam Tutar</span>
              </div>
              <p className="font-bold text-2xl">{formatCurrency(invoice.total_amount)}</p>
            </div>
          </div>

          <Separator />

          {/* Müşteri Bilgileri */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Müşteri Bilgileri
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Müşteri Adı</p>
                <p className="font-medium">
                  {invoice.customer?.full_name || invoice.customer?.profile?.full_name || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Müşteri Kodu</p>
                <p className="font-medium">{invoice.customer?.customer_code || '-'}</p>
              </div>
              {invoice.customer?.company_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{invoice.customer.company_name}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Tarih Bilgileri */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Fatura Tarihi</span>
              </div>
              <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Vade Tarihi</span>
              </div>
              <p className="font-medium">{formatDate(invoice.due_date)}</p>
            </div>
            {invoice.payment_date && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span>Ödeme Tarihi</span>
                </div>
                <p className="font-medium text-green-700">{formatDate(invoice.payment_date)}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Fatura Kalemleri */}
          <div className="space-y-3">
            <h3 className="font-semibold">Fatura Kalemleri</h3>
            {!invoice.invoice_items || invoice.invoice_items.length === 0 ? (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <p>Fatura kalemi bulunamadı</p>
                <p className="text-xs mt-2">Debug: invoice_items = {JSON.stringify(invoice.invoice_items)}</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm">
                      <th className="p-3 font-medium">Açıklama</th>
                      <th className="p-3 font-medium text-center w-20">Adet</th>
                      <th className="p-3 font-medium text-right w-32">Birim Fiyat</th>
                      <th className="p-3 font-medium text-right w-32">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.invoice_items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">{item.description}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(item.total_price || (item.quantity * item.unit_price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-muted/30">
                    <tr>
                      <td colSpan="3" className="p-3 text-right font-semibold">
                        Ara Toplam:
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(invoice.subtotal || invoice.total_amount)}
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td colSpan="3" className="p-3 text-right font-bold text-lg">
                        Genel Toplam:
                      </td>
                      <td className="p-3 text-right font-bold text-lg">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Notlar */}
          {invoice.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Notlar</h3>
                <p className="text-sm bg-muted/50 rounded-lg p-3">{invoice.notes}</p>
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button variant="default" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF İndir
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
