import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth.jsx'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Key, Plus, Trash2, Copy, Eye, EyeOff, RefreshCw, Webhook,
  CheckCircle, XCircle, Loader2, AlertTriangle
} from 'lucide-react'
import { toast } from '@/lib/toast'

// Available webhook events
const WEBHOOK_EVENTS = [
  { value: 'invoice.created', label: 'Fatura Oluşturuldu' },
  { value: 'invoice.paid', label: 'Fatura Ödendi' },
  { value: 'invoice.overdue', label: 'Fatura Gecikti' },
  { value: 'hosting.created', label: 'Hosting Oluşturuldu' },
  { value: 'hosting.suspended', label: 'Hosting Askıya Alındı' },
  { value: 'hosting.activated', label: 'Hosting Aktifleştirildi' },
  { value: 'domain.registered', label: 'Domain Kayıt Edildi' },
  { value: 'domain.expiring', label: 'Domain Süresi Doluyor' },
  { value: 'ticket.created', label: 'Destek Talebi Oluşturuldu' },
  { value: 'ticket.replied', label: 'Destek Talebi Yanıtlandı' },
]

// SHA-256 hash function
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate random key
function generateApiKey() {
  return 'lm_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
}

// Generate random secret for webhooks
function generateSecret() {
  return 'whsec_' + crypto.randomUUID().replace(/-/g, '')
}

