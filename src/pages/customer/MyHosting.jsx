import { useState } from 'react'
import { useHosting } from '@/hooks/useHosting'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCustomers } from '@/hooks/useCustomers'
import { useCreateTicket } from '@/hooks/useTickets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Server, AlertCircle, Eye, Copy, Check, RotateCw, ExternalLink, Mail, ArrowUpDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import PackageUpgradeDialog from '@/components/hosting/PackageUpgradeDialog'

export default function MyHosting() {
  const [selectedHosting, setSelectedHosting] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [ssoLoading, setSsoLoading] = useState(null)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [upgradeHosting, setUpgradeHosting] = useState(null)
  const { profile } = useAuth()
  const { data: allHosting, isLoading, error } = useHosting()
  const { data: customers } = useCustomers()
  const createTicket = useCreateTicket()

  // Find current customer's ID
  const currentCustomer = customers?.find(c => c.email === profile?.email)

  // Filter hosting records for current customer
  const packages = allHosting?.filter(pkg => pkg.customer_id === currentCustomer?.id)

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleShowDetails = (pkg) => {
    setSelectedHosting(pkg)
    setDetailsOpen(true)
  }

  const handleRestartRequest = async (pkg) => {
    if (!currentCustomer) {
      toast.error('Müşteri bilgisi bulunamadı', {
        description: 'Lütfen sayfayı yenileyin'
      })
      return
    }

    if (!confirm(`${pkg.package_name} için restart talebi oluşturmak istediğinize emin misiniz?`)) {
      return
    }

    try {
      const ticketNumber = `TK-${Date.now().toString(36).toUpperCase()}`
      await createTicket.mutateAsync({
        ticket_number: ticketNumber,
        customer_id: currentCustomer.id,
        subject: `Hosting Restart Talebi - ${pkg.package_name}`,
        description: `${pkg.package_name} hosting paketi için restart talebi.

        Hosting Bilgileri:
        - Paket Adı: ${pkg.package_name}
        - Paket Tipi: ${pkg.package_type}
        - Disk Alanı: ${pkg.disk_space_gb ? `${pkg.disk_space_gb} GB` : 'Sınırsız'}
        - cPanel Kullanıcı: ${pkg.cpanel_username || '-'}
        - Server IP: ${pkg.server_ip || '-'}

Lütfen en kısa sürede hosting paketimi restart ediniz.`,
        category: 'hosting',
        priority: 'high',
        status: 'open',
      })

      toast.success('Restart talebi oluşturuldu', {
        description: 'Talebiniz en kısa sürede işleme alınacak'
      })
    } catch (error) {
      console.error('Restart request error:', error)
      toast.error('Talep oluşturulamadı', {
        description: error.message
      })
    }
  }

  const handleSso = async (pkg, target) => {
    const key = `${pkg.id}-${target}`
// Open the tab synchronously in direct response to the click so the
// browser preserves the user gesture and does not block the popup.
    const newWindow = window.open('about:blank', '_blank')
    if (!newWindow) {
      toast.error('Popup engellendi', {
        description: 'Lütfen bu site için popup engelleyicisine izin verin ve tekrar deneyin.',
      })
      return
    }
// Show a loading screen in the new tab while we wait for WHM to mint the session
    try {
      newWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${target === 'webmail' ? 'Webmail' : 'cPanel'} yükleniyor…</title><style>
        html,body{height:100%;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0}
        .wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
        .spin{width:42px;height:42px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:#38bdf8;animation:s 0.9s linear infinite}
        @keyframes s{to{transform:rotate(360deg)}}
        .t{font-size:15px;opacity:.85}
        .s{font-size:12px;opacity:.55}
      </style></head><body><div class="wrap"><div class="spin"></div><div class="t">${target === 'webmail' ? 'Webmail' : 'cPanel'} oturumu hazırlanıyor…</div><div class="s">Bu sekme otomatik olarak yönlendirilecek.</div></div></body></html>`)
      newWindow.document.close()
    } catch (_) { /* cross-origin or closed */ }
    setSsoLoading(key)
    try {
      const { data, error } = await supabase.functions.invoke('cpanel-sso', {
        body: { hosting_id: pkg.id, target },
      })
// When the edge function returns a non-2xx, supabase-js sets `error`
// but the real body (our { success, error } payload) is inside
// `error.context` as a Response. Read it to get the actual message.
      if (error) {
        let bodyMsg = error.message
        try {
          const ctx = error.context
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json()
            bodyMsg = body?.error || bodyMsg
          }
        } catch (_) { /* ignore parse error */ }
        throw new Error(bodyMsg)
      }

      if (data?.success && data?.url) {
        newWindow.location.href = data.url
      } else {
        throw new Error(data?.error || 'SSO oturumu oluşturulamadı')
      }
    } catch (error) {
      try { newWindow.close() } catch (_) { /* ignore */ }
      toast.error('Giriş başarısız', { description: error.message })
    } finally {
      setSsoLoading(null)
    }
  }

  const handleOpenUpgrade = (pkg) => {
    setUpgradeHosting(pkg)
    setUpgradeDialogOpen(true)
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
    return <StatusBadge status={status} />
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

  const CopyableField = ({ label, value, fieldName }) => {
    if (!value) return null

    return (
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1">{label}</div>
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
          <h1 className="text-2xl font-bold tracking-tight">Hosting Paketlerim</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hosting paketlerinizi yönetin ve erişim bilgilerine ulaşın
          </p>
        </div>
      </div>

      {/* Hosting Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedHosting?.package_name}</DialogTitle>
            <DialogDescription>
              Hosting paketinizin erişim bilgileri ve detayları
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Package Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Paket Tipi</div>
                <div>{getPackageTypeBadge(selectedHosting?.package_type)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Durum</div>
                <div>{getStatusBadge(selectedHosting?.status)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Disk Alanı</div>
                <div className="text-sm">
                  {selectedHosting?.disk_space_gb ? `${selectedHosting.disk_space_gb} GB` : 'Sınırsız'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Bitiş Tarihi</div>
                <div className="text-sm">{formatDate(selectedHosting?.expiration_date)}</div>
              </div>
            </div>

            {/* Credentials */}
            <div className="space-y-3 pt-3 border-t">
              <h4 className="font-semibold text-sm">Erişim Bilgileri</h4>

              <CopyableField
                label="Server IP"
                value={selectedHosting?.server_ip}
                fieldName="server_ip"
              />

              <CopyableField
                label="cPanel Kullanıcı Adı"
                value={selectedHosting?.cpanel_username}
                fieldName="cpanel_username"
              />

              <CopyableField
                label="cPanel Şifre"
                value={selectedHosting?.cpanel_password}
                fieldName="cpanel_password"
              />

              <CopyableField
                label="FTP Kullanıcı Adı"
                value={selectedHosting?.ftp_username}
                fieldName="ftp_username"
              />

              <CopyableField
                label="FTP Şifre"
                value={selectedHosting?.ftp_password}
                fieldName="ftp_password"
              />

              <CopyableField
                label="Nameserver 1"
                value={selectedHosting?.nameserver_1}
                fieldName="nameserver_1"
              />

              <CopyableField
                label="Nameserver 2"
                value={selectedHosting?.nameserver_2}
                fieldName="nameserver_2"
              />
            </div>

            {!selectedHosting?.cpanel_username && !selectedHosting?.server_ip && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ℹ️ Erişim bilgileri henüz tanımlanmamış. Lütfen destek ekibi ile iletişime geçin.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Hosting Paketleri</CardTitle>
          <CardDescription>
            Toplam {packages?.length || 0} paket
          </CardDescription>
        </CardHeader>
        <CardContent>
          {packages?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz hosting paketiniz bulunmuyor.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paket Adı</TableHead>
                  <TableHead>Paket Tipi</TableHead>
                  <TableHead>Disk Alanı</TableHead>
                  <TableHead>Başlangıç Tarihi</TableHead>
                  <TableHead>Bitiş Tarihi</TableHead>
                  <TableHead>Kalan Süre</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages?.map((pkg) => {
                  const canSso = pkg.status === 'active' && !!pkg.cpanel_username
                  return (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">
                      {canSso ? (
                        <button
                          type="button"
                          onClick={() => handleSso(pkg, 'cpanel')}
                          disabled={ssoLoading === `${pkg.id}-cpanel`}
                          className="group inline-flex items-center gap-2 text-left hover:text-primary transition-colors disabled:opacity-60"
                          title="cPanel'e tek tıkla giriş"
                        >
                          <Server className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          <span className="underline decoration-dotted underline-offset-4">
                            {pkg.package_name}
                          </span>
                          {ssoLoading === `${pkg.id}-cpanel` && (
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          {pkg.package_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getPackageTypeBadge(pkg.package_type)}</TableCell>
                    <TableCell>
                      {pkg.disk_space_gb ? `${pkg.disk_space_gb} GB` : 'Sınırsız'}
                    </TableCell>
                    <TableCell>{formatDate(pkg.start_date)}</TableCell>
                    <TableCell>{formatDate(pkg.expiration_date)}</TableCell>
                    <TableCell>{getExpirationBadge(pkg.expiration_date)}</TableCell>
                    <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowDetails(pkg)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Bilgiler
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSso(pkg, 'cpanel')}
                          disabled={pkg.status !== 'active' || ssoLoading === `${pkg.id}-cpanel`}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          cPanel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSso(pkg, 'webmail')}
                          disabled={pkg.status !== 'active' || ssoLoading === `${pkg.id}-webmail`}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Webmail
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenUpgrade(pkg)}
                        >
                          <ArrowUpDown className="h-4 w-4 mr-1" />
                          Paket
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestartRequest(pkg)}
                          disabled={pkg.status !== 'active'}
                        >
                          <RotateCw className="h-4 w-4 mr-1" />
                          Restart
                        </Button>
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

      {/* Expiring Soon Warning */}
      {packages?.some(pkg => {
        const daysUntilExpiry = Math.ceil((new Date(pkg.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
      }) && (
        <Card className="border-yellow-500 bg-yellow-50 rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-900">Dikkat: Yakında Sona Erecek Paketler</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">
              {packages?.filter(pkg => {
                const daysUntilExpiry = Math.ceil((new Date(pkg.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
                return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
              }).length} hosting paketi 30 gün içinde sona erecek. Lütfen yenileme işlemlerinizi zamanında yapın.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Package Upgrade Dialog */}
      {upgradeHosting && (
        <PackageUpgradeDialog
          hostingId={upgradeHosting.id}
          currentPackageId={upgradeHosting.package_id}
          open={upgradeDialogOpen}
          onClose={() => {
            setUpgradeDialogOpen(false)
            setUpgradeHosting(null)
          }}
        />
      )}
    </div>
  )
}
