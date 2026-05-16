import { useState, useEffect } from 'react'
import { useVDS } from '@/hooks/useVDS'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCustomers } from '@/hooks/useCustomers'
import { supabase } from '@/lib/supabase'
import { useDevMode } from '@/contexts/DevModeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Cpu, HardDrive, AlertCircle, Eye, Copy, Check, Terminal, Monitor, Activity, Wifi } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function MyVDS() {
  const [selectedVDS, setSelectedVDS] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [usageMetrics, setUsageMetrics] = useState([]) // { service_id, metric_type, quantity, period_start }
  const { profile } = useAuth()
  const { devMode } = useDevMode()
  const { data: allVDS, isLoading, error } = useVDS()
  const { data: customers } = useCustomers()

  // Find current customer's ID
  const currentCustomer = customers?.find(c => c.email === profile?.email)

  // Filter VDS records for current customer
  const vdsPackages = allVDS?.filter(vds => vds.customer_id === currentCustomer?.id)

  // Mevcut ay usage metriklerini çek
  useEffect(() => {
    if (!currentCustomer?.id) return
    const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    supabase
      .from('usage_metrics')
      .select('service_id, metric_type, quantity, period_start')
      .eq('customer_id', currentCustomer.id)
      .gte('period_start', periodStart)
      .then(({ data }) => setUsageMetrics(data || []))
  }, [currentCustomer?.id])

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleShowDetails = (vds) => {
    setSelectedVDS(vds)
    setDetailsOpen(true)
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

  const getVDSStatusBadge = (status) => {
    return <StatusBadge status={status} />
  }

  const getVDSTypeBadge = (type) => {
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

  const CopyableField = ({ label, value, fieldName, icon }) => {
    if (!value) return null

    return (
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            {icon}
            {label}
          </div>
          <div className="font-mono text-sm">{value}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2"
          onClick={() => handleCopy(value, fieldName)}
        >
          {copiedField === fieldName ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">VDS / VPS Sunucularım</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sanal sunucularınızı yönetin
          </p>
        </div>
      </div>

      {/* VDS Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedVDS?.vds_name}</DialogTitle>
            <DialogDescription>
              VDS/VPS sunucunuzun erişim bilgileri ve detayları
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Server Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Sunucu Tipi</div>
                <div>{getVDSTypeBadge(selectedVDS?.vds_type)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Durum</div>
                <div>{getVDSStatusBadge(selectedVDS?.status)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">İşletim Sistemi</div>
                <div className="text-sm">{selectedVDS?.operating_system || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Bitiş Tarihi</div>
                <div className="text-sm">
                  {selectedVDS?.expiration_date ? formatDate(selectedVDS.expiration_date) : 'Sınırsız'}
                </div>
              </div>
            </div>

            {/* Server Specs */}
            <div className="p-3 bg-muted/30 rounded-md">
              <div className="text-xs text-muted-foreground mb-2">Sunucu Özellikleri</div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  <span>{selectedVDS?.cpu_cores} Core</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  <span>{selectedVDS?.ram_gb} GB RAM</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>{selectedVDS?.disk_space_gb} GB Disk</span>
                </div>
              </div>
            </div>

            {/* Access Credentials */}
            <div className="space-y-3 pt-3 border-t">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Erişim Bilgileri
              </h4>

              <CopyableField
                label="IP Adresi"
                value={selectedVDS?.ip_address}
                fieldName="ip_address"
              />

              <CopyableField
                label="SSH Port"
                value={selectedVDS?.ssh_port}
                fieldName="ssh_port"
              />

              <CopyableField
                label="Root Şifre"
                value={selectedVDS?.root_password}
                fieldName="root_password"
                icon={<Terminal className="h-3 w-3" />}
              />

              {selectedVDS?.control_panel_url && (
                <>
                  <div className="text-xs font-medium text-muted-foreground pt-2 flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    Kontrol Paneli
                  </div>

                  <CopyableField
                    label="Panel URL"
                    value={selectedVDS?.control_panel_url}
                    fieldName="control_panel_url"
                  />

                  <CopyableField
                    label="Panel Kullanıcı Adı"
                    value={selectedVDS?.control_panel_username}
                    fieldName="control_panel_username"
                  />

                  <CopyableField
                    label="Panel Şifre"
                    value={selectedVDS?.control_panel_password}
                    fieldName="control_panel_password"
                  />
                </>
              )}

              {selectedVDS?.vnc_port && (
                <>
                  <div className="text-xs font-medium text-muted-foreground pt-2">VNC Erişimi</div>

                  <CopyableField
                    label="VNC Port"
                    value={selectedVDS?.vnc_port}
                    fieldName="vnc_port"
                  />

                  <CopyableField
                    label="VNC Şifre"
                    value={selectedVDS?.vnc_password}
                    fieldName="vnc_password"
                  />
                </>
              )}

              {selectedVDS?.notes && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-xs font-medium text-blue-900 mb-1">Notlar</div>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedVDS.notes}</p>
                </div>
              )}
            </div>

            {!selectedVDS?.root_password && !selectedVDS?.ip_address && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ℹ️ Erişim bilgileri henüz tanımlanmamış. Lütfen destek ekibi ile iletişime geçin.
                </p>
              </div>
            )}

            {selectedVDS?.root_password && (
              <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
                <strong>SSH Bağlantı:</strong> <code className="bg-background px-1 py-0.5 rounded">ssh root@{selectedVDS.ip_address}{selectedVDS.ssh_port && selectedVDS.ssh_port !== 22 ? ` -p ${selectedVDS.ssh_port}` : ''}</code>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>VDS / VPS Sunucularım</CardTitle>
          <CardDescription>
            Toplam {vdsPackages?.length || 0} sunucu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vdsPackages?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz VDS/VPS sunucunuz bulunmuyor.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sunucu Adı</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Özellikler</TableHead>
                  <TableHead>IP Adresi</TableHead>
                  <TableHead>İşletim Sistemi</TableHead>
                  <TableHead>Bitiş Tarihi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vdsPackages?.map((vds) => (
                  <TableRow key={vds.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        {vds.vds_name}
                      </div>
                    </TableCell>
                    <TableCell>{getVDSTypeBadge(vds.vds_type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {vds.cpu_cores} Core
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {vds.ram_gb} GB RAM
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          {vds.disk_space_gb} GB Disk
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {vds.ip_address || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{vds.operating_system || '-'}</span>
                    </TableCell>
                    <TableCell>
                      {vds.expiration_date ? (
                        <div>
                          <div className="text-sm">{formatDate(vds.expiration_date)}</div>
                          {vds.expiration_date && getExpirationBadge(vds.expiration_date)}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sınırsız</span>
                      )}
                    </TableCell>
                    <TableCell>{getVDSStatusBadge(vds.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowDetails(vds)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Bilgileri Göster
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      {vdsPackages && vdsPackages.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Bu Ay Kullanım
            </CardTitle>
            <CardDescription>
              Aylık dahil edilmiş limitler ve mevcut kullanım
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vdsPackages.map((vds) => {
              const bwMetric = usageMetrics.find(m => m.service_id === vds.id && m.metric_type === 'bandwidth_gb')
              const bwUsed = bwMetric?.quantity ?? 0
              const bwLimit = 1000 // 1 TB dahil (usage_billing_rules'dan)
              const bwPct = Math.min(100, Math.round((bwUsed / bwLimit) * 100))

              return (
                <div key={vds.id} className="space-y-2 pb-4 border-b last:border-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-1.5">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      {vds.vds_name}
                    </span>
                    <span className="text-xs text-muted-foreground">{vds.ip_address || 'IP atanmadı'}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        Bandwidth
                      </span>
                      <span>
                        {bwUsed >= 1000
                          ? `${(bwUsed / 1000).toFixed(2)} TB`
                          : `${bwUsed.toFixed(1)} GB`
                        } / {bwLimit} GB
                        {bwUsed > bwLimit && (
                          <span className="ml-1 text-red-500 font-medium">
                            (+{(bwUsed - bwLimit).toFixed(1)} GB aşım)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          bwPct >= 90 ? 'bg-red-500' : bwPct >= 75 ? 'bg-orange-400' : 'bg-primary'
                        }`}
                        style={{ width: `${bwPct}%` }}
                      />
                    </div>
                    {bwUsed === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Kullanım verisi henüz kaydedilmedi.
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* DevMode Panel */}
      {devMode && vdsPackages && vdsPackages.length > 0 && (
        <Card className="rounded-xl border-violet-300 bg-violet-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-violet-900 text-sm">
              <Terminal className="h-4 w-4" />
              Geliştirici Modu — VDS API Referansı
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vdsPackages.map((vds) => (
              <div key={vds.id} className="space-y-2 pb-4 border-b border-violet-200 last:border-0">
                <p className="text-xs font-semibold text-violet-800">{vds.vds_name} ({vds.ip_address || 'IP yok'})</p>
                <div className="rounded-md bg-gray-900 text-green-400 text-xs p-3 font-mono space-y-1 overflow-x-auto">
                  <p className="text-gray-400"># VDS listeni çek</p>
                  <p>curl -X GET \</p>
                  <p>  "{import.meta.env.VITE_SUPABASE_URL}/rest/v1/vds_packages?customer_id=eq.{currentCustomer?.id}" \</p>
                  <p>  -H "apikey: {'<API_KEY>'}" \</p>
                  <p>  -H "Authorization: Bearer {'<ACCESS_TOKEN>'}"</p>
                  <p className="mt-2 text-gray-400"># Belirli sunucu ID: {vds.id}</p>
                  <p>curl -X GET \</p>
                  <p>  "{import.meta.env.VITE_SUPABASE_URL}/rest/v1/vds_packages?id=eq.{vds.id}" \</p>
                  <p>  -H "apikey: {'<API_KEY>'}" \</p>
                  <p>  -H "Authorization: Bearer {'<ACCESS_TOKEN>'}"</p>
                </div>
              </div>
            ))}
            <p className="text-[11px] text-violet-700">
              API anahtarını <a href="/api-keys" className="underline font-medium">API Anahtarları</a> sayfasından alabilirsin.
              Access Token için oturum açma sonrası <code className="bg-violet-100 px-1 rounded">supabase.auth.getSession()</code> kullan.
            </p>
          </CardContent>
        </Card>
      )}

      {/* VDS Expiring Soon Warning */}
      {vdsPackages?.some(vds => {
        if (!vds.expiration_date) return false
        const daysUntilExpiry = Math.ceil((new Date(vds.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
      }) && (
        <Card className="border-yellow-500 bg-yellow-50 rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-900">Dikkat: Yakında Sona Erecek Sunucular</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">
              {vdsPackages?.filter(vds => {
                if (!vds.expiration_date) return false
                const daysUntilExpiry = Math.ceil((new Date(vds.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
                return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
              }).length} VDS/VPS sunucu 30 gün içinde sona erecek. Lütfen yenileme işlemlerinizi zamanında yapın.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
