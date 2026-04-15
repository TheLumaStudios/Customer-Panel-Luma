import { useState } from 'react'
import { useVDS, useCreateVDS, useUpdateVDS, useDeleteVDS } from '@/hooks/useVDS'
import { useCustomers } from '@/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus, Pencil, Trash2, Server, Cpu, HardDrive, RefreshCw,
  Power, PowerOff, RotateCcw, Download, Globe, Shield, Settings2
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import VDSForm from '@/components/vds/VDSForm'
import {
  listYoncuServers,
  yoncuPower,
  getYoncuRdns,
  updateYoncuRdns,
  getYoncuIpOptions,
  setYoncuIpOption,
} from '@/lib/api/yoncu'

export default function VDS() {
  const { data: vdsList, isLoading, error, refetch } = useVDS()
  const { data: customers } = useCustomers()
  const createVDS = useCreateVDS()
  const updateVDS = useUpdateVDS()
  const deleteVDS = useDeleteVDS()

  const [formOpen, setFormOpen] = useState(false)
  const [editingVDS, setEditingVDS] = useState(null)

  // Yöncü states
  const [yoncuDialogOpen, setYoncuDialogOpen] = useState(false)
  const [yoncuServers, setYoncuServers] = useState(null)
  const [yoncuLoading, setYoncuLoading] = useState(false)
  const [powerLoading, setPowerLoading] = useState(null)

  // RDNS dialog
  const [rdnsDialogOpen, setRdnsDialogOpen] = useState(false)
  const [rdnsIp, setRdnsIp] = useState('')
  const [rdnsValue, setRdnsValue] = useState('')
  const [rdnsLoading, setRdnsLoading] = useState(false)
  const [rdnsCurrent, setRdnsCurrent] = useState(null)

  // IP Options dialog
  const [ipOptionsDialogOpen, setIpOptionsDialogOpen] = useState(false)
  const [ipOptionsIp, setIpOptionsIp] = useState('')
  const [ipOptions, setIpOptions] = useState(null)
  const [ipOptionsLoading, setIpOptionsLoading] = useState(false)

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
        toast.success('VDS güncellendi')
      } else {
        await createVDS.mutateAsync(data)
        toast.success('VDS oluşturuldu')
      }
      setFormOpen(false)
    } catch (error) {
      toast.error('İşlem başarısız', { description: error.message })
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Bu VDS kaydını silmek istediğinizden emin misiniz?')) {
      try {
        await deleteVDS.mutateAsync(id)
        toast.success('VDS silindi')
      } catch (error) {
        toast.error('Silme işlemi başarısız', { description: error.message })
      }
    }
  }

  // ─── Yöncü Functions ──────────────────────────────
  const handleFetchYoncuServers = async () => {
    setYoncuLoading(true)
    setYoncuDialogOpen(true)
    try {
      const data = await listYoncuServers()
      setYoncuServers(data)
    } catch (err) {
      toast.error('Yöncü sunucu listesi alınamadı', { description: err.message })
      setYoncuServers(null)
    } finally {
      setYoncuLoading(false)
    }
  }

  const handlePower = async (identifier, operation, isIp = false) => {
    const opLabels = { poweron: 'açılıyor', poweroff: 'kapatılıyor', reset: 'yeniden başlatılıyor' }
    setPowerLoading(identifier)
    try {
      const result = isIp
        ? await yoncuPower(null, operation, identifier)
        : await yoncuPower(identifier, operation)
      toast.success(`Sunucu ${opLabels[operation]}`, {
        description: Array.isArray(result) ? result[1] : JSON.stringify(result)
      })
    } catch (err) {
      toast.error('Power işlemi başarısız', { description: err.message })
    } finally {
      setPowerLoading(null)
    }
  }

  const handleOpenRdns = async (ip) => {
    setRdnsIp(ip)
    setRdnsValue('')
    setRdnsCurrent(null)
    setRdnsDialogOpen(true)
    setRdnsLoading(true)
    try {
      const data = await getYoncuRdns(ip)
      setRdnsCurrent(data)
    } catch (err) {
      toast.error('RDNS bilgisi alınamadı', { description: err.message })
    } finally {
      setRdnsLoading(false)
    }
  }

  const handleUpdateRdns = async () => {
    if (!rdnsValue.trim()) return
    setRdnsLoading(true)
    try {
      await updateYoncuRdns(rdnsIp, rdnsValue.trim())
      toast.success('RDNS güncellendi', { description: `${rdnsIp} → ${rdnsValue}` })
      setRdnsDialogOpen(false)
    } catch (err) {
      toast.error('RDNS güncellenemedi', { description: err.message })
    } finally {
      setRdnsLoading(false)
    }
  }

  const handleOpenIpOptions = async (ip) => {
    setIpOptionsIp(ip)
    setIpOptions(null)
    setIpOptionsDialogOpen(true)
    setIpOptionsLoading(true)
    try {
      const data = await getYoncuIpOptions(ip)
      setIpOptions(data)
    } catch (err) {
      toast.error('IP seçenekleri alınamadı', { description: err.message })
    } finally {
      setIpOptionsLoading(false)
    }
  }

  const handleToggleIpOption = async (optionId, currentValue) => {
    setIpOptionsLoading(true)
    try {
      await setYoncuIpOption(ipOptionsIp, optionId, !currentValue)
      // Refetch
      const data = await getYoncuIpOptions(ipOptionsIp)
      setIpOptions(data)
      toast.success('IP seçeneği güncellendi')
    } catch (err) {
      toast.error('Seçenek güncellenemedi', { description: err.message })
    } finally {
      setIpOptionsLoading(false)
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
          <CardHeader><CardTitle className="text-destructive">Hata</CardTitle></CardHeader>
          <CardContent><p>{error.message}</p></CardContent>
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

  const getTypeBadge = (type) => {
    const colors = {
      VDS: 'bg-blue-100 text-blue-800',
      VPS: 'bg-green-100 text-green-800',
      Dedicated: 'bg-purple-100 text-purple-800',
    }
    return <Badge variant="outline" className={colors[type]}>{type}</Badge>
  }

  // Parse yöncü server data - it can be array or object
  const parseYoncuServers = () => {
    if (!yoncuServers) return []
    // Yöncü returns [true, {...servers}] or similar
    if (Array.isArray(yoncuServers)) {
      if (yoncuServers[0] === true && typeof yoncuServers[1] === 'object') {
        const obj = yoncuServers[1]
        return Object.values(obj).filter(v => typeof v === 'object')
      }
      if (yoncuServers[0] === false) return []
      return yoncuServers.filter(v => typeof v === 'object')
    }
    if (typeof yoncuServers === 'object') {
      return Object.values(yoncuServers).filter(v => typeof v === 'object')
    }
    return []
  }

  const ipOptionLabels = [
    { id: 0, label: 'Türkiye Dışı Erişim Engeli', icon: Globe },
    { id: 1, label: 'NAT Çıkışı', icon: Server },
    { id: 2, label: 'IP Koruma Kilidi', icon: Shield },
    { id: 3, label: 'MAC Koruma Kilidi', icon: Shield },
  ]

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
          <Button variant="outline" onClick={handleFetchYoncuServers}>
            <Download className="h-4 w-4 mr-2" />
            Yöncü Sunucuları
          </Button>
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
            <div className="stat-card-icon bg-blue-100"><Server className="h-4 w-4 text-blue-600" /></div>
          </div>
          <p className="stat-card-value">{stats.total}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-label">Aktif</p>
            <div className="stat-card-icon bg-green-100"><Server className="h-4 w-4 text-green-600" /></div>
          </div>
          <p className="stat-card-value text-green-600">{stats.active}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-label">Askıda</p>
            <div className="stat-card-icon bg-yellow-100"><Server className="h-4 w-4 text-yellow-600" /></div>
          </div>
          <p className="stat-card-value text-yellow-600">{stats.suspended}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-label">Süresi Dolmuş</p>
            <div className="stat-card-icon bg-red-100"><Server className="h-4 w-4 text-red-600" /></div>
          </div>
          <p className="stat-card-value text-red-600">{stats.expired}</p>
        </div>
      </div>

      {/* VDS List */}
      <Card className="rounded-xl shadow-card">
        <CardHeader>
          <CardTitle>VDS Listesi</CardTitle>
          <CardDescription>Toplam {vdsList?.length || 0} VDS/VPS</CardDescription>
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
                        <div className="text-sm text-muted-foreground">{vds.customer?.customer_code}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        {vds.vds_name}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(vds.vds_type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1"><Cpu className="h-3 w-3" />{vds.cpu_cores}</div>
                        <div className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{vds.ram_gb}GB</div>
                        <div className="flex items-center gap-1"><Server className="h-3 w-3" />{vds.disk_space_gb}GB</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vds.ip_address ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">{vds.ip_address}</span>
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => handlePower(vds.ip_address, 'poweron', true)}
                              disabled={powerLoading === vds.ip_address}
                              title="Aç"
                            >
                              <Power className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => handlePower(vds.ip_address, 'reset', true)}
                              disabled={powerLoading === vds.ip_address}
                              title="Yeniden Başlat"
                            >
                              <RotateCcw className="h-3 w-3 text-amber-600" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => handleOpenRdns(vds.ip_address)}
                              title="RDNS"
                            >
                              <Globe className="h-3 w-3 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => handleOpenIpOptions(vds.ip_address)}
                              title="IP Seçenekleri"
                            >
                              <Settings2 className="h-3 w-3 text-violet-600" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
                    </TableCell>
                    <TableCell><StatusBadge status={vds.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(vds)} title="Düzenle">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(vds.id)} title="Sil">
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

      {/* VDS Form */}
      <VDSForm
        open={formOpen}
        onOpenChange={setFormOpen}
        vds={editingVDS}
        customers={customers}
        onSubmit={handleSubmit}
      />

      {/* Yöncü Servers Dialog */}
      <Dialog open={yoncuDialogOpen} onOpenChange={setYoncuDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yöncü Sunucuları</DialogTitle>
            <DialogDescription>
              Yöncü API üzerinden kayıtlı sunucularınız
            </DialogDescription>
          </DialogHeader>

          {yoncuLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            </div>
          ) : (
            <div className="space-y-3">
              {parseYoncuServers().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {yoncuServers ? 'Sunucu bulunamadı' : 'Veri alınamadı'}
                  <pre className="mt-4 text-xs bg-muted p-4 rounded-lg text-left overflow-auto max-h-48">
                    {JSON.stringify(yoncuServers, null, 2)}
                  </pre>
                </div>
              ) : (
                parseYoncuServers().map((server, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          {server.ad || server.name || server.hostname || `Sunucu #${i + 1}`}
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                          {server.ip && <span className="font-mono">{server.ip}</span>}
                          {server.durum && <Badge variant="outline">{server.durum}</Badge>}
                          {server.isletim && <span>{server.isletim}</span>}
                          {(server.cpu || server.ram || server.disk) && (
                            <span>{[server.cpu, server.ram, server.disk].filter(Boolean).join(' / ')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline" size="icon" className="h-8 w-8"
                          onClick={() => handlePower(server.id || server.sid, 'poweron')}
                          disabled={powerLoading === (server.id || server.sid)}
                          title="Aç"
                        >
                          <Power className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="outline" size="icon" className="h-8 w-8"
                          onClick={() => handlePower(server.id || server.sid, 'reset')}
                          disabled={powerLoading === (server.id || server.sid)}
                          title="Yeniden Başlat"
                        >
                          <RotateCcw className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button
                          variant="outline" size="icon" className="h-8 w-8"
                          onClick={() => handlePower(server.id || server.sid, 'poweroff')}
                          disabled={powerLoading === (server.id || server.sid)}
                          title="Kapat"
                        >
                          <PowerOff className="h-4 w-4 text-red-600" />
                        </Button>
                        {server.ip && (
                          <>
                            <Button
                              variant="outline" size="icon" className="h-8 w-8"
                              onClick={() => handleOpenRdns(server.ip)}
                              title="RDNS"
                            >
                              <Globe className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="outline" size="icon" className="h-8 w-8"
                              onClick={() => handleOpenIpOptions(server.ip)}
                              title="IP Seçenekleri"
                            >
                              <Settings2 className="h-4 w-4 text-violet-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RDNS Dialog */}
      <Dialog open={rdnsDialogOpen} onOpenChange={setRdnsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>RDNS Yönetimi</DialogTitle>
            <DialogDescription>
              {rdnsIp} için RDNS (Reverse DNS) kaydını görüntüle ve güncelle
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {rdnsLoading && !rdnsCurrent ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
              </div>
            ) : (
              <>
                {rdnsCurrent && (
                  <div className="bg-muted rounded-lg p-3">
                    <Label className="text-xs text-muted-foreground">Mevcut RDNS</Label>
                    <pre className="text-sm font-mono mt-1 overflow-auto">
                      {typeof rdnsCurrent === 'string' ? rdnsCurrent : JSON.stringify(rdnsCurrent, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Yeni RDNS Adresi</Label>
                  <Input
                    placeholder="mail.example.com"
                    value={rdnsValue}
                    onChange={(e) => setRdnsValue(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRdnsDialogOpen(false)}>İptal</Button>
            <Button onClick={handleUpdateRdns} disabled={rdnsLoading || !rdnsValue.trim()}>
              {rdnsLoading ? 'Güncelleniyor...' : 'RDNS Güncelle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IP Options Dialog */}
      <Dialog open={ipOptionsDialogOpen} onOpenChange={setIpOptionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>IP Gelişmiş Seçenekleri</DialogTitle>
            <DialogDescription>
              {ipOptionsIp} için güvenlik ve ağ seçenekleri
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {ipOptionsLoading && !ipOptions ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
              </div>
            ) : ipOptions ? (
              ipOptionLabels.map((opt) => {
                // Try to parse option value from response
                let isActive = false
                if (Array.isArray(ipOptions) && typeof ipOptions[1] === 'object') {
                  isActive = !!ipOptions[1]?.[opt.id]
                } else if (typeof ipOptions === 'object' && !Array.isArray(ipOptions)) {
                  isActive = !!ipOptions[opt.id]
                }

                return (
                  <div key={opt.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <opt.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleIpOption(opt.id, isActive)}
                      disabled={ipOptionsLoading}
                    >
                      {isActive ? 'Aktif' : 'Pasif'}
                    </Button>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-4 text-muted-foreground">Veri alınamadı</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
