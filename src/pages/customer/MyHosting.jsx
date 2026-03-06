import { useState } from 'react'
import { useHosting } from '@/hooks/useHosting'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCustomers } from '@/hooks/useCustomers'
import { useCreateTicket } from '@/hooks/useTickets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Server, AlertCircle, Eye, Copy, Check, RotateCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

export default function MyHosting() {
  const [selectedHosting, setSelectedHosting] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
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
      await createTicket.mutateAsync({
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hosting Paketlerim</h1>
        <p className="text-muted-foreground mt-1">
          Hosting paketlerinizi yönetin ve erişim bilgilerine ulaşın
        </p>
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

      <Card>
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
                {packages?.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        {pkg.package_name}
                      </div>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowDetails(pkg)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Bilgileri Göster
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestartRequest(pkg)}
                          disabled={pkg.status !== 'active'}
                        >
                          <RotateCw className="h-4 w-4 mr-2" />
                          Restart
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
      {packages?.some(pkg => {
        const daysUntilExpiry = Math.ceil((new Date(pkg.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
      }) && (
        <Card className="border-yellow-500 bg-yellow-50">
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
    </div>
  )
}
