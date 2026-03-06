import { useState } from 'react'
import { useDomains, useCreateDomain, useUpdateDomain, useDeleteDomain } from '@/hooks/useDomains'
import { useCustomers } from '@/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'
import DomainForm from '@/components/domains/DomainForm'

export default function Domains() {
  console.log('Domains component rendering...')
  const { data: domains, isLoading, error } = useDomains()
  const { data: customers } = useCustomers()
  const createDomain = useCreateDomain()
  const updateDomain = useUpdateDomain()
  const deleteDomain = useDeleteDomain()

  const [formOpen, setFormOpen] = useState(false)
  const [editingDomain, setEditingDomain] = useState(null)

  console.log('Domains page - isLoading:', isLoading, 'error:', error, 'data:', domains)
  console.log('Domains page - domains count:', domains?.length)

  const handleCreate = () => {
    setEditingDomain(null)
    setFormOpen(true)
  }

  const handleEdit = (domain) => {
    setEditingDomain(domain)
    setFormOpen(true)
  }

  const handleSubmit = async (data) => {
    try {
      if (editingDomain) {
        await updateDomain.mutateAsync({ id: editingDomain.id, data })
        toast.success('Domain güncellendi', {
          description: 'Değişiklikler başarıyla kaydedildi'
        })
      } else {
        await createDomain.mutateAsync(data)
        toast.success('Domain oluşturuldu', {
          description: 'Yeni domain sisteme eklendi'
        })
      }
      setFormOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('İşlem başarısız', {
        description: error.message
      })
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Bu domaini silmek istediğinizden emin misiniz?')) {
      try {
        await deleteDomain.mutateAsync(id)
        toast.success('Domain silindi', {
          description: 'Kayıt sistemden kaldırıldı'
        })
      } catch (error) {
        toast.error('Silme işlemi başarısız', {
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

  const getExpirationBadge = (expirationDate) => {
    const now = new Date()
    const expDate = new Date(expirationDate)
    const daysUntilExpiry = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Süresi Doldu</Badge>
    } else if (daysUntilExpiry <= 30) {
      return <Badge variant="destructive">{daysUntilExpiry} gün kaldı</Badge>
    } else if (daysUntilExpiry <= 90) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">{daysUntilExpiry} gün kaldı</Badge>
    } else {
      return <Badge variant="default">{daysUntilExpiry} gün kaldı</Badge>
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      expired: 'destructive',
      suspended: 'secondary',
    }
    const labels = {
      active: 'Aktif',
      expired: 'Süresi Doldu',
      suspended: 'Askıda',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Domainler</h1>
          <p className="text-muted-foreground mt-1">
            Tüm domainleri görüntüleyin ve yönetin
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Domain
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domain Listesi</CardTitle>
          <CardDescription>
            Toplam {domains?.length || 0} domain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domains?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz domain bulunmuyor. Yeni bir domain ekleyin.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain Adı</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>Son Kullanma</TableHead>
                  <TableHead>Kalan Süre</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Otomatik Yenileme</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains?.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">
                      {domain.domain_name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {domain.customer?.profile?.full_name || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {domain.customer?.customer_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(domain.registration_date)}</TableCell>
                    <TableCell>{formatDate(domain.expiration_date)}</TableCell>
                    <TableCell>{getExpirationBadge(domain.expiration_date)}</TableCell>
                    <TableCell>{getStatusBadge(domain.status)}</TableCell>
                    <TableCell>
                      {domain.auto_renew ? (
                        <Badge variant="default">Evet</Badge>
                      ) : (
                        <Badge variant="secondary">Hayır</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(domain)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(domain.id)}
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

      {/* Expiring Soon Warning */}
      {domains?.some(d => {
        const daysUntilExpiry = Math.ceil((new Date(d.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
      }) && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-900">Yakında Süresi Dolacak Domainler</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">
              {domains?.filter(d => {
                const daysUntilExpiry = Math.ceil((new Date(d.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
                return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
              }).length} domain 30 gün içinde sona erecek. Yenileme işlemlerini kontrol edin.
            </p>
          </CardContent>
        </Card>
      )}

      <DomainForm
        open={formOpen}
        onOpenChange={setFormOpen}
        domain={editingDomain}
        customers={customers}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
