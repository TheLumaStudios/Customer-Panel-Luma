import { useState } from 'react'
import { useVDS, useCreateVDS, useUpdateVDS, useDeleteVDS } from '@/hooks/useVDS'
import { useCustomers } from '@/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Plus, Pencil, Trash2, Server, Cpu, HardDrive, RefreshCw } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import VDSForm from '@/components/vds/VDSForm'

export default function VDS() {
  const { data: vdsList, isLoading, error, refetch } = useVDS()
  const { data: customers } = useCustomers()
  const createVDS = useCreateVDS()
  const updateVDS = useUpdateVDS()
  const deleteVDS = useDeleteVDS()

  const [formOpen, setFormOpen] = useState(false)
  const [editingVDS, setEditingVDS] = useState(null)

  const handleCreate = () => {
    setEditingVDS(null)
    setFormOpen(true)
  }

  const handleEdit = (vds) => {
    setEditingVDS(vds)
    setFormOpen(true)
  }

  const handleSubmit = async (data) => {
    try {
      if (editingVDS) {
        await updateVDS.mutateAsync({ id: editingVDS.id, data })
        toast.success('VDS güncellendi', {
          description: 'Değişiklikler başarıyla kaydedildi'
        })
      } else {
        await createVDS.mutateAsync(data)
        toast.success('VDS oluşturuldu', {
          description: 'Yeni VDS sisteme eklendi'
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
    if (confirm('Bu VDS kaydını silmek istediğinizden emin misiniz?')) {
      try {
        await deleteVDS.mutateAsync(id)
        toast.success('VDS silindi', {
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

  const stats = {
    total: vdsList?.length || 0,
    active: vdsList?.filter(v => v.status === 'active').length || 0,
    suspended: vdsList?.filter(v => v.status === 'suspended').length || 0,
    expired: vdsList?.filter(v => v.status === 'expired').length || 0,
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      suspended: 'secondary',
      expired: 'destructive',
      terminated: 'destructive',
    }
    const labels = {
      active: 'Aktif',
      suspended: 'Askıda',
      expired: 'Süresi Dolmuş',
      terminated: 'Sonlandırılmış',
    }
    return <StatusBadge status={status} />
  }

  const getTypeBadge = (type) => {
    const colors = {
      VDS: 'bg-blue-100 text-blue-800',
      VPS: 'bg-green-100 text-green-800',
      Dedicated: 'bg-purple-100 text-purple-800',
    }
    return (
      <Badge variant="outline" className={colors[type]}>
        {type}
      </Badge>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">VDS / VPS</h1>
          <p className="page-description">
            Sanal sunucularınızı görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni VDS
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-label">Toplam VDS</p>
            <div className="stat-card-icon bg-blue-100">
              <Server className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="stat-card-value">{stats.total}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-label">Aktif</p>
            <div className="stat-card-icon bg-green-100">
              <Server className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <p className="stat-card-value text-green-600">{stats.active}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-label">Askıda</p>
            <div className="stat-card-icon bg-yellow-100">
              <Server className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
          <p className="stat-card-value text-yellow-600">{stats.suspended}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-label">Süresi Dolmuş</p>
            <div className="stat-card-icon bg-red-100">
              <Server className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <p className="stat-card-value text-red-600">{stats.expired}</p>
        </div>
      </div>

      {/* VDS List */}
      <Card className="rounded-xl shadow-card">
        <CardHeader>
          <CardTitle>VDS Listesi</CardTitle>
          <CardDescription>
            Toplam {vdsList?.length || 0} VDS/VPS
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vdsList?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz VDS bulunmuyor. Yeni bir VDS ekleyin.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>VDS Adı</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Özellikler</TableHead>
                  <TableHead>IP Adresi</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vdsList?.map((vds) => (
                  <TableRow key={vds.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {vds.customer?.full_name || vds.customer?.profile?.full_name || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vds.customer?.customer_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        {vds.vds_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(vds.vds_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {vds.cpu_cores}
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {vds.ram_gb}GB
                        </div>
                        <div className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {vds.disk_space_gb}GB
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {vds.ip_address || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vds.expiration_date ? formatDate(vds.expiration_date) : <span className="text-muted-foreground">Sınırsız</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vds.billing_cycle === 'yearly'
                          ? `${formatCurrency(vds.yearly_price)}/yıl`
                          : vds.billing_cycle === 'quarterly'
                          ? `${formatCurrency(vds.monthly_price)}/3 ay`
                          : vds.billing_cycle === 'one-time'
                          ? `${formatCurrency(vds.monthly_price)} (tek)`
                          : `${formatCurrency(vds.monthly_price)}/ay`
                        }
                      </div>
                      {vds.billing_cycle && (
                        <div className="text-xs text-muted-foreground">
                          {vds.billing_cycle === 'monthly' && 'Aylık'}
                          {vds.billing_cycle === 'yearly' && 'Yıllık'}
                          {vds.billing_cycle === 'quarterly' && '3 Aylık'}
                          {vds.billing_cycle === 'one-time' && 'Tek Seferlik'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(vds.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(vds)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(vds.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <VDSForm
        open={formOpen}
        onOpenChange={setFormOpen}
        vds={editingVDS}
        customers={customers}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
