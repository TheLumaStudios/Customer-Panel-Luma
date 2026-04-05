import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from '@/lib/toast'
import {
  Cloud, RefreshCw, Trash2, Search, Shield, Zap, Globe, Settings,
  CheckCircle2, Clock, AlertTriangle, Plus, Database, Copy, Link2, X
} from 'lucide-react'

export default function CloudflareManager() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Zone Detail
  const [selectedZone, setSelectedZone] = useState(null)
  const [detailTab, setDetailTab] = useState('dns')
  const [dnsRecords, setDnsRecords] = useState([])
  const [zoneSettings, setZoneSettings] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  // Add/Edit DNS
  const [dnsDialogOpen, setDnsDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  const dnsSchema = z.object({
    type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA']),
    name: z.string().min(1, 'Ad alanı zorunlu'),
    content: z.string().min(1, 'Değer alanı zorunlu'),
    ttl: z.number().default(1),
    proxied: z.boolean().default(true),
    priority: z.number().optional(),
  })

  const dnsForm = useForm({
    resolver: zodResolver(dnsSchema),
    defaultValues: { type: 'A', name: '', content: '', ttl: 1, proxied: true, priority: 10 },
  })

  const callCf = useCallback(async (functionName, body) => {
    const { data: { session } } = await supabase.auth.getSession()
    const baseUrl = import.meta.env.VITE_SUPABASE_URL
    const url = baseUrl.includes('/rest/v1') ? baseUrl.replace('/rest/v1', '/functions/v1') : `${baseUrl}/functions/v1`
    const res = await fetch(`${url}/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify(body),
    })
    return res.json()
  }, [])

  // ─── Fetch ───
  const fetchZones = useCallback(async () => {
    setLoading(true)
    try {
      const result = await callCf('cf-zones-list', {})
      if (!result.success) throw new Error(result.error)
      setZones(result.zones || [])
    } catch (err) {
      toast.error('Zone listesi alınamadı', { description: err.message })
    } finally {
      setLoading(false)
    }
  }, [callCf])

  useEffect(() => { fetchZones() }, [fetchZones])

  const fetchDns = async (zoneId) => {
    setDetailLoading(true)
    try {
      const result = await callCf('cf-dns-sync', { action: 'list', zone_id: zoneId })
      if (result.success) setDnsRecords(result.records || [])
      else throw new Error(result.error)
    } catch (err) {
      setDnsRecords([])
    } finally {
      setDetailLoading(false)
    }
  }

  const fetchSettings = async (zoneId) => {
    setDetailLoading(true)
    try {
      const result = await callCf('cf-zone-settings', { action: 'get', zone_id: zoneId })
      if (result.success) setZoneSettings(result.settings)
    } catch {
      setZoneSettings(null)
    } finally {
      setDetailLoading(false)
    }
  }

  // ─── Actions ───
  const openDetail = (zone) => {
    setSelectedZone(zone)
    setDetailTab('dns')
    fetchDns(zone.id)
  }

  const switchTab = (tab) => {
    setDetailTab(tab)
    if (tab === 'dns') fetchDns(selectedZone.id)
    if (tab === 'settings') fetchSettings(selectedZone.id)
  }

  const linkToSystem = async (zone) => {
    setActionLoading(zone.id)
    try {
      const result = await callCf('cf-zone-link', {
        zone_id: zone.id,
        zone_name: zone.name,
        zone_status: zone.status,
        name_servers: zone.name_servers,
      })
      if (!result.success) throw new Error(result.error)
      toast.success(result.message)
      fetchZones()
    } catch (err) {
      toast.error('Bağlantı hatası', { description: err.message })
    } finally {
      setActionLoading(null)
    }
  }

  const deleteZone = async (zone) => {
    if (!confirm(`${zone.name} Cloudflare'dan silinecek. Emin misiniz?`)) return
    setActionLoading(zone.id)
    try {
      const { data: domain } = await supabase.from('domains').select('id').eq('cf_zone_id', zone.id).maybeSingle()
      if (domain) {
        await callCf('cf-zone-delete', { domain_id: domain.id })
      }
      toast.success('Zone silindi')
      setSelectedZone(null)
      fetchZones()
    } catch (err) {
      toast.error('Silinemedi', { description: err.message })
    } finally {
      setActionLoading(null)
    }
  }

  const updateSetting = async (setting, value) => {
    try {
      const result = await callCf('cf-zone-settings', { action: 'update', zone_id: selectedZone.id, setting, value })
      if (!result.success) throw new Error(result.error)
      setZoneSettings(prev => ({ ...prev, [setting]: value }))
      toast.success('Güncellendi')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const purgeCache = async () => {
    if (!confirm('Tüm cache temizlenecek. Emin misiniz?')) return
    try {
      const result = await callCf('cf-zone-settings', { action: 'purge_cache', zone_id: selectedZone.id })
      if (!result.success) throw new Error(result.error)
      toast.success('Cache temizlendi')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const openDnsAdd = () => {
    setEditingRecord(null)
    dnsForm.reset({ type: 'A', name: '', content: '', ttl: 1, proxied: true, priority: 10 })
    setDnsDialogOpen(true)
  }

  const openDnsEdit = (rec) => {
    setEditingRecord(rec)
    dnsForm.reset({
      type: rec.type,
      name: rec.name,
      content: rec.content,
      ttl: rec.ttl || 1,
      proxied: rec.proxied || false,
      priority: rec.priority || 10,
    })
    setDnsDialogOpen(true)
  }

  const onDnsSubmit = async (data) => {
    try {
      if (editingRecord) {
        const result = await callCf('cf-dns-sync', {
          action: 'update',
          zone_id: selectedZone.id,
          record: { id: editingRecord.id, ...data },
        })
        if (!result.success) throw new Error(result.error)
        toast.success('DNS kaydı güncellendi')
      } else {
        const result = await callCf('cf-dns-sync', { action: 'create', zone_id: selectedZone.id, record: data })
        if (!result.success) throw new Error(result.error)
        toast.success('DNS kaydı eklendi')
      }
      setDnsDialogOpen(false)
      fetchDns(selectedZone.id)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const deleteDns = async (id) => {
    if (!confirm('Bu kayıt silinecek. Emin misiniz?')) return
    try {
      const result = await callCf('cf-dns-sync', { action: 'delete', zone_id: selectedZone.id, record: { id } })
      if (!result.success) throw new Error(result.error)
      toast.success('Silindi')
      fetchDns(selectedZone.id)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const copyNs = (ns) => {
    navigator.clipboard.writeText(ns.join('\n'))
    toast.success('Nameserver\'lar kopyalandı')
  }

  const filteredZones = zones.filter(z => z.name.toLowerCase().includes(search.toLowerCase()))

  // ─── Render ───
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Cloud className="h-6 w-6 text-orange-500" />
            Cloudflare Yönetimi
          </h1>
          <p className="page-description">DNS, SSL, cache ve güvenlik ayarlarını tek panelden yönetin</p>
        </div>
        <Button onClick={fetchZones} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Zone', value: zones.length, icon: Cloud, color: 'bg-orange-100 text-orange-600' },
          { label: 'Aktif', value: zones.filter(z => z.status === 'active').length, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'NS Bekliyor', value: zones.filter(z => z.status === 'pending').length, icon: Clock, color: 'bg-amber-100 text-amber-600' },
          { label: 'Sisteme Bağlı', value: zones.filter(z => z.linked).length, icon: Link2, color: 'bg-blue-100 text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-card-label">{s.label}</p>
                <p className="stat-card-value">{s.value}</p>
              </div>
              <div className={`stat-card-icon ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zone Table */}
      <Card className="rounded-xl shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg">Zone Listesi</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Domain ara..." className="pl-9 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Domain</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Nameserver</TableHead>
                <TableHead>Sistem</TableHead>
                <TableHead className="text-right pr-6">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 80}px` }} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredZones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <Cloud className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-muted-foreground">{zones.length === 0 ? 'Henüz zone yok' : 'Aramayla eşleşen domain yok'}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredZones.map((zone) => (
                  <TableRow key={zone.id} className="group cursor-pointer hover:bg-muted/30" onClick={() => openDetail(zone)}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${zone.status === 'active' ? 'bg-emerald-500' : zone.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
                        <span className="font-medium">{zone.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${zone.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {zone.status === 'active' ? 'Aktif' : 'NS Bekliyor'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {zone.name_servers?.[0]}
                        </code>
                        <button onClick={(e) => { e.stopPropagation(); copyNs(zone.name_servers) }} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded">
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {zone.linked ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">
                          <CheckCircle2 className="h-3 w-3" /> Bağlı
                        </Badge>
                      ) : (
                        <Button
                          variant="outline" size="sm" className="h-7 text-xs gap-1.5"
                          disabled={actionLoading === zone.id}
                          onClick={() => linkToSystem(zone)}
                        >
                          {actionLoading === zone.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
                          Sisteme Bağla
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => deleteZone(zone)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ═══════════ Zone Detail Panel ═══════════ */}
      <Dialog open={!!selectedZone} onOpenChange={(open) => !open && setSelectedZone(null)}>
        <DialogContent className="w-[900px] max-w-[90vw] h-[680px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          {selectedZone && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <Cloud className="h-6 w-6" />
                      <h2 className="text-xl font-bold">{selectedZone.name}</h2>
                      <Badge className={`text-xs ${selectedZone.status === 'active' ? 'bg-white/20 text-white' : 'bg-yellow-300 text-yellow-900'}`}>
                        {selectedZone.status === 'active' ? 'Aktif' : 'NS Bekliyor'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-white/80 text-sm">
                      <span>NS:</span>
                      <code className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">
                        {selectedZone.name_servers?.join(' • ')}
                      </code>
                      <button onClick={() => copyNs(selectedZone.name_servers)} className="hover:text-white">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" className="gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white border-0" onClick={purgeCache}>
                      <Zap className="h-3.5 w-3.5" /> Cache Temizle
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center border-b px-6 bg-muted/20">
                {[
                  { key: 'dns', label: 'DNS Kayıtları', icon: Globe },
                  { key: 'settings', label: 'Güvenlik & Cache', icon: Shield },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => switchTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      detailTab === tab.key
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : detailTab === 'dns' ? (
                  <div className="p-6">
                    {/* Add button */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">{dnsRecords.length} kayıt</p>
                      <Button size="sm" className="gap-1.5" onClick={openDnsAdd}>
                        <Plus className="h-3.5 w-3.5" /> Kayıt Ekle
                      </Button>
                    </div>

                    {/* DNS Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="w-20">Tür</TableHead>
                            <TableHead>Ad</TableHead>
                            <TableHead>Değer</TableHead>
                            <TableHead className="w-20">TTL</TableHead>
                            <TableHead className="w-24">Proxy</TableHead>
                            <TableHead className="w-20"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dnsRecords.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">DNS kaydı bulunamadı</TableCell>
                            </TableRow>
                          ) : (
                            dnsRecords.map((rec) => (
                              <TableRow key={rec.id} className="group">
                                <TableCell>
                                  <Badge variant="outline" className="font-mono text-[11px] px-1.5">{rec.type}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{rec.name}</TableCell>
                                <TableCell>
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded max-w-[250px] truncate block">{rec.content}</code>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{rec.ttl === 1 ? 'Auto' : `${rec.ttl}s`}</TableCell>
                                <TableCell>
                                  {rec.proxied ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-orange-600"><Cloud className="h-3 w-3" /> On</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Off</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDnsEdit(rec)} title="Düzenle">
                                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteDns(rec.id)} title="Sil">
                                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : zoneSettings ? (
                  <div className="divide-y">
                    {/* SSL */}
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">SSL Modu</p>
                          <p className="text-xs text-muted-foreground">HTTPS şifreleme seviyesi</p>
                        </div>
                      </div>
                      <Select value={zoneSettings.ssl} onValueChange={(v) => updateSetting('ssl', v)}>
                        <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">Kapalı</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                          <SelectItem value="strict">Full (Strict)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Always HTTPS */}
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Her Zaman HTTPS</p>
                          <p className="text-xs text-muted-foreground">HTTP → HTTPS otomatik yönlendirme</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={zoneSettings.always_use_https === 'on'}
                        onCheckedChange={(v) => updateSetting('always_use_https', v ? 'on' : 'off')}
                      />
                    </div>

                    {/* Security Level */}
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Güvenlik Seviyesi</p>
                          <p className="text-xs text-muted-foreground">Şüpheli trafik filtreleme</p>
                        </div>
                      </div>
                      <Select value={zoneSettings.security_level} onValueChange={(v) => updateSetting('security_level', v)}>
                        <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="essentially_off">Neredeyse Kapalı</SelectItem>
                          <SelectItem value="low">Düşük</SelectItem>
                          <SelectItem value="medium">Orta</SelectItem>
                          <SelectItem value="high">Yüksek</SelectItem>
                          <SelectItem value="under_attack">Saldırı Altında</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Cache TTL */}
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Tarayıcı Cache</p>
                          <p className="text-xs text-muted-foreground">Tarayıcıda önbellek süresi</p>
                        </div>
                      </div>
                      <Select value={String(zoneSettings.browser_cache_ttl)} onValueChange={(v) => updateSetting('browser_cache_ttl', Number(v))}>
                        <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">CF Kararı</SelectItem>
                          <SelectItem value="1800">30 Dakika</SelectItem>
                          <SelectItem value="3600">1 Saat</SelectItem>
                          <SelectItem value="14400">4 Saat</SelectItem>
                          <SelectItem value="86400">1 Gün</SelectItem>
                          <SelectItem value="604800">1 Hafta</SelectItem>
                          <SelectItem value="2592000">1 Ay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dev Mode */}
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Settings className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Geliştirme Modu</p>
                          <p className="text-xs text-muted-foreground">Cache'i 3 saat devre dışı bırakır</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={zoneSettings.development_mode === 'on'}
                        onCheckedChange={(v) => updateSetting('development_mode', v ? 'on' : 'off')}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-muted-foreground">Ayarlar yüklenemedi</div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════ DNS Form Dialog ═══════════ */}
      <Dialog open={dnsDialogOpen} onOpenChange={setDnsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'DNS Kaydını Düzenle' : 'DNS Kaydı Ekle'}</DialogTitle>
            <DialogDescription>{selectedZone?.name}</DialogDescription>
          </DialogHeader>
          <Form {...dnsForm}>
            <form onSubmit={dnsForm.handleSubmit(onDnsSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={dnsForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Kayıt Türü</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dnsForm.control}
                  name="ttl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">TTL</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                        <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="1">Otomatik</SelectItem>
                          <SelectItem value="300">5 dk</SelectItem>
                          <SelectItem value="3600">1 saat</SelectItem>
                          <SelectItem value="86400">1 gün</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={dnsForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Ad (Name)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="@ veya subdomain (ör: www)" className="h-9 font-mono text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={dnsForm.control}
                name="content"
                render={({ field }) => {
                  const type = dnsForm.watch('type')
                  return (
                    <FormItem>
                      <FormLabel className="text-xs">Değer (Content)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={type === 'A' ? '192.168.1.1' : type === 'CNAME' ? 'example.com' : type === 'MX' ? 'mail.example.com' : 'Değer'}
                          className="h-9 font-mono text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              {dnsForm.watch('type') === 'MX' && (
                <FormField
                  control={dnsForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Öncelik (Priority)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} className="h-9 w-24" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {['A', 'AAAA', 'CNAME'].includes(dnsForm.watch('type')) && (
                <FormField
                  control={dnsForm.control}
                  name="proxied"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 pt-1 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="text-sm cursor-pointer flex items-center gap-1.5 font-normal">
                        <Cloud className="h-3.5 w-3.5 text-orange-500" />
                        Cloudflare Proxy
                      </FormLabel>
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDnsDialogOpen(false)}>İptal</Button>
                <Button type="submit" disabled={dnsForm.formState.isSubmitting}>
                  {dnsForm.formState.isSubmitting ? 'Kaydediliyor...' : editingRecord ? 'Güncelle' : 'Ekle'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
