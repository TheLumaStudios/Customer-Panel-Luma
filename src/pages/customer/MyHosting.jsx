import { useState } from 'react'
import { useHosting } from '@/hooks/useHosting'
import { useVDS } from '@/hooks/useVDS'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCustomers } from '@/hooks/useCustomers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Server, AlertCircle, Cpu, HardDrive } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function MyHosting() {
  const [activeTab, setActiveTab] = useState('hosting')
  const { profile } = useAuth()
  const { data: allHosting, isLoading: hostingLoading, error: hostingError } = useHosting()
  const { data: allVDS, isLoading: vdsLoading, error: vdsError } = useVDS()
  const { data: customers } = useCustomers()

  // Find current customer's ID
  const currentCustomer = customers?.find(c => c.profile?.email === profile?.email)

  // Filter hosting records for current customer
  const packages = allHosting?.filter(pkg => pkg.customer_id === currentCustomer?.id)

  // Filter VDS records for current customer
  const vdsPackages = allVDS?.filter(vds => vds.customer_id === currentCustomer?.id)

  const isLoading = hostingLoading || vdsLoading
  const error = hostingError || vdsError

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

  const getVDSStatusBadge = (status) => {
    const variants = {
      active: 'default',
      suspended: 'secondary',
      expired: 'destructive',
      terminated: 'destructive',
    }
    const labels = {
      active: 'Aktif',
      suspended: 'Askıda',
      expired: 'Süresi Doldu',
      terminated: 'Sonlandırıldı',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sunucu Paketlerim</h1>
        <p className="text-muted-foreground mt-1">
          Hosting ve VDS/VPS paketlerinizi yönetin
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hosting" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Hosting ({packages?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="vds" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            VDS/VPS ({vdsPackages?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hosting" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="vds" className="space-y-4">
          <Card>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* VDS Expiring Soon Warning */}
          {vdsPackages?.some(vds => {
            if (!vds.expiration_date) return false
            const daysUntilExpiry = Math.ceil((new Date(vds.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
            return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
          }) && (
            <Card className="border-yellow-500 bg-yellow-50">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
