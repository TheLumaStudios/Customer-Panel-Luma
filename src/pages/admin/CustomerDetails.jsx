import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers'
import { useDomains } from '@/hooks/useDomains'
import { useHosting } from '@/hooks/useHosting'
import { useInvoices } from '@/hooks/useInvoices'
import { useTickets } from '@/hooks/useTickets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Globe,
  Server,
  FileText,
  MessageSquare,
  DollarSign,
  User,
  Edit,
  MapPin,
  Key,
  Send,
  Eye,
  FolderOpen
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { InternalNotes } from '@/components/shared/InternalNotes'
import { HealthScoreBadge } from '@/components/shared/HealthScoreBadge'
import { WorkspaceManager } from '@/components/shared/WorkspaceManager'
import { BrandingSettings } from '@/components/shared/BrandingSettings'
import CustomerForm from '@/components/customers/CustomerForm'
import SendPasswordModal from '@/components/customers/SendPasswordModal'
import { prepareCustomerAuth, sendPasswordSMS } from '@/lib/api/auth'
import { supabase } from '@/lib/supabase'

export default function CustomerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordData, setPasswordData] = useState(null)
  const updateCustomer = useUpdateCustomer()

  const { data: customer, isLoading: customerLoading } = useCustomer(id)
  const { data: allDomains } = useDomains()
  const { data: allHosting } = useHosting()
  const { data: allInvoices } = useInvoices()
  const { data: allTickets } = useTickets()

  // Filter data for this customer
  const customerDomains = allDomains?.filter(d => d.customer_id === id) || []
  const customerHosting = allHosting?.filter(h => h.customer_id === id) || []
  const customerInvoices = allInvoices?.invoices?.filter(i => i.customer_id === id) || []
  const customerTickets = allTickets?.filter(t => t.customer_id === id) || []

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Müşteri Bulunamadı</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Bu müşteri bulunamadı.</p>
            <Button onClick={() => navigate('/admin/customers')} className="mt-4">
              Müşterilere Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate statistics
  const totalRevenue = customerInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0)
  const pendingAmount = customerInvoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.total_amount, 0)
  const activeServices = customerDomains.filter(d => d.status === 'active').length +
                        customerHosting.filter(h => h.status === 'active').length
  const openTickets = customerTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length

  const handleGhostLogin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const baseUrl = import.meta.env.VITE_SUPABASE_URL
      const url = baseUrl.includes('/rest/v1') ? baseUrl.replace('/rest/v1', '/functions/v1') : `${baseUrl}/functions/v1`
      const res = await fetch(`${url}/ghost-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ customer_id: customer.id }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      // Store ghost session and open magic link in new tab
      localStorage.setItem('ghost_session_id', result.ghost_session_id)
      if (result.magic_link) {
        window.open(result.magic_link, '_blank')
      }
      toast.success('Ghost login oluşturuldu', { description: `${result.customer_name} olarak giriş yapılıyor...` })
    } catch (err) {
      toast.error('Ghost login hatası', { description: err.message })
    }
  }

  const handleEdit = () => {
    setFormOpen(true)
  }

  const handleSendPassword = async () => {
    if (!customer.email) {
      toast.error('E-posta adresi bulunamadı', {
        description: 'Müşterinin e-posta adresi olmadan panel şifresi gönderilemez'
      })
      return
    }

    if (!customer.phone) {
      toast.error('Telefon numarası bulunamadı', {
        description: 'Müşterinin telefon numarası olmadan SMS gönderilemez'
      })
      return
    }

    try {
      const result = await prepareCustomerAuth(customer)
      setPasswordData(result)
      setPasswordModalOpen(true)
    } catch (error) {
      console.error('Panel şifresi hazırlama hatası:', error)
      toast.error('Panel şifresi hazırlanamadı', {
        description: error.message
      })
    }
  }

  const handleConfirmSend = async () => {
    try {
      await sendPasswordSMS(customer, passwordData.smsMessage)

      toast.success(
        passwordData.isExisting ? 'Mevcut şifre gönderildi' : 'Yeni şifre gönderildi',
        {
          description: `${customer.phone} numarasına SMS gönderildi`
        }
      )
    } catch (error) {
      console.error('SMS gönderme hatası:', error)
      toast.error('SMS gönderilemedi', {
        description: error.message
      })
      throw error // Re-throw to prevent modal from closing
    }
  }

  const handleSubmit = async (data) => {
    try {
      // Update customers table with all fields (including profile fields)
      const customerUpdateData = {
        customer_code: data.customer_code,
        status: data.status,
        // Profile fields now stored in customers table
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        company_name: data.company_name || null,
        tc_no: data.tc_no || null,
        vkn: data.vkn || null,
        tax_office: data.tax_office || null,
        fax: data.fax || null,
        website: data.website || null,
        notes: data.notes || null,
        // Address fields
        billing_address: data.billing_address || null,
        billing_city: data.billing_city || null,
        billing_district: data.billing_district || null,
        billing_postal_code: data.billing_postal_code || null,
        billing_country: data.billing_country || 'Türkiye',
        shipping_address: data.shipping_address || null,
        shipping_city: data.shipping_city || null,
        shipping_district: data.shipping_district || null,
        shipping_postal_code: data.shipping_postal_code || null,
        shipping_country: data.shipping_country || 'Türkiye',
        same_as_billing: data.same_as_billing ?? true,
      }

      await updateCustomer.mutateAsync({
        id: customer.id,
        data: customerUpdateData
      })

      toast.success('Müşteri güncellendi', {
        description: 'Değişiklikler başarıyla kaydedildi'
      })
      setFormOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Güncelleme başarısız', {
        description: error.message
      })
    }
  }

  const getStatusBadge = (status, type = 'default') => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      expired: 'destructive',
      suspended: 'secondary',
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      open: 'default',
      in_progress: 'secondary',
      resolved: 'default',
      closed: 'secondary',
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/customers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{customer.full_name || customer.customer_code}</h1>
              <HealthScoreBadge score={customer?.health_score} />
            </div>
            <p className="text-muted-foreground mt-1">Müşteri Detayları</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleGhostLogin}>
            <Eye className="h-3.5 w-3.5" /> Müşteri Olarak Gör
          </Button>
          <Button variant="outline" onClick={handleSendPassword}>
            <Key className="h-4 w-4 mr-2" />
            Panel Şifresi Gönder
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* Workspace Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5" />
            Projeler (Workspace)
          </CardTitle>
          <CardDescription>Müşteri hizmetlerini projelere göre gruplandırın</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceManager customerId={id} />
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Ödenen faturalar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Ödemeler</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">Ödenmemiş faturalar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Servisler</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices}</div>
            <p className="text-xs text-muted-foreground">
              {customerDomains.length} domain, {customerHosting.length} hosting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Açık Talepler</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Toplam {customerTickets.length} destek talebi
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Customer Info */}
        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Hesap Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Müşteri Kodu</label>
                <p className="text-sm font-medium mt-1">{customer.customer_code}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Durum</label>
                <div className="mt-1">
                  {getStatusBadge(customer.status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Kayıt Tarihi</label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(customer.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          {(customer.vkn || customer.tax_office) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Şirket Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.vkn && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">VKN</label>
                    <p className="text-sm font-mono mt-1">{customer.vkn}</p>
                  </div>
                )}
                {customer.tax_office && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vergi Dairesi</label>
                    <p className="text-sm mt-1">{customer.tax_office}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Billing Address */}
          {customer.billing_address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Fatura Adresi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{customer.billing_address}</p>
                <p className="text-sm text-muted-foreground">
                  {customer.billing_district && `${customer.billing_district}, `}
                  {customer.billing_city}
                  {customer.billing_postal_code && ` ${customer.billing_postal_code}`}
                </p>
                {customer.billing_country && customer.billing_country !== 'Türkiye' && (
                  <p className="text-sm text-muted-foreground">{customer.billing_country}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                İç Notlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InternalNotes entityType="customer" entityId={customer?.id} />
            </CardContent>
          </Card>

          {/* Branding Settings */}
          <BrandingSettings customerId={id} />
        </div>

        {/* Right Column - Services and Activity */}
        <div className="md:col-span-2 space-y-6">
          {/* Domains */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Domainler ({customerDomains.length})
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/admin/domains', { state: { customerId: id, customerName: customer.full_name } })}
                >
                  Yeni Domain
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customerDomains.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Domain bulunmuyor
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Kayıt</TableHead>
                      <TableHead>Bitiş</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerDomains.slice(0, 5).map((domain) => (
                      <TableRow key={domain.id}>
                        <TableCell className="font-medium">{domain.domain_name}</TableCell>
                        <TableCell>{formatDate(domain.registration_date)}</TableCell>
                        <TableCell>{formatDate(domain.expiration_date)}</TableCell>
                        <TableCell>{getStatusBadge(domain.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {customerDomains.length > 5 && (
                <div className="text-center mt-4">
                  <Button variant="link" size="sm">
                    Tümünü Gör ({customerDomains.length - 5} daha)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hosting Packages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Hosting Paketleri ({customerHosting.length})
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/admin/hosting', { state: { customerId: id, customerName: customer.full_name } })}
                >
                  Yeni Hosting
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customerHosting.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Hosting paketi bulunmuyor
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paket</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Bitiş</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerHosting.slice(0, 5).map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.package_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{pkg.package_type}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(pkg.expiration_date)}</TableCell>
                        <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {customerHosting.length > 5 && (
                <div className="text-center mt-4">
                  <Button variant="link" size="sm">
                    Tümünü Gör ({customerHosting.length - 5} daha)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Faturalar ({customerInvoices.length})
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/admin/invoices', { state: { customerId: id, customerName: customer.full_name } })}
                >
                  Yeni Fatura
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customerInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Fatura bulunmuyor
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura No</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerInvoices.slice(0, 5).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {customerInvoices.length > 5 && (
                <div className="text-center mt-4">
                  <Button variant="link" size="sm">
                    Tümünü Gör ({customerInvoices.length - 5} daha)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Support Tickets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Destek Talepleri ({customerTickets.length})
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/admin/tickets', { state: { customerId: id, customerName: customer.full_name } })}
                >
                  Yeni Talep
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customerTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Destek talebi bulunmuyor
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Konu</TableHead>
                      <TableHead>Öncelik</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerTickets.slice(0, 5).map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {ticket.subject}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'outline'}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(ticket.created_at)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {customerTickets.length > 5 && (
                <div className="text-center mt-4">
                  <Button variant="link" size="sm">
                    Tümünü Gör ({customerTickets.length - 5} daha)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CustomerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={customer}
        onSubmit={handleSubmit}
      />

      <SendPasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        customer={customer}
        message={passwordData?.smsMessage || ''}
        password={passwordData?.password || ''}
        isExisting={passwordData?.isExisting || false}
        onConfirm={handleConfirmSend}
        onCancel={() => setPasswordModalOpen(false)}
      />
    </div>
  )
}
