import { useState } from 'react'
import { useVdsOrders, useUpdateVdsOrder } from '@/hooks/useVdsOrders'
import { useCreateVDS } from '@/hooks/useVDS'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Server, Clock, CheckCircle2, XCircle, AlertTriangle,
  Eye, Rocket, RefreshCw, Package
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { listYoncuServers, yoncuPower } from '@/lib/api/yoncu'

const statusConfig = {
  pending: { label: 'Ödeme Bekleniyor', color: 'bg-gray-100 text-gray-700', icon: Clock },
  paid_pending: { label: 'Admin Onayı Bekliyor', color: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
  provisioning: { label: 'Kuruluyor', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
  completed: { label: 'Tamamlandı', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  failed: { label: 'Başarısız', color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { label: 'İptal', color: 'bg-gray-100 text-gray-500', icon: XCircle },
}

export default function VdsOrders() {
  const { profile } = useAuth()
  const [statusFilter, setStatusFilter] = useState('paid_pending')
  const { data: orders, isLoading, refetch } = useVdsOrders(statusFilter === 'all' ? undefined : statusFilter)
  const updateOrder = useUpdateVdsOrder()
  const createVDS = useCreateVDS()

  // Provision dialog
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [provisionForm, setProvisionForm] = useState({
    vds_name: '',
    ip_address: '',
    ssh_port: '22',
    root_password: '',
    username: '',
    os_template: '',
    cpu_cores: '',
    ram_gb: '',
    disk_space_gb: '',
    bandwidth_gb: '',
    admin_notes: '',
  })
  const [provisionLoading, setProvisionLoading] = useState(false)

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)

  const handleOpenProvision = (order) => {
    setSelectedOrder(order)
    setProvisionForm({
      vds_name: order.package_name || '',
      ip_address: order.provisioned_ip || '',
      ssh_port: '22',
      root_password: order.provisioned_password || '',
      username: order.provisioned_username || '',
      os_template: order.os_template || '',
      cpu_cores: order.cpu_cores?.toString() || '',
      ram_gb: order.ram_gb?.toString() || '',
      disk_space_gb: order.disk_space_gb?.toString() || '',
      bandwidth_gb: order.bandwidth_gb?.toString() || '',
      admin_notes: order.admin_notes || '',
    })
    setProvisionDialogOpen(true)
  }

  const handleProvision = async () => {
    if (!provisionForm.ip_address || !provisionForm.vds_name) {
      toast.error('VDS adı ve IP adresi zorunludur')
      return
    }

    setProvisionLoading(true)
    try {
      // 1. VDS kaydı oluştur
      const vdsData = {
        customer_id: selectedOrder.customer_id,
        vds_name: provisionForm.vds_name,
        vds_type: selectedOrder.vds_type || 'VDS',
        ip_address: provisionForm.ip_address,
        ssh_port: parseInt(provisionForm.ssh_port) || 22,
        root_password: provisionForm.root_password,
        username: provisionForm.username,
        os_template: provisionForm.os_template,
        cpu_cores: parseInt(provisionForm.cpu_cores) || null,
        ram_gb: parseInt(provisionForm.ram_gb) || null,
        disk_space_gb: parseInt(provisionForm.disk_space_gb) || null,
        bandwidth_gb: parseInt(provisionForm.bandwidth_gb) || null,
        monthly_price: selectedOrder.monthly_price,
        billing_cycle: selectedOrder.billing_cycle || 'monthly',
        status: 'active',
        start_date: new Date().toISOString(),
      }

      const vdsResult = await createVDS.mutateAsync(vdsData)

      // 2. Siparişi tamamla
      await updateOrder.mutateAsync({
        id: selectedOrder.id,
        data: {
          order_status: 'completed',
          assigned_vds_id: vdsResult?.id || null,
          provisioned_ip: provisionForm.ip_address,
          provisioned_username: provisionForm.username,
          provisioned_password: provisionForm.root_password,
          admin_notes: provisionForm.admin_notes,
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        }
      })

      toast.success('Sipariş onaylandı ve VDS oluşturuldu', {
        description: `${provisionForm.vds_name} - ${provisionForm.ip_address}`
      })
      setProvisionDialogOpen(false)
      refetch()
    } catch (err) {
      toast.error('Sipariş onaylama başarısız', { description: err.message })
    } finally {
      setProvisionLoading(false)
    }
  }

  const handleReject = async (order) => {
    const reason = prompt('Ret sebebi:')
    if (reason === null) return

    try {
      await updateOrder.mutateAsync({
        id: order.id,
        data: {
          order_status: 'cancelled',
          admin_notes: reason || 'Admin tarafından reddedildi',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        }
      })
      toast.success('Sipariş reddedildi')
      refetch()
    } catch (err) {
      toast.error('İşlem başarısız', { description: err.message })
    }
  }

  const handleViewDetail = (order) => {
    setDetailOrder(order)
    setDetailDialogOpen(true)
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

  const pendingCount = orders?.filter(o => o.order_status === 'paid_pending').length || 0

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            VDS Siparişleri
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 text-white">{pendingCount} bekliyor</Badge>
            )}
          </h1>
          <p className="page-description">
            Müşteri VDS/VPS siparişlerini görüntüleyin, onaylayın ve sunucu bilgilerini girin
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'paid_pending', label: 'Onay Bekleyenler', icon: AlertTriangle },
          { value: 'pending', label: 'Ödeme Bekleyenler', icon: Clock },
          { value: 'completed', label: 'Tamamlananlar', icon: CheckCircle2 },
          { value: 'all', label: 'Tümü', icon: Package },
        ].map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={statusFilter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(value)}
          >
            <Icon className="h-4 w-4 mr-1.5" />
            {label}
          </Button>
        ))}
      </div>

      {/* Orders Table */}
      <Card className="rounded-xl shadow-card">
        <CardHeader>
          <CardTitle>Sipariş Listesi</CardTitle>
          <CardDescription>
            {orders?.length || 0} sipariş gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!orders?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              Bu filtrede sipariş bulunmuyor.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const status = statusConfig[order.order_status] || statusConfig.pending
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={order.id} className={order.order_status === 'paid_pending' ? 'bg-amber-50/50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer?.full_name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{order.customer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{order.package_name || 'VDS'}</div>
                            {order.cpu_cores && (
                              <div className="text-xs text-muted-foreground">
                                {order.cpu_cores} CPU / {order.ram_gb}GB RAM / {order.disk_space_gb}GB Disk
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">
                          {order.invoice?.invoice_number || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {order.monthly_price ? formatCurrency(order.monthly_price) : '-'}
                        {order.billing_cycle && (
                          <div className="text-xs text-muted-foreground">
                            /{order.billing_cycle === 'monthly' ? 'ay' : order.billing_cycle === 'yearly' ? 'yıl' : order.billing_cycle}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(order.created_at)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => handleViewDetail(order)}
                            title="Detay"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.order_status === 'paid_pending' && (
                            <>
                              <Button
                                size="sm"
                                className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-500"
                                onClick={() => handleOpenProvision(order)}
                              >
                                <Rocket className="h-3.5 w-3.5" />
                                Onayla & Kur
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => handleReject(order)}
                                title="Reddet"
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Provision Dialog */}
      <Dialog open={provisionDialogOpen} onOpenChange={setProvisionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Siparişi Onayla & Sunucu Bilgilerini Gir</DialogTitle>
            <DialogDescription>
              {selectedOrder?.customer?.full_name} - {selectedOrder?.package_name}
              {selectedOrder?.monthly_price && ` - ${formatCurrency(selectedOrder.monthly_price)}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>VDS Adı *</Label>
              <Input
                value={provisionForm.vds_name}
                onChange={(e) => setProvisionForm(p => ({ ...p, vds_name: e.target.value }))}
                placeholder="Müşteri VDS-1"
              />
            </div>
            <div className="space-y-2">
              <Label>IP Adresi *</Label>
              <Input
                value={provisionForm.ip_address}
                onChange={(e) => setProvisionForm(p => ({ ...p, ip_address: e.target.value }))}
                placeholder="185.x.x.x"
              />
            </div>
            <div className="space-y-2">
              <Label>Kullanıcı Adı</Label>
              <Input
                value={provisionForm.username}
                onChange={(e) => setProvisionForm(p => ({ ...p, username: e.target.value }))}
                placeholder="root"
              />
            </div>
            <div className="space-y-2">
              <Label>Root Şifre</Label>
              <Input
                value={provisionForm.root_password}
                onChange={(e) => setProvisionForm(p => ({ ...p, root_password: e.target.value }))}
                placeholder="Otomatik veya elle gir"
              />
            </div>
            <div className="space-y-2">
              <Label>SSH Port</Label>
              <Input
                value={provisionForm.ssh_port}
                onChange={(e) => setProvisionForm(p => ({ ...p, ssh_port: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>İşletim Sistemi</Label>
              <Input
                value={provisionForm.os_template}
                onChange={(e) => setProvisionForm(p => ({ ...p, os_template: e.target.value }))}
                placeholder="Ubuntu 22.04"
              />
            </div>
            <div className="space-y-2">
              <Label>CPU Çekirdek</Label>
              <Input
                type="number"
                value={provisionForm.cpu_cores}
                onChange={(e) => setProvisionForm(p => ({ ...p, cpu_cores: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>RAM (GB)</Label>
              <Input
                type="number"
                value={provisionForm.ram_gb}
                onChange={(e) => setProvisionForm(p => ({ ...p, ram_gb: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Disk (GB)</Label>
              <Input
                type="number"
                value={provisionForm.disk_space_gb}
                onChange={(e) => setProvisionForm(p => ({ ...p, disk_space_gb: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Bandwidth (GB)</Label>
              <Input
                type="number"
                value={provisionForm.bandwidth_gb}
                onChange={(e) => setProvisionForm(p => ({ ...p, bandwidth_gb: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Admin Notları</Label>
              <Textarea
                value={provisionForm.admin_notes}
                onChange={(e) => setProvisionForm(p => ({ ...p, admin_notes: e.target.value }))}
                placeholder="İsteğe bağlı notlar..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProvisionDialogOpen(false)}>İptal</Button>
            <Button
              onClick={handleProvision}
              disabled={provisionLoading}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {provisionLoading ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Oluşturuluyor...</>
              ) : (
                <><Rocket className="h-4 w-4 mr-2" />Onayla & VDS Oluştur</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sipariş Detayı</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Müşteri</div>
                  <div className="font-medium">{detailOrder.customer?.full_name || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">E-posta</div>
                  <div className="font-medium">{detailOrder.customer?.email || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Paket</div>
                  <div className="font-medium">{detailOrder.package_name || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Fiyat</div>
                  <div className="font-medium">{detailOrder.monthly_price ? formatCurrency(detailOrder.monthly_price) : '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Fatura No</div>
                  <div className="font-mono">{detailOrder.invoice?.invoice_number || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Sipariş Tarihi</div>
                  <div>{formatDate(detailOrder.created_at)}</div>
                </div>
                {detailOrder.provisioned_ip && (
                  <>
                    <div>
                      <div className="text-muted-foreground text-xs">IP Adresi</div>
                      <div className="font-mono">{detailOrder.provisioned_ip}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Kullanıcı</div>
                      <div className="font-mono">{detailOrder.provisioned_username || '-'}</div>
                    </div>
                  </>
                )}
                {detailOrder.admin_notes && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground text-xs">Admin Notları</div>
                    <div>{detailOrder.admin_notes}</div>
                  </div>
                )}
                {detailOrder.error_message && (
                  <div className="col-span-2">
                    <div className="text-destructive text-xs">Hata</div>
                    <div className="text-destructive">{detailOrder.error_message}</div>
                  </div>
                )}
              </div>
              {detailOrder.yoncu_response && (
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Yöncü API Yanıtı</div>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32">
                    {JSON.stringify(detailOrder.yoncu_response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
