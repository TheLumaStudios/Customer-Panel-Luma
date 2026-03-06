import { useState } from 'react'
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from '@/hooks/useInvoices'
import { useCustomers } from '@/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Eye, FileText, RefreshCw, DollarSign, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import InvoiceDetails from '@/components/invoices/InvoiceDetails'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'

export default function Invoices() {
  const { data: invoices, isLoading, error, refetch } = useInvoices()
  const { data: customers } = useCustomers()
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const deleteInvoice = useDeleteInvoice()

  const [formOpen, setFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const handleCreate = () => {
    setEditingInvoice(null)
    setFormOpen(true)
  }

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice)
    setFormOpen(true)
  }

  const handleView = (invoice) => {
    setViewingInvoice(invoice)
    setDetailsOpen(true)
  }

  const handleSubmit = async (data) => {
    try {
      if (editingInvoice) {
        await updateInvoice.mutateAsync({ id: editingInvoice.id, data })
        toast.success('Fatura başarıyla güncellendi', {
          description: `Fatura #${data.invoice_number} güncellendi`,
          action: {
            label: 'Görüntüle',
            onClick: () => handleView(editingInvoice)
          }
        })
      } else {
        const result = await createInvoice.mutateAsync(data)
        toast.success('Fatura başarıyla oluşturuldu', {
          description: `Fatura #${data.invoice_number} oluşturuldu`,
          action: {
            label: 'Görüntüle',
            onClick: () => handleView(result)
          }
        })
      }
      setFormOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Fatura kaydedilemedi', {
        description: error.message
      })
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Bu faturayı silmek istediğinizden emin misiniz?')) {
      try {
        await deleteInvoice.mutateAsync(id)
        toast.success('Fatura başarıyla silindi', {
          description: 'Fatura kaydı sistemden kaldırıldı'
        })
      } catch (error) {
        toast.error('Fatura silinemedi', {
          description: error.message
        })
      }
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
      paid: { variant: 'default', label: 'Ödendi', className: 'bg-green-100 text-green-800 border-green-200' },
      pending: { variant: 'secondary', label: 'Beklemede', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      overdue: { variant: 'destructive', label: 'Vadesi Geçti', className: 'bg-red-100 text-red-800 border-red-200' },
      cancelled: { variant: 'secondary', label: 'İptal', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    }
    const { label, className } = config[status]
    return <Badge variant="outline" className={className}>{label}</Badge>
  }

  // Calculate summary statistics
  const totalRevenue = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0) || 0
  const pendingAmount = invoices?.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.total_amount, 0) || 0
  const overdueAmount = invoices?.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total_amount, 0) || 0

  // Filter invoices
  const filteredInvoices = invoices?.filter(inv => {
    if (statusFilter === 'all') return true
    return inv.status === statusFilter
  }) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturalar</h1>
          <p className="text-muted-foreground mt-1">
            Tüm faturaları görüntüleyin ve yönetin
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Fatura
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices?.filter(inv => inv.status === 'paid').length || 0} ödenen fatura
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
              {invoices?.filter(inv => inv.status === 'pending').length || 0} bekleyen fatura
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
              {invoices?.filter(inv => inv.status === 'overdue').length || 0} vadesi geçmiş fatura
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
                {statusFilter === 'all'
                  ? `Toplam ${invoices?.length || 0} fatura`
                  : `${filteredInvoices.length} fatura (${invoices?.length || 0} toplam)`
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Faturalar</SelectItem>
                  <SelectItem value="paid">Ödenenler</SelectItem>
                  <SelectItem value="pending">Bekleyenler</SelectItem>
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
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">
                {statusFilter === 'all'
                  ? 'Henüz fatura bulunmuyor'
                  : 'Bu filtreye uygun fatura bulunamadı'
                }
              </p>
              {statusFilter === 'all' && (
                <p className="text-sm mt-1">Yeni bir fatura oluşturun</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Fatura Tarihi</TableHead>
                  <TableHead>Vade Tarihi</TableHead>
                  <TableHead>Ödeme Tarihi</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {invoice.customer?.profile?.full_name || invoice.customer?.full_name || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.customer?.customer_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(invoice.invoice_date)}
                      </div>
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
                      {invoice.payment_date ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          {formatDate(invoice.payment_date)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 font-semibold">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatCurrency(invoice.total_amount)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(invoice)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <InvoiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        invoice={editingInvoice}
        customers={customers}
        onSubmit={handleSubmit}
      />

      <InvoiceDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        invoice={viewingInvoice}
      />
    </div>
  )
}
