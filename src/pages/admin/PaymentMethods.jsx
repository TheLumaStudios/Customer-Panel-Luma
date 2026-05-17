import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard, Save, Eye, EyeOff, Loader2, RefreshCw,
  CheckCircle2, AlertCircle, Zap, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Provider Tanımları ─────────────────────────────────────────────────────
const PROVIDER_CONFIGS = {
  iyzico: {
    label: 'iyzico',
    color: 'indigo',
    logo: null,
    description: 'iyzico ödeme altyapısı. API anahtarları Supabase Edge Function secrets üzerinden yönetilir.',
    docsUrl: 'https://dev.iyzipay.com',
    fields: [
      { key: 'iyzico_invoice_type',   label: 'Fatura Tipi',        type: 'text', placeholder: 'Mükerrer 20/B' },
      { key: 'iyzico_payment_method', label: 'Ödeme Yöntemi Adı',  type: 'text', placeholder: 'İyzico Kredi Kartı', hint: 'Faturada görünecek isim.' },
    ],
    booleanFields: [
      { key: 'iyzico_official_invoice', label: 'Resmi Fatura Oluştur' },
    ],
    fnName: null,
  },
  qnb: {
    label: 'QNB Sanal POS',
    color: 'amber',
    logo: null,
    description: 'QNB Sanal POS kimlik bilgileri. Bankadan temin edilir.',
    docsUrl: 'https://vpos.qnbfinansbank.com/Help/home',
    fields: [
      { key: 'qnb_mbr_id',        label: 'MbrId (Kurum Kodu)',         type: 'text',     placeholder: '5',              hint: 'Banka tarafından verilir. Genellikle 5.' },
      { key: 'qnb_merchant_id',   label: 'MerchantId (Üye İşyeri No)', type: 'text',     placeholder: '000000000000001' },
      { key: 'qnb_user_code',     label: 'UserCode (Kullanıcı Kodu)',   type: 'text',     placeholder: 'api_user' },
      { key: 'qnb_user_pass',     label: 'UserPass (Kullanıcı Şifresi)', type: 'password', placeholder: '••••••••' },
      { key: 'qnb_merchant_pass', label: 'MerchantPass (3D Secure Şifre)', type: 'password', placeholder: '••••••••', hint: '3D Secure işlemler için gerekli' },
      { key: 'qnb_installments',  label: 'İzin Verilen Taksitler',     type: 'text',     placeholder: '1,2,3,6,9,12',   hint: 'Virgülle ayırın. 1 = taksitsiz.' },
    ],
    booleanFields: [
      { key: 'qnb_test_mode', label: 'Test Modu (vpostest.qnb.com.tr)' },
    ],
    testAction: 'batch_close',
    fnName: 'qnb-payment',
  },
  tami: {
    label: 'Tami (Garanti BBVA)',
    color: 'green',
    logo: null,
    description: 'Garanti BBVA Tami Sanal POS. POS Yönetimi ekranından alınan JWK bilgileri ile çalışır.',
    docsUrl: 'https://dev.tami.com.tr/api-katalog',
    fields: [
      { key: 'tami_merchant_number', label: 'Merchant Number (Üye İşyeri No)', type: 'text', placeholder: '000000001' },
      { key: 'tami_terminal_number', label: 'Terminal Number',                  type: 'text', placeholder: '001' },
      { key: 'tami_api_key',         label: 'API Key — JWK "k" (base64url)',   type: 'password', placeholder: '••••••••', hint: 'POS Yönetimi > JWK dosyasından "k" alanı.' },
      { key: 'tami_key_id',          label: 'Key ID — JWK "kid"',              type: 'text', placeholder: 'key-id-001', hint: 'POS Yönetimi > JWK dosyasından "kid" alanı.' },
    ],
    booleanFields: [
      { key: 'tami_test_mode', label: 'Test Modu (sandbox-paymentapi.tami.com.tr)' },
    ],
    fnName: 'tami-payment',
  },
}

