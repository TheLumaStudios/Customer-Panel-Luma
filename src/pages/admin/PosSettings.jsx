import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard, Save, Eye, EyeOff, Loader2, RefreshCw,
  ToggleLeft, CheckCircle2, AlertCircle, Plus, ChevronDown, ChevronUp
} from 'lucide-react'

// ─── Provider Tanımları ─────────────────────────────────────────────────────
// Yeni POS eklemek için buraya konfigürasyon ekle
const PROVIDER_CONFIGS = {
  qnb: {
    label: 'QNB Sanal POS',
    color: 'amber',
    description: 'QNB Finansbank sanal POS entegrasyonu (NonSecure & 3D Secure)',
    docsUrl: 'https://vpos.qnbfinansbank.com/Help/home',
    fields: [
      { key: 'qnb_mbr_id',        label: 'MbrId (Kurum Kodu)',         type: 'text',     placeholder: '5',             hint: 'Banka tarafından verilir, genellikle 5.' },
      { key: 'qnb_merchant_id',   label: 'MerchantId (Üye İşyeri No)', type: 'text',     placeholder: '000000000000001' },
      { key: 'qnb_user_code',     label: 'UserCode (Kullanıcı Kodu)',   type: 'text',     placeholder: 'api_user' },
      { key: 'qnb_user_pass',     label: 'UserPass (Kullanıcı Şifre)', type: 'password', placeholder: '••••••••' },
      { key: 'qnb_merchant_pass', label: 'MerchantPass (3D Şifre)',    type: 'password', placeholder: '••••••••',      hint: '3D Secure işlemler için.' },
      { key: 'qnb_installments',  label: 'İzin Verilen Taksitler',     type: 'text',     placeholder: '1,2,3,6,9,12',  hint: 'Virgülle ayırın. 1 = peşin.' },
    ],
    booleanFields: [
      { key: 'qnb_test_mode', label: 'Test Modu (vpostest.qnb.com.tr)' },
    ],
    testAction: 'batch_close',
    fnName: 'qnb-payment',
  },
  iyzico: {
    label: 'iyzico',
    color: 'indigo',
    description: 'iyzico ödeme altyapısı. API anahtarları Supabase Edge Function secrets üzerinden yönetilir.',
    docsUrl: 'https://dev.iyzipay.com',
    fields: [
      { key: 'iyzico_invoice_type',    label: 'Fatura Tipi',      type: 'text', placeholder: 'Mükerrer 20/B' },
      { key: 'iyzico_payment_method',  label: 'Ödeme Yöntemi Adı', type: 'text', placeholder: 'İyzico Kredi Kartı', hint: 'Faturada görünecek isim.' },
    ],
    booleanFields: [
      { key: 'iyzico_official_invoice', label: 'Resmi Fatura Oluştur' },
    ],
    fnName: null, // test yok
  },
}

// system_settings'ten okunacak tüm key'ler
const ALL_SETTINGS_KEYS = Object.values(PROVIDER_CONFIGS).flatMap(p => [
  ...p.fields.map(f => f.key),
  ...(p.booleanFields || []).map(f => f.key),
])

