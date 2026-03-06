import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useHosting, useCreateHosting, useUpdateHosting, useDeleteHosting, useProvisionHosting, useSuspendHosting, useUnsuspendHosting, useTerminateHosting } from '@/hooks/useHosting'
import { useCustomers } from '@/hooks/useCustomers'
import { useServers, useSyncServerAccounts } from '@/hooks/useServers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, AlertCircle, Server, PlayCircle, Pause, Play, XCircle, Users, CheckCircle, XOctagon, Clock, Download } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import HostingForm from '@/components/hosting/HostingForm'

export default function Hosting() {
  const location = useLocation()
  const { data: hostingRecords, isLoading, error } = useHosting()
  const { data: customers } = useCustomers()
  const { data: servers } = useServers()
  const createHosting = useCreateHosting()
  const updateHosting = useUpdateHosting()
  const deleteHosting = useDeleteHosting()
  const provisionHosting = useProvisionHosting()
  const suspendHosting = useSuspendHosting()
  const unsuspendHosting = useUnsuspendHosting()
  const terminateHosting = useTerminateHosting()
  const syncAccounts = useSyncServerAccounts()

  const [formOpen, setFormOpen] = useState(false)
  const [editingHosting, setEditingHosting] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [syncingServerId, setSyncingServerId] = useState(null)
  const [preselectedCustomerId, setPreselectedCustomerId] = useState(null)

  // Check if navigated from customer details with preselected customer
  useEffect(() => {
    if (location.state?.customerId) {
      setPreselectedCustomerId(location.state.customerId)
      setEditingHosting(null)
      setFormOpen(true)
      // Clear the state after opening
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const handleCreate = () => {
    setEditingHosting(null)
    setPreselectedCustomerId(null)
    setFormOpen(true)
  }

  const handleEdit = (hosting) => {
    setEditingHosting(hosting)
    setFormOpen(true)
  }

  const handleSubmit = async (data) => {
    try {
      if (editingHosting) {
        await updateHosting.mutateAsync({ id: editingHosting.id, data })
        toast.success('Hosting paketi güncellendi', {
          description: 'Değişiklikler başarıyla kaydedildi'
        })
      } else {
        await createHosting.mutateAsync(data)
        toast.success('Hosting paketi oluşturuldu', {
          description: 'Yeni hosting paketi sisteme eklendi'
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
    if (confirm('Bu hosting paketini silmek istediğinizden emin misiniz?')) {
      try {
        await deleteHosting.mutateAsync(id)
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

  const handleProvision = async (id) => {
    if (confirm('Bu hosting hesabını cPanel sunucusunda oluşturmak istediğinizden emin misiniz?')) {
      setProcessingId(id)
      try {
        const result = await provisionHosting.mutateAsync(id)
        toast.success('Hosting oluşturuldu', {
          description: `Kullanıcı: ${result.username}, Domain: ${result.domain}, Sunucu: ${result.server}`
        })
      } catch (error) {
        toast.error('Hosting oluşturma başarısız', {
          description: error.message
        })
      } finally {
        setProcessingId(null)
      }
    }
  }

  const handleSuspend = async (id) => {
    const reason = prompt('Askıya alma sebebi (opsiyonel):')
    if (reason === null) return // User clicked cancel

    setProcessingId(id)
    try {
      const result = await suspendHosting.mutateAsync({ id, reason: reason || 'Suspended by admin' })
      toast.success('Hosting askıya alındı', {
        description: result.message
      })
    } catch (error) {
      toast.error('Askıya alma başarısız', {
        description: error.message
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleUnsuspend = async (id) => {
    if (confirm('Bu hosting hesabını aktif etmek istediğinizden emin misiniz?')) {
      setProcessingId(id)
      try {
        const result = await unsuspendHosting.mutateAsync(id)
        toast.success('Hosting aktif edildi', {
          description: result.message
        })
      } catch (error) {
        toast.error('Aktif etme başarısız', {
          description: error.message
        })
      } finally {
        setProcessingId(null)
      }
    }
  }

  const handleTerminate = async (id) => {
    if (confirm('⚠️ DİKKAT: Bu işlem hosting hesabını sunucudan KALICI olarak silecektir!\n\nDevam etmek istediğinizden emin misiniz?')) {
      const keepDns = confirm('DNS kayıtları korunsun mu?')
      setProcessingId(id)
      try {
        const result = await terminateHosting.mutateAsync({ id, keepDns })
        toast.success('Hosting sonlandırıldı', {
          description: result.message
        })
      } catch (error) {
        toast.error('Sonlandırma başarısız', {
          description: error.message
        })
      } finally {
        setProcessingId(null)
      }
    }
  }

  const handleOpenSyncDialog = () => {
    setSyncDialogOpen(true)
  }

  const handleSyncFromServer = async (serverId) => {
    setSyncingServerId(serverId)
    try {
      const result = await syncAccounts.mutateAsync(serverId)

      let description = `Toplam: ${result.total} hesap, Yeni: ${result.created}, Güncellenen: ${result.updated}`
      if (result.skipped > 0) {
        description += `, Atlanan: ${result.skipped}`
      }

      if (result.errors && result.errors.length > 0) {
        toast.warning('Hesaplar senkronize edildi (hatalarla)', {
          description: `${description}. ${result.errors.length} hata oluştu`
        })
      } else {
        toast.success('Hesaplar senkronize edildi', {
          description
        })
      }

      setSyncDialogOpen(false)
    } catch (error) {
      toast.error('Senkronizasyon hatası', {
        description: error.message
      })
    } finally {
      setSyncingServerId(null)
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

  const getPackageTypeBadge = (packageType) => {
    const types = {
      basic: { label: 'Temel', variant: 'secondary' },
      standard: { label: 'Standart', variant: 'default' },
      premium: { label: 'Premium', variant: 'default' },
      enterprise: { label: 'Enterprise', variant: 'default' },
    }
    const type = types[packageType] || { label: packageType, variant: 'secondary' }
    return <Badge variant={type.variant}>{type.label}</Badge>
  }

  // Calculate statistics
  const stats = {
    total: hostingRecords?.length || 0,
    active: hostingRecords?.filter(h => h.status === 'active').length || 0,
    suspended: hostingRecords?.filter(h => h.status === 'suspended').length || 0,
    expired: hostingRecords?.filter(h => h.status === 'expired').length || 0,
    provisioned: hostingRecords?.filter(h => h.username).length || 0,
    notProvisioned: hostingRecords?.filter(h => !h.username && h.server_id).length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hosting Paketleri</h1>
          <p className="text-muted-foreground mt-1">
            Tüm hosting paketlerini görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenSyncDialog}>
            <Download className="h-4 w-4 mr-2" />
            cPanel'den Çek
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Hosting Paketi
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Hosting</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.provisioned} tanesi aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Çalışan hostingler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Askıda</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.suspended}</div>
            <p className="text-xs text-muted-foreground">
              Askıya alınmış
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provision Gerekli</CardTitle>
            <XOctagon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.notProvisioned}</div>
            <p className="text-xs text-muted-foreground">
              cPanel'de oluşturulacak
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hosting Listesi</CardTitle>
          <CardDescription>
            Toplam {hostingRecords?.length || 0} hosting paketi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hostingRecords?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz hosting paketi bulunmuyor. Yeni bir paket ekleyin.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Paket Adı</TableHead>
                  <TableHead>Kullanıcı Adı / Domain</TableHead>
                  <TableHead>Disk</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostingRecords?.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {pkg.customer?.full_name || pkg.customer?.profile?.full_name || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {pkg.customer?.customer_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        {pkg.package_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {pkg.username ? (
                        <div>
                          <div className="font-mono text-sm font-medium">
                            {pkg.username}
                          </div>
                          {pkg.domain && (
                            <div className="text-xs text-muted-foreground">
                              {pkg.domain}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Provision Gerekli
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {pkg.disk_space_gb ? `${pkg.disk_space_gb} GB` : 'Sınırsız'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {pkg.start_date ? formatDate(pkg.start_date) : <span className="text-muted-foreground">Sınırsız</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">
                          {pkg.expiration_date ? formatDate(pkg.expiration_date) : <span className="text-muted-foreground">Sınırsız</span>}
                        </div>
                        {pkg.expiration_date && (
                          <div className="text-xs mt-1">
                            {getExpirationBadge(pkg.expiration_date)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Provision button - only show if no username (not provisioned) and has server */}
                        {!pkg.username && pkg.server_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleProvision(pkg.id)}
                            title="cPanel'de Oluştur"
                            disabled={processingId === pkg.id}
                          >
                            <PlayCircle className={`h-4 w-4 text-green-600 ${processingId === pkg.id ? 'animate-pulse' : ''}`} />
                          </Button>
                        )}

                        {/* Suspend/Unsuspend buttons - only show if provisioned */}
                        {pkg.username && pkg.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSuspend(pkg.id)}
                            title="Askıya Al"
                            disabled={processingId === pkg.id}
                          >
                            <Pause className={`h-4 w-4 text-orange-600 ${processingId === pkg.id ? 'animate-pulse' : ''}`} />
                          </Button>
                        )}

                        {pkg.username && pkg.status === 'suspended' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnsuspend(pkg.id)}
                            title="Aktif Et"
                            disabled={processingId === pkg.id}
                          >
                            <Play className={`h-4 w-4 text-green-600 ${processingId === pkg.id ? 'animate-pulse' : ''}`} />
                          </Button>
                        )}

                        {/* Terminate button - only show if provisioned */}
                        {pkg.username && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTerminate(pkg.id)}
                            title="Sunucudan Sil"
                            disabled={processingId === pkg.id}
                          >
                            <XCircle className={`h-4 w-4 text-red-600 ${processingId === pkg.id ? 'animate-pulse' : ''}`} />
                          </Button>
                        )}

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
                          title="Veritabanından Sil"
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
      {hostingRecords?.some(pkg => {
        const daysUntilExpiry = Math.ceil((new Date(pkg.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
      }) && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-900">Yakında Süresi Dolacak Paketler</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">
              {hostingRecords?.filter(pkg => {
                const daysUntilExpiry = Math.ceil((new Date(pkg.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
                return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
              }).length} hosting paketi 30 gün içinde sona erecek. Yenileme işlemlerini kontrol edin.
            </p>
          </CardContent>
        </Card>
      )}

      <HostingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        hosting={editingHosting}
        customers={customers}
        onSubmit={handleSubmit}
        preselectedCustomerId={preselectedCustomerId}
      />

      {/* Sync from Server Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>cPanel'den Hosting Hesaplarını Çek</DialogTitle>
            <DialogDescription>
              Hosting hesaplarını çekmek istediğiniz sunucuyu seçin.
              Hesaplar otomatik olarak oluşturulacak/güncellenecektir.
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