export default function ApiKeys() {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState([])
  const [webhooks, setWebhooks] = useState([])
  const [webhookLogs, setWebhookLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyRevealed, setNewKeyRevealed] = useState(null) // store newly created key temporarily

  // New API key form
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    permissions: ['read'],
  })

  // New webhook form
  const [showNewWebhookForm, setShowNewWebhookForm] = useState(false)
  const [newWebhookForm, setNewWebhookForm] = useState({
    url: '',
    events: [],
  })

  // Fetch data
  useEffect(() => {
    if (user?.id) {
      fetchApiKeys()
      fetchWebhooks()
    }
  }, [user?.id])

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApiKeys(data || [])
    } catch (err) {
      console.error('Error fetching API keys:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWebhooks(data || [])

      // Fetch logs for these webhooks
      if (data && data.length > 0) {
        const webhookIds = data.map(w => w.id)
        const { data: logs } = await supabase
          .from('webhook_logs')
          .select('*')
          .in('webhook_id', webhookIds)
          .order('created_at', { ascending: false })
          .limit(20)

        setWebhookLogs(logs || [])
      }
    } catch (err) {
      console.error('Error fetching webhooks:', err)
    }
  }

  // Create new API key
  const handleCreateApiKey = async () => {
    if (!newKeyForm.name.trim()) {
      toast.error('Anahtar adı gereklidir')
      return
    }

    setCreating(true)
    try {
      const fullKey = generateApiKey()
      const keyPrefix = fullKey.substring(0, 11) // "lm_" + 8 chars
      const keyHash = await sha256(fullKey)

      const { error } = await supabase.from('api_keys').insert({
        customer_id: user.id,
        name: newKeyForm.name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        permissions: newKeyForm.permissions,
      })

      if (error) throw error

      // Show the key once
      setNewKeyRevealed(fullKey)
      setShowNewKeyForm(false)
      setNewKeyForm({ name: '', permissions: ['read'] })
      fetchApiKeys()
      toast.success('API anahtarı oluşturuldu', {
        description: 'Bu anahtarı kopyalayın, bir daha gösterilmeyecek!'
      })
    } catch (err) {
      toast.error('API anahtarı oluşturulamadı', { description: err.message })
    } finally {
      setCreating(false)
    }
  }

  // Delete API key
  const handleDeleteApiKey = async (id) => {
    if (!confirm('Bu API anahtarını silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id)
      if (error) throw error
      fetchApiKeys()
      toast.success('API anahtarı silindi')
    } catch (err) {
      toast.error('Silinemedi', { description: err.message })
    }
  }

  // Toggle API key active status
  const handleToggleApiKey = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchApiKeys()
      toast.success(!currentStatus ? 'Anahtar aktifleştirildi' : 'Anahtar devre dışı bırakıldı')
    } catch (err) {
      toast.error('Güncellenemedi', { description: err.message })
    }
  }

  // Create new webhook
  const handleCreateWebhook = async () => {
    if (!newWebhookForm.url.trim()) {
      toast.error('Webhook URL gereklidir')
      return
    }
    if (newWebhookForm.events.length === 0) {
      toast.error('En az bir olay seçmelisiniz')
      return
    }

    setCreating(true)
    try {
      const secret = generateSecret()

      const { error } = await supabase.from('webhooks').insert({
        customer_id: user.id,
        url: newWebhookForm.url,
        events: newWebhookForm.events,
        secret: secret,
      })

      if (error) throw error

      setShowNewWebhookForm(false)
      setNewWebhookForm({ url: '', events: [] })
      fetchWebhooks()
      toast.success('Webhook oluşturuldu')
    } catch (err) {
      toast.error('Webhook oluşturulamadı', { description: err.message })
    } finally {
      setCreating(false)
    }
  }

  // Delete webhook
  const handleDeleteWebhook = async (id) => {
    if (!confirm('Bu webhook\'u silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase.from('webhooks').delete().eq('id', id)
      if (error) throw error
      fetchWebhooks()
      toast.success('Webhook silindi')
    } catch (err) {
      toast.error('Silinemedi', { description: err.message })
    }
  }

  // Toggle webhook active status
  const handleToggleWebhook = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchWebhooks()
      toast.success(!currentStatus ? 'Webhook aktifleştirildi' : 'Webhook devre dışı bırakıldı')
    } catch (err) {
      toast.error('Güncellenemedi', { description: err.message })
    }
  }

  // Toggle webhook event
  const toggleEvent = (event) => {
    setNewWebhookForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }))
  }

  // Toggle permission
  const togglePermission = (perm) => {
    setNewKeyForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Panoya kopyalandı')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('tr-TR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Anahtarları & Webhooks</h1>
        <p className="text-muted-foreground mt-1">
          API anahtarlarınızı ve webhook entegrasyonlarınızı yönetin
        </p>
      </div>

      {/* Newly created key banner */}
      {newKeyRevealed && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Yeni API Anahtarınız (Bu anahtarı kaydedin, bir daha gösterilmeyecek!)
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-black/20 px-3 py-2 rounded text-sm font-mono break-all border">
                    {newKeyRevealed}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(newKeyRevealed)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewKeyRevealed(null)}
                  className="text-yellow-700"
                >
                  Anladım, kopyaladım
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Anahtarları
            </CardTitle>
            <CardDescription>API ile entegrasyon için anahtarlarınızı yönetin</CardDescription>
          </div>
          <Button onClick={() => setShowNewKeyForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni API Anahtarı Oluştur
          </Button>
        </CardHeader>
        <CardContent>
          {/* New Key Form */}
          {showNewKeyForm && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30 space-y-4">
              <h3 className="font-semibold">Yeni API Anahtarı</h3>
              <div className="space-y-2">
                <Label htmlFor="keyName">Anahtar Adı</Label>
                <Input
                  id="keyName"
                  placeholder="Örn: Production API, Test Key"
                  value={newKeyForm.name}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>İzinler</Label>
                <div className="flex gap-3">
                  {['read', 'write', 'admin'].map(perm => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newKeyForm.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm capitalize">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateApiKey} disabled={creating} size="sm">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Oluştur
                </Button>
                <Button variant="ghost" onClick={() => setShowNewKeyForm(false)} size="sm">
                  İptal
                </Button>
              </div>
            </div>
          )}

          {/* API Keys Table */}
          {apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henüz API anahtarı bulunmuyor
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Ad</th>
                    <th className="text-left py-3 px-2 font-medium">Anahtar Prefix</th>
                    <th className="text-left py-3 px-2 font-medium">İzinler</th>
                    <th className="text-left py-3 px-2 font-medium">Durum</th>
                    <th className="text-left py-3 px-2 font-medium">Son Kullanım</th>
                    <th className="text-left py-3 px-2 font-medium">Oluşturulma</th>
                    <th className="text-right py-3 px-2 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map(key => (
                    <tr key={key.id} className="border-b last:border-0">
                      <td className="py-3 px-2 font-medium">{key.name}</td>
                      <td className="py-3 px-2">
                        <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                          {key.key_prefix}...
                        </code>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          {key.permissions?.map(p => (
                            <span key={p} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {key.is_active ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3.5 w-3.5" /> Aktif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-3.5 w-3.5" /> Devre Dışı
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-xs">
                        {formatDate(key.last_used_at)}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-xs">
                        {formatDate(key.created_at)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleApiKey(key.id, key.is_active)}
                            title={key.is_active ? 'Devre dışı bırak' : 'Aktifleştir'}
                          >
                            {key.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteApiKey(key.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Webhooks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription>Olaylara otomatik bildirim almak için webhook ucu ekleyin</CardDescription>
          </div>
          <Button onClick={() => setShowNewWebhookForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Webhook Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {/* New Webhook Form */}
          {showNewWebhookForm && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30 space-y-4">
              <h3 className="font-semibold">Yeni Webhook</h3>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://example.com/webhook"
                  value={newWebhookForm.url}
                  onChange={(e) => setNewWebhookForm(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Olaylar</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {WEBHOOK_EVENTS.map(event => (
                    <label key={event.value} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={newWebhookForm.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="rounded border-gray-300"
                      />
                      {event.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateWebhook} disabled={creating} size="sm">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Oluştur
                </Button>
                <Button variant="ghost" onClick={() => setShowNewWebhookForm(false)} size="sm">
                  İptal
                </Button>
              </div>
            </div>
          )}

          {/* Webhooks List */}
          {webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henüz webhook bulunmuyor
            </p>
          ) : (
            <div className="space-y-4">
              {webhooks.map(webhook => (
                <div key={webhook.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {webhook.is_active ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-3.5 w-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <XCircle className="h-3.5 w-3.5" /> Devre Dışı
                        </span>
                      )}
                      <code className="text-sm bg-muted px-2 py-0.5 rounded break-all">
                        {webhook.url}
                      </code>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleWebhook(webhook.id, webhook.is_active)}
                      >
                        {webhook.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {webhook.events?.map(event => (
                      <span key={event} className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded">
                        {event}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Secret:</span>
                    <code className="bg-muted px-2 py-0.5 rounded">{webhook.secret?.substring(0, 12)}...</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => copyToClipboard(webhook.secret)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <span className="ml-auto">Oluşturulma: {formatDate(webhook.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Logs */}
      {webhookLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Son Webhook Logları</CardTitle>
            <CardDescription>Son 20 webhook teslim denemesi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Olay</th>
                    <th className="text-left py-2 px-2 font-medium">Durum</th>
                    <th className="text-left py-2 px-2 font-medium">Deneme</th>
                    <th className="text-left py-2 px-2 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookLogs.map(log => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-2 px-2">
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded">
                          {log.event}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        {log.response_status >= 200 && log.response_status < 300 ? (
                          <span className="text-green-600 text-xs">{log.response_status} OK</span>
                        ) : (
                          <span className="text-red-600 text-xs">{log.response_status || 'Hata'}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-xs">{log.attempts}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