// ─── Bileşen ────────────────────────────────────────────────────────────────
export default function PosSettings() {
  const [providers, setProviders] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState({})   // hangi provider açık
  const [showPass, setShowPass] = useState({})    // şifre göster/gizle
  const [testing, setTesting] = useState({})      // test ediliyor mu

  useEffect(() => {
    Promise.all([fetchProviders(), fetchSettings()])
      .finally(() => setLoading(false))
  }, [])

  const fetchProviders = async () => {
    const { data } = await supabase.from('pos_providers').select('*').order('sort_order')
    if (data) setProviders(data)
  }

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value, setting_type')
      .in('setting_key', ALL_SETTINGS_KEYS)
    if (data) {
      const map = {}
      data.forEach(r => {
        map[r.setting_key] = r.setting_type === 'boolean' ? r.setting_value === 'true' : r.setting_value
      })
      setSettings(map)
    }
  }

  const handleSave = async (providerKey) => {
    setSaving(true)
    try {
      const cfg = PROVIDER_CONFIGS[providerKey]
      const keys = [...cfg.fields.map(f => f.key), ...(cfg.booleanFields || []).map(f => f.key)]
      const updates = keys.map(key =>
        supabase.from('system_settings')
          .upsert({ setting_key: key, setting_value: typeof settings[key] === 'boolean' ? String(settings[key]) : (settings[key] || '') }, { onConflict: 'setting_key' })
      )
      await Promise.all(updates)
      toast.success(`${cfg.label} ayarları kaydedildi`)
    } catch (err) {
      toast.error('Kaydetme hatası', { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  const toggleProvider = async (provider, isActive) => {
    await supabase.from('pos_providers').update({ is_active: isActive }).eq('provider', provider)
    setProviders(prev => prev.map(p => p.provider === provider ? { ...p, is_active: isActive } : p))
    toast.success(`${PROVIDER_CONFIGS[provider]?.label ?? provider} ${isActive ? 'aktif edildi' : 'devre dışı bırakıldı'}`)
  }

  const setDefault = async (provider) => {
    await supabase.from('pos_providers').update({ is_default: false }).neq('provider', provider)
    await supabase.from('pos_providers').update({ is_default: true }).eq('provider', provider)
    setProviders(prev => prev.map(p => ({ ...p, is_default: p.provider === provider })))
    toast.success(`${PROVIDER_CONFIGS[provider]?.label ?? provider} varsayılan yapıldı`)
  }

  const testConnection = async (providerKey) => {
    const cfg = PROVIDER_CONFIGS[providerKey]
    if (!cfg?.fnName) return
    setTesting(prev => ({ ...prev, [providerKey]: true }))
    try {
      await handleSave(providerKey)
      const { data: { session } } = await supabase.auth.getSession()
      const baseUrl = import.meta.env.VITE_SUPABASE_URL
      const res = await fetch(`${baseUrl}/functions/v1/${cfg.fnName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: cfg.testAction }),
      })
      const result = await res.json()
      const code = result.result?.ProcReturnCode
      if (code) {
        toast.success('Bağlantı başarılı', { description: `Cevap kodu: ${code}` })
      } else if (result.error) {
        toast.error('Bağlantı başarısız', { description: result.error })
      } else {
        toast.error('Kimlik bilgilerini kontrol edin')
      }
    } catch (err) {
      toast.error('Bağlantı hatası', { description: err.message })
    } finally {
      setTesting(prev => ({ ...prev, [providerKey]: false }))
    }
  }

  const toggleExpand = (p) => setExpanded(prev => ({ ...prev, [p]: !prev[p] }))
  const togglePass = (k) => setShowPass(prev => ({ ...prev, [k]: !prev[k] }))

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">POS Ayarları</h1>
        <p className="text-muted-foreground mt-1">Sanal POS sağlayıcılarını yönetin ve kimlik bilgilerini girin</p>
      </div>

      {/* ─── Sağlayıcı Listesi ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktif Sağlayıcılar</CardTitle>
          <CardDescription>Toggle ile aktif/pasif yapın, varsayılanı seçin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {providers.map(p => {
            const cfg = PROVIDER_CONFIGS[p.provider]
            const colorMap = { amber: 'bg-amber-500', indigo: 'bg-indigo-500', green: 'bg-green-500' }
            const dotColor = p.is_active ? (colorMap[cfg?.color] ?? 'bg-green-500') : 'bg-slate-500'
            return (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                  <div>
                    <p className="font-medium text-sm">{cfg?.label ?? p.display_name}</p>
                    {p.is_default && <span className="text-xs text-indigo-400">Varsayılan</span>}
                  </div>
                  {p.is_active && !p.is_default && (
                    <button onClick={() => setDefault(p.provider)} className="text-xs text-slate-500 hover:text-slate-300 ml-2">
                      Varsayılan Yap
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleProvider(p.provider, !p.is_active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.is_active ? 'bg-indigo-600' : 'bg-slate-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${p.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ─── Provider Detay Kartları ────────────────────────────── */}
      {Object.entries(PROVIDER_CONFIGS).map(([key, cfg]) => {
        const providerRow = providers.find(p => p.provider === key)
        const isExpanded = expanded[key] ?? false

        return (
          <Card key={key} className={providerRow?.is_active ? '' : 'opacity-60'}>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => toggleExpand(key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className={`h-5 w-5 text-${cfg.color}-400`} />
                  <div>
                    <CardTitle className="text-base">{cfg.label}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{cfg.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {providerRow?.is_active
                    ? <Badge variant="outline" className="text-green-400 border-green-700 text-xs">Aktif</Badge>
                    : <Badge variant="outline" className="text-slate-500 text-xs">Pasif</Badge>
                  }
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-5 border-t border-border pt-5">
                {/* Metin alanları */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cfg.fields.map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-sm">{f.label}</Label>
                      <div className="relative">
                        <Input
                          type={f.type === 'password' ? (showPass[f.key] ? 'text' : 'password') : 'text'}
                          value={settings[f.key] ?? ''}
                          onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="bg-white border-gray-300 pr-9"
                        />
                        {f.type === 'password' && (
                          <button
                            type="button"
                            onClick={() => togglePass(f.key)}
                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                          >
                            {showPass[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                      {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                    </div>
                  ))}
                </div>

                {/* Boolean alanları */}
                {cfg.booleanFields?.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {cfg.booleanFields.map(f => (
                      <div key={f.key} className="flex items-center gap-2">
                        <Checkbox
                          id={f.key}
                          checked={!!settings[f.key]}
                          onCheckedChange={v => setSettings(prev => ({ ...prev, [f.key]: v }))}
                        />
                        <Label htmlFor={f.key} className="text-sm font-normal cursor-pointer">{f.label}</Label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Butonlar */}
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" onClick={() => handleSave(key)} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Kaydet
                  </Button>
                  {cfg.fnName && (
                    <Button variant="outline" size="sm" onClick={() => testConnection(key)} disabled={testing[key]} className="gap-2">
                      {testing[key] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Bağlantıyı Test Et
                    </Button>
                  )}
                  {cfg.docsUrl && (
                    <a href={cfg.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground ml-auto">
                      Dokümantasyon →
                    </a>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
