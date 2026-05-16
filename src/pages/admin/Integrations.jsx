import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2, Play, Loader2, Plug, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

const PROVIDER_LABELS = {
  plesk: 'Plesk',
  directadmin: 'DirectAdmin',
  cpanel_dnsonly: 'cPanel DNSONLY',
  generic_http: 'Generic HTTP',
}

const AUTH_LABELS = {
  bearer: 'Bearer Token',
  basic: 'Basic Auth',
  api_key: 'API Key',
  none: 'Yok',
}

const emptyForm = {
  name: '',
  provider: 'generic_http',
  endpoint_url: '',
  auth_type: 'bearer',
  auth_header: '',
  provision_path: '',
  suspend_path: '',
  terminate_path: '',
  status_path: '',
  notes: '',
  is_active: true,
  // Kimlik bilgileri ayrı alanda
  cred_token: '',
  cred_username: '',
  cred_password: '',
  cred_api_key: '',
  field_map_raw: '{}',
}

export default function Integrations() {
  const [integrations, setIntegrations] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [testRunningId, setTestRunningId] = useState(null)

  const load = async () => {
    setLoading(true)
    const [{ data: intData }, { data: logData }] = await Promise.all([
      supabase.from('provisioning_integrations').select('*').order('created_at', { ascending: false }),
      supabase.from('provisioning_logs').select('*, provisioning_integrations(name)').order('executed_at', { ascending: false }).limit(20),
    ])
    setIntegrations(intData || [])
    setLogs(logData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (integration) => {
    setEditingId(integration.id)
    setForm({
      name: integration.name || '',
      provider: integration.provider || 'generic_http',
      endpoint_url: integration.endpoint_url || '',
      auth_type: integration.auth_type || 'bearer',
      auth_header: integration.auth_header || '',
      provision_path: integration.provision_path || '',
      suspend_path: integration.suspend_path || '',
      terminate_path: integration.terminate_path || '',
      status_path: integration.status_path || '',
      notes: integration.notes || '',
      is_active: integration.is_active ?? true,
      cred_token: '',
      cred_username: '',
      cred_password: '',
      cred_api_key: '',
      field_map_raw: JSON.stringify(integration.field_map || {}, null, 2),
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.endpoint_url) {
      toast.error('Ad ve Endpoint URL zorunludur')
      return
    }

    let fieldMap = {}
    try { fieldMap = JSON.parse(form.field_map_raw) } catch {
      toast.error('Field Map geçerli JSON olmalı')
      return
    }

    setSaving(true)
    try {
      // Kimlik bilgilerini JSON olarak hazırla (şifreleme olmadan — prod'da encrypt_text kullanılmalı)
      let credentials = {}
      if (form.auth_type === 'bearer' && form.cred_token) credentials = { token: form.cred_token }
      else if (form.auth_type === 'basic') credentials = { username: form.cred_username, password: form.cred_password }
      else if (form.auth_type === 'api_key' && form.cred_api_key) credentials = { api_key: form.cred_api_key }

      const payload = {
        name: form.name,
        provider: form.provider,
        endpoint_url: form.endpoint_url,
        auth_type: form.auth_type,
        auth_header: form.auth_header || null,
        provision_path: form.provision_path || null,
        suspend_path: form.suspend_path || null,
        terminate_path: form.terminate_path || null,
        status_path: form.status_path || null,
        notes: form.notes || null,
        is_active: form.is_active,
        field_map: fieldMap,
        // Kimlik bilgilerini düz JSON olarak sakla (prod: şifrele)
        credentials_encrypted: Object.keys(credentials).length > 0 ? JSON.stringify(credentials) : null,
      }

      if (editingId) {
        const { error } = await supabase.from('provisioning_integrations').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Entegrasyon güncellendi')
      } else {
        const { error } = await supabase.from('provisioning_integrations').insert(payload)
        if (error) throw error
        toast.success('Entegrasyon eklendi')
      }

      setFormOpen(false)
      await load()
    } catch (err) {
      toast.error('Kaydedilemedi', { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu entegrasyonu silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('provisioning_integrations').delete().eq('id', id)
    if (error) {
      toast.error('Silinemedi', { description: error.message })
    } else {
      toast.success('Entegrasyon silindi')
      await load()
    }
  }

  const handleToggle = async (integration) => {
    const { error } = await supabase
      .from('provisioning_integrations')
      .update({ is_active: !integration.is_active })
      .eq('id', integration.id)
    if (error) {
      toast.error('Güncellenemedi', { description: error.message })
    } else {
      await load()
    }
  }

  const handleStatusCheck = async (integration) => {
    if (!integration.status_path) {
      toast.error('Status path tanımlanmamış')
      return
    }
    setTestRunningId(integration.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const functionsUrl = baseUrl.includes('/rest/v1')
        ? baseUrl.replace('/rest/v1', '/functions/v1')
        : `${baseUrl}/functions/v1`

      const res = await fetch(`${functionsUrl}/generic-provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({ integration_id: integration.id, action: 'status_check' }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('Bağlantı başarılı', { description: `HTTP ${result.response?.status || 200}` })
      } else {
        toast.error('Bağlantı başarısız', { description: result.error })
      }
      await load()
    } catch (err) {
      toast.error('Test başarısız', { description: err.message })
    } finally {
      setTestRunningId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Provizyon Entegrasyonları</h1>
          <p className="text-muted-foreground mt-1">
            SaaS, lisans ve servis sağlayıcıları için HTTP entegrasyonları
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Entegrasyon Ekle
          </Button>
        </div>
      </div>

      {/* Entegrasyon Listesi */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Entegrasyonlar
          </CardTitle>
          <CardDescription>Toplam {integrations.length} entegrasyon</CardDescription>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Plug className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Henüz entegrasyon eklenmemiş.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Sağlayıcı</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Auth</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map(integration => (
                  <TableRow key={integration.id}>
                    <TableCell className="font-medium">{integration.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{PROVIDER_LABELS[integration.provider] || integration.provider}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[200px] block">
                        {integration.endpoint_url}
                      </code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {AUTH_LABELS[integration.auth_type] || integration.auth_type}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggle(integration)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${integration.is_active ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${integration.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(integration.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleStatusCheck(integration)}
                          disabled={testRunningId === integration.id}
                          title="Bağlantıyı Test Et"
                        >
                          {testRunningId === integration.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Play className="h-4 w-4 text-green-600" />
                          }
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(integration)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(integration.id)}>
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

      {/* Son Log'lar */}
      {logs.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Son İşlemler</CardTitle>
            <CardDescription>Son 20 sağlama işlemi</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entegrasyon</TableHead>
                  <TableHead>İşlem</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead>Harici ID</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{log.provisioning_integrations?.name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.status === 'success'
                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                        : log.status === 'failed'
                          ? <XCircle className="h-4 w-4 text-red-500" />
                          : <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      }
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.response_status || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{log.external_id || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(log.executed_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Entegrasyonu Düzenle' : 'Yeni Entegrasyon'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ad *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Plesk Lisans Sunucusu" />
              </div>
              <div className="space-y-2">
                <Label>Sağlayıcı</Label>
                <Select value={form.provider} onValueChange={v => setForm(f => ({ ...f, provider: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDER_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endpoint URL *</Label>
              <Input value={form.endpoint_url} onChange={e => setForm(f => ({ ...f, endpoint_url: e.target.value }))} placeholder="https://license.example.com/api/v1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Auth Tipi</Label>
                <Select value={form.auth_type} onValueChange={v => setForm(f => ({ ...f, auth_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(AUTH_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.auth_type === 'api_key' && (
                <div className="space-y-2">
                  <Label>Auth Header Adı</Label>
                  <Input value={form.auth_header} onChange={e => setForm(f => ({ ...f, auth_header: e.target.value }))} placeholder="X-API-Key" />
                </div>
              )}
            </div>

            {/* Kimlik Bilgileri */}
            {form.auth_type === 'bearer' && (
              <div className="space-y-2">
                <Label>Bearer Token</Label>
                <Input type="password" value={form.cred_token} onChange={e => setForm(f => ({ ...f, cred_token: e.target.value }))} placeholder="Boş bırakılırsa mevcut korunur" />
              </div>
            )}
            {form.auth_type === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kullanıcı Adı</Label>
                  <Input value={form.cred_username} onChange={e => setForm(f => ({ ...f, cred_username: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Şifre</Label>
                  <Input type="password" value={form.cred_password} onChange={e => setForm(f => ({ ...f, cred_password: e.target.value }))} />
                </div>
              </div>
            )}
            {form.auth_type === 'api_key' && (
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" value={form.cred_api_key} onChange={e => setForm(f => ({ ...f, cred_api_key: e.target.value }))} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sağlama Path</Label>
                <Input value={form.provision_path} onChange={e => setForm(f => ({ ...f, provision_path: e.target.value }))} placeholder="/licenses" />
              </div>
              <div className="space-y-2">
                <Label>Askıya Alma Path</Label>
                <Input value={form.suspend_path} onChange={e => setForm(f => ({ ...f, suspend_path: e.target.value }))} placeholder="/licenses/{external_id}/suspend" />
              </div>
              <div className="space-y-2">
                <Label>Sonlandırma Path</Label>
                <Input value={form.terminate_path} onChange={e => setForm(f => ({ ...f, terminate_path: e.target.value }))} placeholder="/licenses/{external_id}" />
              </div>
              <div className="space-y-2">
                <Label>Durum Kontrolü Path</Label>
                <Input value={form.status_path} onChange={e => setForm(f => ({ ...f, status_path: e.target.value }))} placeholder="/health" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Field Map (JSON)</Label>
              <Textarea
                value={form.field_map_raw}
                onChange={e => setForm(f => ({ ...f, field_map_raw: e.target.value }))}
                rows={4}
                className="font-mono text-xs"
                placeholder={'{\n  "hostname": "ip",\n  "plan": "package_name"\n}'}
              />
              <p className="text-xs text-muted-foreground">Yerel alan → API parametresi eşlemesi</p>
            </div>

            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border border-input accent-primary"
              />
              <Label htmlFor="is_active">Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingId ? 'Kaydet' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
