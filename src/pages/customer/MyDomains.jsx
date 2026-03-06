import { useDomains } from '@/hooks/useDomains'
import { useAuth } from '@/hooks/useAuth.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Globe, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function MyDomains() {
  const { profile } = useAuth()
  const { data: allDomains, isLoading, error } = useDomains()

  // Filter domains for current customer
  const domains = allDomains?.filter(domain => domain.customer?.profile?.email === profile?.email)

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
      <div>
        <h1 className="text-3xl font-bold">Domainlerim</h1>
        <p className="text-muted-foreground mt-1">
          Domain adlarınızı ve yenileme tarihlerini görüntüleyin
        </p>
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
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz domain kaydınız bulunmuyor.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain Adı</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>Son Kullanma Tarihi</TableHead>
                  <TableHead>Kalan Süre</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Otomatik Yenileme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains?.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {domain.domain_name}
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
              <CardTitle className="text-yellow-900">Dikkat: Yakında Sona Erecek Domainler</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">
              {domains?.filter(d => {
                const daysUntilExpiry = Math.ceil((new Date(d.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
                return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
              }).length} domain 30 gün içinde sona erecek. Lütfen yenileme işlemlerinizi zamanında yapın.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
