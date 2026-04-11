import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useInvoices, usePayInvoice, useCreateInvoice, useDeleteInvoice, useUpdateInvoice } from '@/hooks/useInvoices'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { initializeIyzicoPayment } from '@/lib/api/invoices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
import { Plus, Eye, FileText, RefreshCw, DollarSign, AlertCircle, CheckCircle2, CreditCard, Wallet, Trash2, Pencil } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'

export default function Invoices() {
  const { profile } = useAuth()
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [editInvoiceData, setEditInvoiceData] = useState(null)
  const [customerComboOpen, setCustomerComboOpen] = useState(false)
  const [editCustomerComboOpen, setEditCustomerComboOpen] = useState(false)

  const { data: invoicesData, isLoading, error, refetch } = useInvoices({
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  // Fetch all active customers directly
  const { data: customerProfiles } = useQuery({
    queryKey: ['customer-profiles-for-invoice'],
    queryFn: async () => {
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, customer_code, full_name, email, status')
        .eq('status', 'active')
        .order('full_name')

      if (customersError) throw customersError

      // Return customers with their ID for invoice creation
      return customers?.map(c => ({
        id: c.id, // Use customer.id directly for invoice customer_id
        full_name: c.full_name,
        email: c.email,
        customer_code: c.customer_code,
      })) || []
    }
  })

  const payInvoice = usePayInvoice()
  const createInvoice = useCreateInvoice()
  const deleteInvoice = useDeleteInvoice()
  const updateInvoice = useUpdateInvoice()

  const invoices = invoicesData?.invoices || []
  const total = invoicesData?.total || 0

  // Debug log
  const [newInvoiceData, setNewInvoiceData] = useState({
    customer_id: '',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'TRY',
    tax_rate: 0,
    notes: '',
    invoice_type: 'official', // 'official' or 'mukerrer_20b'
    requires_official_invoice: true,
    items: [{ type: 'service', description: '', quantity: 1, unit_price: 0 }]
  })

  const handleCreateInvoice = async () => {
    try {
      const selectedCustomer = customerProfiles?.find(c => c.id === newInvoiceData.customer_id)
      await createInvoice.mutateAsync(newInvoiceData)
      toast.success('Fatura oluşturuldu', {
        description: 'Yeni fatura başarıyla oluşturuldu'
      })
      setCreateModalOpen(false)
      setNewInvoiceData({
        customer_id: '',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'TRY',
        tax_rate: 0,
        notes: '',
        invoice_type: 'official',
        requires_official_invoice: true,
        items: [{ type: 'service', description: '', quantity: 1, unit_price: 0 }]
      })
    } catch (error) {
      console.error('Invoice creation error:', error)
      toast.error('Fatura oluşturulamadı', {
        description: error.message
      })
    }
  }

  const addInvoiceItem = () => {
    setNewInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { type: 'service', description: '', quantity: 1, unit_price: 0 }]
    }))
  }

  const removeInvoiceItem = (index) => {
    setNewInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateInvoiceItem = (index, field, value) => {
    setNewInvoiceData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const handlePayInvoice = async (paymentMethod) => {
    try {
      // iyzico için özel akış
      if (paymentMethod === 'iyzico') {
        setPaymentModalOpen(false)

        // iyzico ödeme sayfasına yönlendir
        const result = await initializeIyzicoPayment(
          selectedInvoice.id,
          `${window.location.origin}/payment-callback`
        )

        if (result.success && result.paymentPageUrl) {
          // iyzico ödeme sayfasına yönlendir
          window.location.href = result.paymentPageUrl
        } else {
          throw new Error('iyzico ödeme sayfası açılamadı')
        }
        return
      }

      // Diğer ödeme yöntemleri için mevcut akış
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

  const handleDeleteInvoice = async (invoiceId, invoiceNumber) => {
    if (!confirm(`${invoiceNumber} numaralı faturayı silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      await deleteInvoice.mutateAsync(invoiceId)
      toast.success('Fatura silindi', {
        description: `${invoiceNumber} numaralı fatura başarıyla silindi`,
      })
    } catch (error) {
      toast.error('Fatura silinemedi', {
        description: error.message,
      })
    }
  }

  const handleEditClick = (invoice) => {
    setSelectedInvoice(invoice)
    setEditInvoiceData({
      customer_id: invoice.customer_id,
      due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
      currency: invoice.currency || 'TRY',
      tax_rate: invoice.tax ? (invoice.tax / (invoice.subtotal || 1)) * 100 : 0,
      notes: invoice.notes || '',
      admin_notes: invoice.admin_notes || '',
      status: invoice.status,
      requires_official_invoice: invoice.requires_official_invoice !== false, // default true
      items: invoice.items?.length > 0
        ? invoice.items.map(item => ({
            type: item.type || 'service',
            description: item.description,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0
          }))
        : [{ type: 'service', description: '', quantity: 1, unit_price: 0 }]
    })
    setEditModalOpen(true)
  }

  const handleUpdateInvoice = async () => {
    try {
      // Calculate totals
      const subtotal = editInvoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      const tax = (subtotal * editInvoiceData.tax_rate) / 100
      const total = subtotal + tax

      await updateInvoice.mutateAsync({
        id: selectedInvoice.id,
        data: {
          customer_id: editInvoiceData.customer_id,
          due_date: editInvoiceData.due_date,
          currency: editInvoiceData.currency,
          subtotal,
          tax,
          total,
          total_amount: total,
          notes: editInvoiceData.notes,
          admin_notes: editInvoiceData.admin_notes,
          status: editInvoiceData.status,
          requires_official_invoice: editInvoiceData.requires_official_invoice,
          items: editInvoiceData.items,
        }
      })
      toast.success('Fatura güncellendi', {
        description: `${selectedInvoice.invoice_number} numaralı fatura başarıyla güncellendi`,
      })
      setEditModalOpen(false)
      setSelectedInvoice(null)
      setEditInvoiceData(null)
    } catch (error) {
      toast.error('Fatura güncellenemedi', {
        description: error.message,
      })
    }
  }

  const addEditInvoiceItem = () => {
    setEditInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { type: 'service', description: '', quantity: 1, unit_price: 0 }]
    }))
  }

  const removeEditInvoiceItem = (index) => {
    setEditInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateEditInvoiceItem = (index, field, value) => {
    setEditInvoiceData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
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

  // Calculate summary statistics
  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.subtotal || 0), 0) // KDV hariç
  const pendingAmount = invoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + getInvoiceTotal(inv), 0)
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + getInvoiceTotal(inv), 0)
  const missingOfficialInvoice = invoices.filter(inv =>
    inv.status === 'paid' &&
    inv.requires_official_invoice !== false &&
    !inv.official_invoice_url
  )

  // Calculate revenue breakdown by type
  const officialInvoiceRevenue = invoices.filter(inv =>
    inv.status === 'paid' && inv.requires_official_invoice !== false
  ).reduce((sum, inv) => sum + (inv.subtotal || 0), 0) // KDV hariç

  const mukerrerRevenue = invoices.filter(inv =>
    inv.status === 'paid' && inv.requires_official_invoice === false
  ).reduce((sum, inv) => sum + (inv.subtotal || 0), 0) // KDV hariç

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturalar</h1>
          <p className="text-muted-foreground mt-1">
            Tüm faturaları görüntüleyin ve yönetin
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Fatura
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue, invoices[0]?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'paid').length} ödenen fatura (KDV hariç)
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resmi Fatura Eksik</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{missingOfficialInvoice.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(missingOfficialInvoice.reduce((sum, inv) => sum + getInvoiceTotal(inv), 0), invoices[0]?.currency)} toplam
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resmi Fatura Geliri</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(officialInvoiceRevenue, invoices[0]?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'paid' && inv.requires_official_invoice !== false).length} fatura (KDV hariç)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mükerrer 20/B Geliri</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(mukerrerRevenue, invoices[0]?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'paid' && inv.requires_official_invoice === false).length} fatura (KDV hariç)
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
                  <SelectItem value="all">Tüm Faturalar</SelectItem>
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
                  <TableHead>Tip</TableHead>
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
                      {formatCurrency(getInvoiceTotal(invoice), invoice.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {invoice.invoice_type === 'mukerrer_20b' ? (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Mükerrer 20/B
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Resmi Fatura
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link to={`/${profile?.role === 'employee' ? 'employee' : 'admin'}/invoice/${invoice.id}`}>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditClick(invoice)}
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteInvoice(invoice.id, invoice.invoice_number)}
                          disabled={deleteInvoice.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
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
              variant="default"
              onClick={() => handlePayInvoice('iyzico')}
              disabled={payInvoice.isPending}
              className="w-full sm:w-auto bg-[#00A6FF] hover:bg-[#0088CC]"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Kredi Kartı (iyzico)
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePayInvoice('bank_transfer')}
              disabled={payInvoice.isPending}
              className="w-full sm:w-auto"
            >
              Manuel Ödeme İşaretle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Fatura Oluştur</DialogTitle>
            <DialogDescription>
              Müşteri seçin ve fatura detaylarını girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label htmlFor="customer">Müşteri *</Label>
              <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerComboOpen}
                    className="w-full justify-between bg-white border-gray-300"
                  >
                    {newInvoiceData.customer_id ? (
                      <span className="truncate">
                        {customerProfiles?.find(c => c.id === newInvoiceData.customer_id)?.full_name}
                        ({customerProfiles?.find(c => c.id === newInvoiceData.customer_id)?.customer_code})
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Müşteri ara ve seç...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[500px] p-0 z-[9999]"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command shouldFilter={true}>
                    <CommandInput placeholder="Ad, kod, email ile ara..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
                      <CommandGroup className="pointer-events-auto">
                        {customerProfiles?.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.full_name} ${customer.customer_code} ${customer.email}`.toLowerCase()}
                            onSelect={() => {
                              setNewInvoiceData(prev => ({ ...prev, customer_id: customer.id }))
                              setCustomerComboOpen(false)
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setNewInvoiceData(prev => ({ ...prev, customer_id: customer.id }))
                              setCustomerComboOpen(false)
                            }}
                            disabled={false}
                            data-disabled="false"
                            className="cursor-pointer hover:bg-accent opacity-100 pointer-events-auto"
                            style={{ opacity: 1, pointerEvents: 'auto' }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                newInvoiceData.customer_id === customer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col flex-1">
                              <div className="font-medium">{customer.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {customer.customer_code} • {customer.email}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Invoice Type */}
            <div className="space-y-2">
              <Label>Fatura Tipi *</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="invoice_type"
                    value="official"
                    checked={newInvoiceData.invoice_type === 'official'}
                    onChange={(e) => setNewInvoiceData(prev => ({
                      ...prev,
                      invoice_type: e.target.value,
                      requires_official_invoice: true
                    }))}
                    className="w-4 h-4"
                  />
                  <span>Resmi Fatura</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="invoice_type"
                    value="mukerrer_20b"
                    checked={newInvoiceData.invoice_type === 'mukerrer_20b'}
                    onChange={(e) => setNewInvoiceData(prev => ({
                      ...prev,
                      invoice_type: e.target.value,
                      requires_official_invoice: false
                    }))}
                    className="w-4 h-4"
                  />
                  <span>Mükerrer 20/B</span>
                </label>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Vade Tarihi *</Label>
              <Input
                id="due_date"
                type="date"
                className="border border-gray-300 bg-white"
                value={newInvoiceData.due_date}
                onChange={(e) => setNewInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label>Fatura Kalemleri *</Label>
              <div className="space-y-2">
                {newInvoiceData.items.map((item, index) => (
                  <Card key={index} className="p-3">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <Input
                          placeholder="Açıklama"
                          className="border border-gray-300 bg-white"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Miktar"
                          className="border border-gray-300 bg-white"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          placeholder="Birim Fiyat"
                          className="border border-gray-300 bg-white"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateInvoiceItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        {newInvoiceData.items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInvoiceItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInvoiceItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Kalem Ekle
              </Button>
            </div>

            {/* Tax Rate */}
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Vergi Oranı (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                className="border border-gray-300 bg-white"
                min="0"
                max="100"
                step="0.1"
                value={newInvoiceData.tax_rate}
                onChange={(e) => setNewInvoiceData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            {/* Requires Official Invoice */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requires_official_invoice"
                checked={!newInvoiceData.requires_official_invoice}
                onChange={(e) => setNewInvoiceData(prev => ({ ...prev, requires_official_invoice: !e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="requires_official_invoice" className="cursor-pointer">
                Resmi faturaya gerek yok (Mükerrer 20/B kapsamında)
              </Label>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                placeholder="Fatura notları..."
                className="border border-gray-300 bg-white"
                value={newInvoiceData.notes}
                onChange={(e) => setNewInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ara Toplam:</span>
                <span className="font-medium">
                  {formatCurrency(
                    newInvoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
                    newInvoiceData.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Vergi ({newInvoiceData.tax_rate}%):</span>
                <span className="font-medium">
                  {formatCurrency(
                    newInvoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) * newInvoiceData.tax_rate / 100,
                    newInvoiceData.currency
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Toplam:</span>
                <span className="text-lg text-primary">
                  {formatCurrency(
                    newInvoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) * (1 + newInvoiceData.tax_rate / 100),
                    newInvoiceData.currency
                  )}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              disabled={createInvoice.isPending}
            >
              İptal
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={createInvoice.isPending || !newInvoiceData.customer_id || newInvoiceData.items.some(item => !item.description)}
            >
              {createInvoice.isPending ? 'Oluşturuluyor...' : 'Fatura Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Faturayı Düzenle</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoice_number} numaralı faturanın bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {editInvoiceData && (
            <div className="space-y-4 py-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="edit_customer">Müşteri *</Label>
                <Popover open={editCustomerComboOpen} onOpenChange={setEditCustomerComboOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={editCustomerComboOpen}
                      className="w-full justify-between bg-white border-gray-300"
                    >
                      {editInvoiceData.customer_id ? (
                        <span className="truncate">
                          {customerProfiles?.find(c => c.id === editInvoiceData.customer_id)?.full_name}
                          ({customerProfiles?.find(c => c.id === editInvoiceData.customer_id)?.customer_code})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Müşteri ara ve seç...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[500px] p-0 z-[9999]"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <Command shouldFilter={true}>
                      <CommandInput placeholder="Ad, kod, email ile ara..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
                        <CommandGroup className="pointer-events-auto">
                          {customerProfiles?.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={`${customer.full_name} ${customer.customer_code} ${customer.email}`.toLowerCase()}
                              onSelect={() => {
                                setEditInvoiceData(prev => ({ ...prev, customer_id: customer.id }))
                                setEditCustomerComboOpen(false)
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                setEditInvoiceData(prev => ({ ...prev, customer_id: customer.id }))
                                setEditCustomerComboOpen(false)
                              }}
                              disabled={false}
                              data-disabled="false"
                              className="cursor-pointer hover:bg-accent opacity-100 pointer-events-auto"
                              style={{ opacity: 1, pointerEvents: 'auto' }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  editInvoiceData.customer_id === customer.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col flex-1">
                                <div className="font-medium">{customer.full_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {customer.customer_code} • {customer.email}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="edit_status">Durum</Label>
                <Select
                  value={editInvoiceData.status}
                  onValueChange={(value) => setEditInvoiceData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="border border-gray-300 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Ödenmedi</SelectItem>
                    <SelectItem value="paid">Ödendi</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                    <SelectItem value="refunded">İade</SelectItem>
                    <SelectItem value="overdue">Vadesi Geçti</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Requires Official Invoice */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_requires_official_invoice"
                  checked={!editInvoiceData.requires_official_invoice}
                  onChange={(e) => setEditInvoiceData(prev => ({ ...prev, requires_official_invoice: !e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit_requires_official_invoice" className="cursor-pointer">
                  Resmi faturaya gerek yok (Mükerrer 20/B kapsamında)
                </Label>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="edit_due_date">Vade Tarihi *</Label>
                <Input
                  id="edit_due_date"
                  type="date"
                  className="border border-gray-300 bg-white"
                  value={editInvoiceData.due_date}
                  onChange={(e) => setEditInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>

              {/* Items */}
              <div className="space-y-2">
                <Label>Fatura Kalemleri *</Label>
                <div className="space-y-2">
                  {editInvoiceData.items.map((item, index) => (
                    <Card key={index} className="p-3">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-6">
                          <Input
                            placeholder="Açıklama"
                            className="border border-gray-300 bg-white"
                            value={item.description}
                            onChange={(e) => updateEditInvoiceItem(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Miktar"
                            className="border border-gray-300 bg-white"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateEditInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="Birim Fiyat"
                            className="border border-gray-300 bg-white"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateEditInvoiceItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          {editInvoiceData.items.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEditInvoiceItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEditInvoiceItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Kalem Ekle
                </Button>
              </div>

              {/* Tax Rate */}
              <div className="space-y-2">
                <Label htmlFor="edit_tax_rate">Vergi Oranı (%)</Label>
                <Input
                  id="edit_tax_rate"
                  type="number"
                  className="border border-gray-300 bg-white"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editInvoiceData.tax_rate}
                  onChange={(e) => setEditInvoiceData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notlar</Label>
                <Textarea
                  id="edit_notes"
                  placeholder="Fatura notları..."
                  className="border border-gray-300 bg-white"
                  value={editInvoiceData.notes}
                  onChange={(e) => setEditInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="edit_admin_notes">Admin Notları</Label>
                <Textarea
                  id="edit_admin_notes"
                  placeholder="Admin notları (sadece adminler görebilir)..."
                  className="border border-gray-300 bg-white"
                  value={editInvoiceData.admin_notes}
                  onChange={(e) => setEditInvoiceData(prev => ({ ...prev, admin_notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Summary */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      editInvoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
                      editInvoiceData.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vergi ({editInvoiceData.tax_rate}%):</span>
                  <span className="font-medium">
                    {formatCurrency(
                      editInvoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) * editInvoiceData.tax_rate / 100,
                      editInvoiceData.currency
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Toplam:</span>
                  <span className="text-lg text-primary">
                    {formatCurrency(
                      editInvoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) * (1 + editInvoiceData.tax_rate / 100),
                      editInvoiceData.currency
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditModalOpen(false)
                setSelectedInvoice(null)
                setEditInvoiceData(null)
              }}
              disabled={updateInvoice.isPending}
            >
              İptal
            </Button>
            <Button
              onClick={handleUpdateInvoice}
              disabled={updateInvoice.isPending || !editInvoiceData?.customer_id || editInvoiceData?.items.some(item => !item.description)}
            >
              {updateInvoice.isPending ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
