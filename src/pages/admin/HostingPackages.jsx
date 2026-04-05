import { useState } from 'react'
import { useHostingPackages, useCreateHostingPackage, useUpdateHostingPackage, useDeleteHostingPackage, useSyncPackagesFromServer } from '@/hooks/useHostingPackages'
import { useServers } from '@/hooks/useServers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Plus, Pencil, Trash2, Check, X, Download } from 'lucide-react'
import { toast } from '@/lib/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import HostingPackageForm from '@/components/hosting/HostingPackageForm'

export default function HostingPackages() {
  const { data: packages, isLoading, error } = useHostingPackages()
  const { data: servers } = useServers()
  const createPackage = useCreateHostingPackage()
  const updatePackage = useUpdateHostingPackage()
  const deletePackage = useDeleteHostingPackage()
  const syncPackages = useSyncPackagesFromServer()

  const [formOpen, setFormOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [syncingServerId, setSyncingServerId] = useState(null)

  const handleCreate = () => {
    setEditingPackage(null)
    setFormOpen(true)
  }

  const handleEdit = (pkg) => {
    setEditingPackage(pkg)
    setFormOpen(true)
  }

  const handleSubmit = async (data) => {
    try {
      if (editingPackage) {
        await updatePackage.mutateAsync({
          id: editingPackage.id,
          data
        })
        toast.success('Hosting paketi güncellendi', {
          description: 'Değişiklikler başarıyla kaydedildi'
        })
      } else {
        await createPackage.mutateAsync(data)
        toast.success('Hosting paketi oluşturuldu', {
          description: 'Yeni paket sisteme eklendi'
        })
      }
      setFormOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('İşlem başarısız', {
        description: error.response?.data?.message || error.message
      })
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Bu hosting paketini silmek istediğinizden emin misiniz?')) {
      try {
        await deletePackage.mutateAsync(id)
        toast.success('Hosting paketi silindi', {
          description: 'Kayıt sistemden kaldırıldı'
        })
      } catch (error) {
        toast.error('Silme işlemi başarısız', {
          description: error.message
        })
      }
    }
  }

  const handleOpenSyncDialog = () => {
    setSyncDialogOpen(true)
  }

  const handleSyncFromServer = async (serverId) => {
    setSyncingServerId(serverId)
    try {
      const result = await syncPackages.mutateAsync(serverId)

      toast.success('Paketler senkronize edildi', {
        description: `Toplam: ${result.total}, Yeni: ${result.created}, Güncellenen: ${result.updated}. Fiyatları kontrol edin!`
      })

      setSyncDialogOpen(false)
    } catch (error) {
      toast.error('Senkronizasyon hatası', {
        description: error.message
      })
    } finally {
      setSyncingServerId(null)
    }
  }

  const formatValue = (value) => {
    if (value === -1) return 'Sınırsız'
    return value
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

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hosting Paketleri</h1>
          <p className="page-description">
            Hosting paketlerinizi tanımlayın ve yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenSyncDialog}>
            <Download className="h-4 w-4 mr-2" />
            cPanel'den Çek
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Paket
          </Button>
        </div>
      </div>

      <Card className="rounded-xl shadow-card">
        <CardHeader>
          <CardTitle>Paket Listesi</CardTitle>
          <CardDescription>
            Toplam {packages?.length || 0} hosting paketi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {packages?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz hosting paketi bulunmuyor. Yeni bir paket ekleyin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paket Adı</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead>Disk (GB)</TableHead>
                    <TableHead>Bant Genişliği</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>DB</TableHead>
                    <TableHead>SSL</TableHead>
                    <TableHead>Aylık Fiyat</TableHead>
                    <TableHead>Yıllık Fiyat</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages?.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">
                        {pkg.package_name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {pkg.package_code}
                        </code>
                      </TableCell>
                      <TableCell>{pkg.disk_space_gb} GB</TableCell>
                      <TableCell>{formatValue(pkg.bandwidth_gb)} GB</TableCell>
                      <TableCell>{formatValue(pkg.email_accounts)}</TableCell>
                      <TableCell>{formatValue(pkg.databases)}</TableCell>
                      <TableCell>
                        {pkg.ssl_certificate ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>{pkg.monthly_price} ₺</TableCell>
                      <TableCell>
                        {pkg.yearly_price ? `${pkg.yearly_price} ₺` : '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={pkg.is_active ? 'active' : 'inactive'} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(pkg)}
                            title="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(pkg.id)}
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
            </div>
          )}
        </CardContent>
      </Card>

      <HostingPackageForm
        open={formOpen}
        onOpenChange={setFormOpen}
        packageData={editingPackage}
        onSubmit={handleSubmit}
      />

      {/* Sync from Server Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>cPanel'den Paket Çek</DialogTitle>
            <DialogDescription>
              Hosting paketlerini (planlarını) çekmek istediğiniz sunucuyu seçin.
              Paketler otomatik olarak oluşturulacak/güncellenecektir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {servers?.filter(s => s.server_type === 'cpanel' && s.is_active).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aktif cPanel sunucusu bulunamadı. Önce bir sunucu ekleyin.
              </div>
            ) : (
              servers?.filter(s => s.server_type === 'cpanel' && s.is_active).map((server) => (
                <Card key={server.id} className="p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{server.server_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {server.hostname} ({server.ip_address})
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSyncFromServer(server.id)}
                      disabled={syncingServerId === server.id}
                      size="sm"
                    >
                      {syncingServerId === server.id ? (
                        <>
                          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                          Çekiliyor...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Çek
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