const ALL_SETTINGS_KEYS = Object.values(PROVIDER_CONFIGS).flatMap(p => [
  ...p.fields.map(f => f.key),
  ...(p.booleanFields || []).map(f => f.key),
])

const COLOR_MAP = {
  indigo: { dot: 'bg-indigo-500', ring: 'ring-indigo-500/40', icon: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  amber:  { dot: 'bg-amber-500',  ring: 'ring-amber-500/40',  icon: 'text-amber-400',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  green:  { dot: 'bg-green-500',  ring: 'ring-green-500/40',  icon: 'text-green-400',  badge: 'bg-green-500/10 text-green-400 border-green-500/30' },
}

// ─── Bileşen ────────────────────────────────────────────────────────────────
export default function PaymentMethods() {
  const [providers, setProviders] = useState([])
  const [settings, setSettings] = useState({})
  const [selected, setSelected] = useState(null)   // aktif seçili provider key
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // 'ok' | 'fail'
  const [showPass, setShowPass] = useState({})

  useEffect(() => {
    Promise.all([fetchProviders(), fetchSettings()]).finally(() => setLoading(false))
  }, [])

  const fetchProviders = async () => {
    const { data } = await supabase.from('pos_providers').select('*').order('sort_order')
    if (data) {
      setProviders(data)
      // İlk provider'ı seç
      if (data.length > 0 && !selected) setSelected(data[0].provider)
    }
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
      await Promise.all(keys.map(key =>
        supabase.from('system_settings').upsert(
          { setting_key: key, setting_value: typeof settings[key] === 'boolean' ? String(settings[key]) : (settings[key] || '') },
          { onConflict: 'setting_key' }
        )
      ))
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

  const testConnection = async () => {
    const cfg = PROVIDER_CONFIGS[selected]
    if (!cfg?.fnName) return
    setTesting(true)
    setTestResult(null)
    try {
      await handleSave(selected)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${cfg.fnName}`, {
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
        setTestResult('ok')
        toast.success('Bağlantı başarılı', { description: `Cevap kodu: ${code}` })
      } else {
        setTestResult('fail')
        toast.error('Bağlantı başarısız', { description: result.error || 'Kimlik bilgilerini kontrol edin' })
      }
    } catch (err) {
      setTestResult('fail')
      toast.error('Bağlantı hatası', { description: err.message })
    } finally {
      setTesting(false)
    }
  }

  const selectedCfg = selected ? PROVIDER_CONFIGS[selected] : null
  const selectedRow = selected ? providers.find(p => p.provider === selected) : null
  const colors = selectedCfg ? (COLOR_MAP[selectedCfg.color] ?? COLOR_MAP.green) : null
  const isTestMode = selected ? !!settings[`${selected}_test_mode`] : false

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Başlık */}
      <div>
        <h1 className="text-3xl font-bold">Ödeme Yöntemleri</h1>
        <p className="text-muted-foreground mt-1">Aktif POS sağlayıcılarını ve varsayılan ödeme yöntemini yönetin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-5">

        {/* ─── Sol: Provider Listesi ─────────────────────────────── */}
        <div className="space-y-2">
          {providers.map(p => {
            const cfg = PROVIDER_CONFIGS[p.provider]
            const clr = COLOR_MAP[cfg?.color] ?? COLOR_MAP.green
            const isSelected = selected === p.provider

            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.provider)}
                className={cn(
                  'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150',
                  isSelected
                    ? `border-${cfg?.color ?? 'green'}-500/50 bg-${cfg?.color ?? 'green'}-500/5 ring-1 ${clr.ring}`
                    : 'border-border bg-card hover:border-border/70 hover:bg-secondary/30'
                )}
              >
                {/* Status dot */}
                <div className={cn('h-2 w-2 rounded-full flex-shrink-0', p.is_active ? clr.dot : 'bg-slate-500')} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{cfg?.label ?? p.display_name}</span>
                  </div>
                  {p.is_default && (
                    <span className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-amber-400" />
                      Varsayılan
                    </span>
                  )}
                </div>

                {/* Toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleProvider(p.provider, !p.is_active) }}
                  className={cn(
                    'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none',
                    p.is_active ? 'bg-indigo-600' : 'bg-slate-600'
                  )}
                >
                  <span className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                    p.is_active ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  )} />
                </button>
              </button>
            )
          })}
        </div>

        {/* ─── Sağ: Seçili Provider Konfigürasyon ───────────────── */}
        {selectedCfg && selectedRow ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Kart Başlığı */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', `bg-${selectedCfg.color}-500/10`)}>
                  <CreditCard className={cn('h-4.5 w-4.5', colors.icon)} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{selectedCfg.label}</h2>
                    {isTestMode && (
                      <Badge className="text-[10px] font-bold tracking-wide px-1.5 py-0 bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        TEST MODU
                      </Badge>
                    )}
                    {selectedRow.is_active
                      ? <Badge className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-400 border border-green-500/30">Aktif</Badge>
                      : <Badge className="text-[10px] px-1.5 py-0 bg-slate-500/10 text-slate-400 border border-slate-500/30">Pasif</Badge>
                    }
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedCfg.description}
                    {isTestMode && (
                      <span className="text-amber-400/80 ml-1">Test endpoint: vpostest.qnb.com.tr</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Sağ üst aksiyonlar */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedRow.is_active && !selectedRow.is_default && (
                  <button
                    onClick={() => setDefault(selected)}
                    className="text-xs text-muted-foreground hover:text-amber-400 transition-colors flex items-center gap-1"
                  >
                    <Star className="h-3 w-3" />
                    Varsayılan Yap
                  </button>
                )}
                {selectedCfg.docsUrl && (
                  <a
                    href={selectedCfg.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dokümantasyon →
                  </a>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="p-5 space-y-5">
              {/* Metin Alanları */}
              {selectedCfg.fields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedCfg.fields.map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-sm text-foreground/80">{f.label}</Label>
                      <div className="relative">
                        <Input
                          type={f.type === 'password' ? (showPass[f.key] ? 'text' : 'password') : 'text'}
                          value={settings[f.key] ?? ''}
                          onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="bg-background pr-9"
                        />
                        {f.type === 'password' && (
                          <button
                            type="button"
                            onClick={() => setShowPass(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPass[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                      {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Boolean Alanları */}
              {selectedCfg.booleanFields?.length > 0 && (
                <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
                  {selectedCfg.booleanFields.map(f => (
                    <div key={f.key} className="flex items-center gap-2">
                      <Checkbox
                        id={f.key}
                        checked={!!settings[f.key]}
                        onCheckedChange={v => setSettings(prev => ({ ...prev, [f.key]: v }))}
                      />
                      <Label htmlFor={f.key} className="text-sm font-normal cursor-pointer">
                        {f.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer: Kaydet + Test */}
            <div className="px-5 py-4 border-t border-border bg-secondary/10 flex items-center justify-between gap-3">
              {/* Test sonucu göstergesi */}
              <div className="flex items-center gap-2">
                {testResult === 'ok' && (
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Bağlantı başarılı
                  </span>
                )}
                {testResult === 'fail' && (
                  <span className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Bağlantı başarısız
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedCfg.fnName && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testConnection}
                    disabled={testing || saving}
                    className="gap-2 h-8"
                  >
                    {testing
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Zap className="h-3.5 w-3.5" />
                    }
                    {testing ? 'Test ediliyor…' : 'Bağlantıyı Test Et'}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => handleSave(selected)}
                  disabled={saving || testing}
                  className="gap-2 h-8"
                >
                  {saving
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Save className="h-3.5 w-3.5" />
                  }
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card flex items-center justify-center h-48 text-sm text-muted-foreground">
            Ayarlamak için bir sağlayıcı seçin
          </div>
        )}
      </div>
    </div>
  )
}
