import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { exportToCSV, exportToExcel } from '@/lib/export'
import { toast } from '@/lib/toast'

/**
 * Export button with CSV and Excel options
 * @param {Array} data - Data to export
 * @param {Array} columns - Column configuration [{key, label}]
 * @param {string} filename - Output filename (without extension)
 * @param {boolean} selectedOnly - Export only selected rows
 */
export default function ExportButton({
  data,
  columns,
  filename = 'export',
  selectedOnly = false,
  variant = 'outline',
  size = 'sm',
  className
}) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format) => {
    if (!data || data.length === 0) {
      toast.error('Dışa aktarılacak veri bulunamadı', {
        description: selectedOnly
          ? 'Lütfen en az bir satır seçin'
          : 'Tabloda veri bulunmuyor'
      })
      return
    }

    setIsExporting(true)

    try {
      if (format === 'csv') {
        exportToCSV(data, columns, filename)
        toast.success('CSV olarak dışa aktarıldı', {
          description: `${data.length} kayıt dışa aktarıldı`
        })
      } else if (format === 'excel') {
        exportToExcel(data, columns, filename)
        toast.success('Excel olarak dışa aktarıldı', {
          description: `${data.length} kayıt dışa aktarıldı`
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Dışa aktarma başarısız', {
        description: error.message
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isExporting}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Aktarılıyor...' : 'Dışa Aktar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {selectedOnly
            ? `${data?.length || 0} seçili kayıt`
            : `${data?.length || 0} kayıt`}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          <FileText className="h-4 w-4 mr-2" />
          CSV formatında
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel formatında
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Common column configurations for different tables
 */
export const commonExportColumns = {
  customers: [
    { key: 'customer_code', label: 'Müşteri Kodu' },
    { key: 'full_name', label: 'Ad Soyad' },
    { key: 'email', label: 'E-posta' },
    { key: 'phone', label: 'Telefon' },
    { key: 'company_name', label: 'Şirket' },
    { key: 'status', label: 'Durum' },
    { key: 'created_at', label: 'Kayıt Tarihi' },
  ],
  invoices: [
    { key: 'invoice_number', label: 'Fatura No' },
    { key: 'customer_name', label: 'Müşteri' },
    { key: 'amount', label: 'Tutar' },
    { key: 'tax_amount', label: 'KDV' },
    { key: 'total_amount', label: 'Toplam' },
    { key: 'status', label: 'Durum' },
    { key: 'invoice_date', label: 'Fatura Tarihi' },
    { key: 'due_date', label: 'Vade Tarihi' },
  ],
  domains: [
    { key: 'domain_name', label: 'Domain Adı' },
    { key: 'customer_name', label: 'Müşteri' },
    { key: 'registrar', label: 'Registrar' },
    { key: 'registration_date', label: 'Kayıt Tarihi' },
    { key: 'expiration_date', label: 'Bitiş Tarihi' },
    { key: 'status', label: 'Durum' },
  ],
  hosting: [
    { key: 'domain', label: 'Domain' },
    { key: 'customer_name', label: 'Müşteri' },
    { key: 'package_name', label: 'Paket' },
    { key: 'disk_space_gb', label: 'Disk (GB)' },
    { key: 'bandwidth_gb', label: 'Bant Genişliği (GB)' },
    { key: 'start_date', label: 'Başlangıç' },
    { key: 'expiration_date', label: 'Bitiş' },
    { key: 'status', label: 'Durum' },
  ],
}
