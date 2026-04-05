import { useState } from 'react'
import { useDomains } from '@/hooks/useDomains'
import { useAuth } from '@/hooks/useAuth.jsx'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Globe, AlertCircle, Settings, RefreshCw, Server, Lock, LockOpen } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'
import DnsManager from '@/components/domains/DnsManager'

export default function MyDomains() {
  const { profile } = useAuth()
  const { data: allDomains, isLoading, error } = useDomains()

  const [dnsDialogOpen, setDnsDialogOpen] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)
  const [nsDialogOpen, setNsDialogOpen] = useState(false)
  const [ns1, setNs1] = useState('')
  const [ns2, setNs2] = useState('')

  // Filter domains for current customer
  const domains = allDomains?.filter(domain => domain.customer?.profile?.email === profile?.email)

  const handleOpenDns = (domain) => {
    setSelectedDomain(domain)
    setDnsDialogOpen(true)
  }

  const handleOpenRenew = (domain) => {
    setSelectedDomain(domain)
    setRenewDialogOpen(true)
  }

  const handleOpenNameserver = (domain) => {
    setSelectedDomain(domain)
    setNs1(domain.nameserver_1 || '')
    setNs2(domain.nameserver_2 || '')
    setNsDialogOpen(true)
  }

  const handleSaveNameservers = async () => {
    if (!selectedDomain) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const baseUrl = import.meta.env.VITE_SUPABASE_URL
      const url = baseUrl.includes('/rest/v1') ? baseUrl.replace('/rest/v1', '/functions/v1') : `${baseUrl}/functions/v1`
      const res = await fetch(`${url}/domain-nameservers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ domain_name: selectedDomain.domain_name, nameservers: [ns1, ns2].filter(Boolean) }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      toast.success('Nameserver güncellendi')
      setNsDialogOpen(false)
    } catch (err) {
      toast.error('Nameserver güncellenemedi', { description: err.message })
    }
  }

  const handleTransferLockToggle = async (domain) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const baseUrl = import.meta.env.VITE_SUPABASE_URL
      const url = baseUrl.includes('/rest/v1') ? baseUrl.replace('/rest/v1', '/functions/v1') : `${baseUrl}/functions/v1`
      const res = await fetch(`${url}/domain-lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ domain_name: domain.domain_name, lock: true }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      toast.success('Transfer kilidi güncellendi')
    } catch (err) {
      toast.error('İşlem başarısız', { description: err.message })
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
    return <StatusBadge status={status} />
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Domainlerim</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Domain adlarınızı ve yenileme tarihlerini görüntüleyin
          </p>
        </div>
      </div>

      <Card className="rounded-xl">
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
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains?.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          {domain.domain_name}
                        </div>
                        {domain.cf_nameservers?.length > 0 && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 pl-6">
                            NS: {domain.cf_nameservers.join(', ')}
                          </div>
                        )}
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDns(domain)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          DNS
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenNameserver(domain)}
                        >
                          <Server className="h-4 w-4 mr-1" />
                          NS
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRenew(domain)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Yenile
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTransferLockToggle(domain)}
                          title="Transfer Kilidi"
                        >
                          {domain.transfer_lock ? (
                            <Lock className="h-4 w-4 text-green-600" />
                          ) : (
                            <LockOpen className="h-4 w-4 text-muted-foreground" />
                          )}
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
      {domains?.some(d => {
        const daysUntilExpiry = Math.ceil((new Date(d.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
      }) && (
        <Card className="border-yellow-500 bg-yellow-50 rounded-xl">
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

      {/* DNS Yönetimi Dialog */}
      <Dialog open={dnsDialogOpen} onOpenChange={setDnsDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DNS Yönetimi</DialogTitle>
            <DialogDescription>
              {selectedDomain?.domain_name} için DNS kayıtlarını yönetin
            </DialogDescription>
          </DialogHeader>
          {selectedDomain && (
            <DnsManager
              domainId={selectedDomain.id}
              domainName={selectedDomain.domain_name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Domain Yenileme Dialog */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Domain Yenileme</DialogTitle>
            <DialogDescription>
              {selectedDomain?.domain_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              <strong>{selectedDomain?.domain_name}</strong> alan adınızı yenilemek üzeresiniz.
            </p>
            <Button className="w-full" onClick={async () => {
              try {
                const { data: { session } } = await supabase.auth.getSession()
                const baseUrl = import.meta.env.VITE_SUPABASE_URL
                const url = baseUrl.includes('/rest/v1') ? baseUrl.replace('/rest/v1', '/functions/v1') : `${baseUrl}/functions/v1`
                const res = await fetch(`${url}/domain-renew`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                  body: JSON.stringify({ domain_name: selectedDomain.domain_name, period: 1 }),
                })
                const result = await res.json()
                if (!result.success) throw new Error(result.error)
                toast.success('Domain yenileme talebi oluşturuldu', { description: 'Faturanız oluşturulacak' })
                setRenewDialogOpen(false)
              } catch (err) {
                toast.error('Yenileme başarısız', { description: err.message })
              }
            }}>
              1 Yıl Yenile
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nameserver Dialog */}
      <Dialog open={nsDialogOpen} onOpenChange={setNsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nameserver Ayarları</DialogTitle>
            <DialogDescription>
              {selectedDomain?.domain_name} için nameserver bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ns1">Nameserver 1</Label>
              <Input
                id="ns1"
                value={ns1}
                onChange={(e) => setNs1(e.target.value)}
                placeholder="ns1.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ns2">Nameserver 2</Label>
              <Input
                id="ns2"
                value={ns2}
                onChange={(e) => setNs2(e.target.value)}
                placeholder="ns2.example.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNsDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSaveNameservers}>
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
