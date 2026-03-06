import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, MessageSquare, RefreshCw, Key } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import CustomerForm from '@/components/customers/CustomerForm'
import SendSmsModal from '@/components/customers/SendSmsModal'
import SendPasswordModal from '@/components/customers/SendPasswordModal'
import { sendSMS } from '@/lib/api/sms'
import { prepareCustomerAuth, sendPasswordSMS } from '@/lib/api/auth'
import { toast } from '@/lib/toast'

export default function Customers() {
  const navigate = useNavigate()
  const { data: customers, isLoading, error, refetch } = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [smsModalOpen, setSmsModalOpen] = useState(false)
  const [smsCustomer, setSmsCustomer] = useState(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordCustomer, setPasswordCustomer] = useState(null)
  const [passwordData, setPasswordData] = useState(null)

  const handleCreate = () => {
    setEditingCustomer(null)
    setFormOpen(true)
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  const handleSubmit = async (data) => {
    try {
      // Prepare customer data with all fields (profile + address fields)
      const customerData = {
        customer_code: data.customer_code,
        status: data.status,
        // Profile fields (now stored directly in customers table)
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

      if (editingCustomer) {
        // Update existing customer
        await updateCustomer.mutateAsync({
          id: editingCustomer.id,
          data: customerData
        })
        toast.success('Müşteri başarıyla güncellendi', {
          description: `${data.full_name} bilgileri güncellendi`,
          action: {
            label: 'Görüntüle',
            onClick: () => navigate(`/admin/customers/${editingCustomer.id}`)
          }
        })
      } else {
        // Create new customer
        const result = await createCustomer.mutateAsync(customerData)
        toast.success('Müşteri başarıyla oluşturuldu', {
          description: `${data.full_name} sisteme eklendi`,
          action: {
            label: 'Görüntüle',
            onClick: () => navigate(`/admin/customers/${result.id}`)
          }
        })
      }

      setFormOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Müşteri kaydedilemedi', {
        description: error.message
      })
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteCustomer.mutateAsync(id)
        toast.success('Müşteri başarıyla silindi', {
          description: 'Müşteri kaydı sistemden kaldırıldı'
        })
      } catch (error) {
        toast.error('Müşteri silinemedi', {
          description: error.message
        })
      }
    }
  }

  const handleSendSms = (customer) => {
    setSmsCustomer(customer)
    setSmsModalOpen(true)
  }

  const handleSendPassword = async (customer) => {
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
      setPasswordCustomer(customer)
      setPasswordData(result)
      setPasswordModalOpen(true)
    } catch (error) {
      console.error('Panel şifresi hazırlama hatası:', error)
      toast.error('Panel şifresi hazırlanamadı', {
        description: error.message
      })
    }
  }

  const handleConfirmPasswordSend = async () => {
    try {
      await sendPasswordSMS(passwordCustomer, passwordData.smsMessage)

      toast.success(
        passwordData.isExisting ? 'Mevcut şifre gönderildi' : 'Yeni şifre gönderildi',
        {
          description: `${passwordCustomer.phone} numarasına SMS gönderildi`
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

  const handleSmsSubmit = async (data) => {
    try {
      await sendSMS(data.phone, data.message)
      toast.success('SMS başarıyla gönderildi', {
        description: `Mesaj ${data.phone} numarasına gönderildi`
      })
      setSmsModalOpen(false)
    } catch (error) {
      console.error('SMS send error:', error)
      toast.error('SMS gönderilemedi', {
        description: error.message
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
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Müşteriler</h1>
          <p className="text-muted-foreground mt-1">
            Tüm müşterilerinizi görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Müşteri
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Müşteri Listesi</CardTitle>
          <CardDescription>
            Toplam {customers?.length || 0} müşteri
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz müşteri bulunmuyor. Yeni bir müşteri ekleyin.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri Kodu</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/customers/${customer.id}`)}
                  >
                    <TableCell className="font-medium">
                      {customer.customer_code}
                    </TableCell>
                    <TableCell>
                      {customer.full_name || customer.profile?.full_name || '-'}
                    </TableCell>
                    <TableCell>{customer.email || customer.profile?.email || '-'}</TableCell>
                    <TableCell>{customer.phone || customer.profile?.phone || '-'}</TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>{formatDate(customer.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSendPassword(customer)
                          }}
                          title="Panel Şifresi Gönder"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSendSms(customer)
                          }}
                          title="SMS Gönder"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(customer)
                          }}
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(customer.id)
                          }}
                          title="Sil"
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

      <CustomerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editingCustomer}
        onSubmit={handleSubmit}
      />

      <SendSmsModal
        open={smsModalOpen}
        onOpenChange={setSmsModalOpen}
        customer={smsCustomer}
        onSubmit={handleSmsSubmit}
      />

      <SendPasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        customer={passwordCustomer}
        message={passwordData?.smsMessage || ''}
        password={passwordData?.password || ''}
        isExisting={passwordData?.isExisting || false}
        onConfirm={handleConfirmPasswordSend}
        onCancel={() => setPasswordModalOpen(false)}
      />
    </div>
  )
}
