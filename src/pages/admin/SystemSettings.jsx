import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { Settings, Save, CreditCard, Building2, Timer, Percent, Mail, TrendingUp, RefreshCw, Cloud, Bot } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SystemSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [applyingMargin, setApplyingMargin] = useState(false)

  const [settings, setSettings] = useState({
    iyzico_invoice_type: '',
    iyzico_payment_method: '',
    iyzico_official_invoice: true,
    is_bankasi_iban: '',
    ziraat_bankasi_iban: '',
    default_bank_iban: '',
    auto_invoice_enabled: false,
    invoice_days_before_renewal: '7',
    auto_suspend_enabled: false,
    auto_suspend_days_overdue: '3',
    auto_terminate_days_suspended: '14',
    late_fee_enabled: false,
    late_fee_type: 'percentage',
    late_fee_amount: '0',
    late_fee_grace_days: '3',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: '',
    profit_margin_percent: '30',
    software_customer_free_hosting_enabled: true,
    software_customer_free_hosting_months: '12',
    cf_api_token: '',
    cf_account_id: '',
    cf_vanity_ns_enabled: false,
    cf_vanity_ns1: 'ns1.lumayazilim.com',
    cf_vanity_ns2: 'ns2.lumayazilim.com',
    openai_api_key: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', [
          'iyzico_invoice_type',
          'iyzico_payment_method',
          'iyzico_official_invoice',
          'is_bankasi_iban',
          'ziraat_bankasi_iban',
          'default_bank_iban',
          'auto_invoice_enabled',
          'invoice_days_before_renewal',
          'auto_suspend_enabled',
          'auto_suspend_days_overdue',
          'auto_terminate_days_suspended',
          'late_fee_enabled',
          'late_fee_type',
          'late_fee_amount',
          'late_fee_grace_days',
          'smtp_host',
          'smtp_port',
          'smtp_user',
          'smtp_password',
          'smtp_from_email',
          'smtp_from_name',
          'profit_margin_percent',
          'software_customer_free_hosting_enabled',
          'software_customer_free_hosting_months',
          'cf_api_token',
          'cf_account_id',
          'cf_vanity_ns_enabled',
          'cf_vanity_ns1',
          'cf_vanity_ns2',
          'openai_api_key',
        ])

      if (error) throw error

      const settingsMap = data.reduce((acc, setting) => {
        if (setting.setting_type === 'boolean') {
          acc[setting.setting_key] = setting.setting_value === 'true'
        } else {
          acc[setting.setting_key] = setting.setting_value
        }
        return acc
      }, {})

      setSettings(settingsMap)
    } catch (error) {
      toast.error('Ayarlar yüklenemedi', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Her ayarı ayrı ayrı güncelle
      const updates = Object.entries(settings).map(([key, value]) =>
        supabase
          .from('system_settings')
          .update({
            setting_value: typeof value === 'boolean' ? value.toString() : value
          })
          .eq('setting_key', key)
      )

      await Promise.all(updates)

      toast.success('Sistem ayarları güncellendi', {
        description: 'Değişiklikler başarıyla kaydedildi',
      })
    } catch (error) {
      toast.error('Kaydetme hatası', {
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Settings className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistem Ayarları</h1>
          <p className="text-muted-foreground mt-1">
            Ödeme ve fatura ayarlarını yönetin
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* iyzico Ödeme Ayarları */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>iyzico Ödeme Ayarları</CardTitle>
            </div>
            <CardDescription>
              iyzico ile yapılan ödemeler için otomatik fatura ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="iyzico_invoice_type">Fatura Tipi</Label>
              <Input
                id="iyzico_invoice_type"
                value={settings.iyzico_invoice_type}
                onChange={(e) => setSettings({ ...settings, iyzico_invoice_type: e.target.value })}
                placeholder="Mükerrer 20/B"
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-muted-foreground">
                iyzico ödemeleri için varsayılan fatura tipi
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="iyzico_payment_method">Ödeme Yöntemi</Label>
              <Input
                id="iyzico_payment_method"
                value={settings.iyzico_payment_method}
                onChange={(e) => setSettings({ ...settings, iyzico_payment_method: e.target.value })}
                placeholder="İyzico Kredi Kartı"
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-muted-foreground">
                Faturada görünecek ödeme yöntemi adı
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="iyzico_official_invoice"
                checked={settings.iyzico_official_invoice}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, iyzico_official_invoice: checked })
                }
              />
              <Label
                htmlFor="iyzico_official_invoice"
                className="text-sm font-normal cursor-pointer"
              >
                Resmi Fatura Oluştur
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              İşaretlenirse faturalar "Resmi Fatura" olarak oluşturulur
            </p>
          </CardContent>
        </Card>

        {/* Banka Hesapları */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Banka Hesapları</CardTitle>
            </div>
            <CardDescription>
              Havale/EFT ödemeleri için banka IBAN numaraları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="is_bankasi_iban">İş Bankası IBAN</Label>
              <Input
                id="is_bankasi_iban"
                value={settings.is_bankasi_iban}
                onChange={(e) => setSettings({ ...settings, is_bankasi_iban: e.target.value })}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ziraat_bankasi_iban">Ziraat Bankası IBAN</Label>
              <Input
                id="ziraat_bankasi_iban"
                value={settings.ziraat_bankasi_iban}
                onChange={(e) => setSettings({ ...settings, ziraat_bankasi_iban: e.target.value })}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_bank_iban">Varsayılan IBAN</Label>
              <Input
                id="default_bank_iban"
                value={settings.default_bank_iban}
                onChange={(e) => setSettings({ ...settings, default_bank_iban: e.target.value })}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-muted-foreground">
                Faturalarda görüntülenecek varsayılan IBAN numarası
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Kâr Marjı Ayarları */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>Kâr Marjı Ayarları</CardTitle>
            </div>
            <CardDescription>
              Ürün paketlerine uygulanacak kâr marjı oranını belirleyin. Maliyet fiyatı üzerine bu oran eklenerek satış fiyatı hesaplanır.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profit_margin_percent">Kâr Marjı (%)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="profit_margin_percent"
                  type="number"
                  min="0"
                  max="500"
                  value={settings.profit_margin_percent}
                  onChange={(e) => setSettings({ ...settings, profit_margin_percent: e.target.value })}
                  placeholder="30"
                  className="bg-white border-gray-300 w-32"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Örnek: Maliyet 100₺, Kâr marjı %{settings.profit_margin_percent || 30} → Satış fiyatı: {(Math.floor(100 * (1 + (parseFloat(settings.profit_margin_percent) || 30) / 100)) + 0.99).toFixed(2)}₺ (psikolojik fiyatlandırma)
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Aşağıdaki buton, tüm ürün paketlerinin satış fiyatını maliyet × (1 + %{settings.profit_margin_percent || 30} / 100) formülüyle yeniden hesaplar.
              </p>
              <Button
                variant="outline"
                disabled={applyingMargin}
                className="gap-2"
                onClick={async () => {
                  const margin = parseFloat(settings.profit_margin_percent) || 30
                  if (!confirm(`Tüm ürün paketlerinin satış fiyatı %${margin} kâr marjıyla yeniden hesaplanacak. Devam etmek istiyor musunuz?`)) return
                  setApplyingMargin(true)
                  try {
                    // Tüm paketleri çek
                    const { data: packages, error: fetchErr } = await supabase
                      .from('product_packages')
                      .select('id, cost_monthly, price_original')
                    if (fetchErr) throw fetchErr

                    const multiplier = 1 + margin / 100
                    // Psikolojik fiyat: .99 ile biten fiyatlar
                    const psychPrice = (raw) => Math.floor(raw) + 0.99
                    let updated = 0
                    for (const pkg of packages || []) {
                      if (pkg.cost_monthly > 0) {
                        const updateData = {
                          price_monthly: psychPrice(pkg.cost_monthly * multiplier),
                        }
                        await supabase
                          .from('product_packages')
                          .update(updateData)
                          .eq('id', pkg.id)
                        updated++
                      }
                    }
                    toast.success(`${updated} ürün paketi güncellendi`, {
                      description: `Kâr marjı: %${margin}`,
                    })
                  } catch (err) {
                    toast.error('Güncelleme hatası', { description: err.message })
                  } finally {
                    setApplyingMargin(false)
                  }
                }}
              >
                <RefreshCw className={`h-4 w-4 ${applyingMargin ? 'animate-spin' : ''}`} />
                {applyingMargin ? 'Uygulanıyor...' : 'Tüm Fiyatları Güncelle'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Yazılım Müşterisi Ayarları */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Yazılım Müşterisi Ayarları</CardTitle>
            </div>
            <CardDescription>
              Yazılım müşterilerine sağlanan ücretsiz hosting süresi ve koşullarını belirleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="software_customer_free_hosting_enabled"
                checked={settings.software_customer_free_hosting_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, software_customer_free_hosting_enabled: checked })
                }
              />
              <Label htmlFor="software_customer_free_hosting_enabled" className="text-sm font-normal cursor-pointer">
                Yazılım Müşterilerine Ücretsiz Hosting Ver
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="software_customer_free_hosting_months">Ücretsiz Hosting Süresi (Ay)</Label>
              <Input
                id="software_customer_free_hosting_months"
                type="number"
                min="1"
                max="60"
                value={settings.software_customer_free_hosting_months}
                onChange={(e) => setSettings({ ...settings, software_customer_free_hosting_months: e.target.value })}
                placeholder="12"
                className="bg-white border-gray-300 w-32"
              />
              <p className="text-xs text-muted-foreground">
                Yazılım müşterisi olarak kaydedilen müşterilere bu süre boyunca hosting faturası kesilmez.
                Süre bitiminde normal faturalandırma başlar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Otomasyon Ayarlari */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              <CardTitle>Otomasyon Ayarları</CardTitle>
            </div>
            <CardDescription>
              Otomatik fatura, askıya alma ve sonlandırma ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto_invoice_enabled"
                checked={settings.auto_invoice_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, auto_invoice_enabled: checked })
                }
              />
              <Label htmlFor="auto_invoice_enabled" className="text-sm font-normal cursor-pointer">
                Otomatik Fatura Oluştur
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_days_before_renewal">Yenileme Öncesi Gün Sayısı</Label>
              <Input
                id="invoice_days_before_renewal"
                type="number"
                value={settings.invoice_days_before_renewal}
                onChange={(e) => setSettings({ ...settings, invoice_days_before_renewal: e.target.value })}
                placeholder="7"
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-muted-foreground">
                Yenileme tarihinden kaç gün önce fatura oluşturulacak
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto_suspend_enabled"
                checked={settings.auto_suspend_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, auto_suspend_enabled: checked })
                }
              />
              <Label htmlFor="auto_suspend_enabled" className="text-sm font-normal cursor-pointer">
                Otomatik Askıya Al
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto_suspend_days_overdue">Gecikme Sonrası Askıya Alma (Gün)</Label>
              <Input
                id="auto_suspend_days_overdue"
                type="number"
                value={settings.auto_suspend_days_overdue}
                onChange={(e) => setSettings({ ...settings, auto_suspend_days_overdue: e.target.value })}
                placeholder="3"
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto_terminate_days_suspended">Askıya Alınma Sonrası Sonlandırma (Gün)</Label>
              <Input
                id="auto_terminate_days_suspended"
                type="number"
                value={settings.auto_terminate_days_suspended}
                onChange={(e) => setSettings({ ...settings, auto_terminate_days_suspended: e.target.value })}
                placeholder="14"
                className="bg-white border-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Gecikme Faizi Ayarlari */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              <CardTitle>Gecikme Faizi Ayarları</CardTitle>
            </div>
            <CardDescription>
              Geciken ödemeler için otomatik faiz ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="late_fee_enabled"
                checked={settings.late_fee_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, late_fee_enabled: checked })
                }
              />
              <Label htmlFor="late_fee_enabled" className="text-sm font-normal cursor-pointer">
                Gecikme Faizi Uygula
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="late_fee_type">Faiz Tipi</Label>
              <Select
                value={settings.late_fee_type}
                onValueChange={(value) => setSettings({ ...settings, late_fee_type: value })}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Faiz tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Yüzde (%)</SelectItem>
                  <SelectItem value="fixed">Sabit Tutar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="late_fee_amount">Faiz Miktarı</Label>
              <Input
                id="late_fee_amount"
                type="number"
                value={settings.late_fee_amount}
                onChange={(e) => setSettings({ ...settings, late_fee_amount: e.target.value })}
                placeholder="0"
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-muted-foreground">
                {settings.late_fee_type === 'percentage' ? 'Yüzde olarak (örn: 5)' : 'Sabit tutar olarak (TRY)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="late_fee_grace_days">Ek Süre (Gün)</Label>
              <Input
                id="late_fee_grace_days"
                type="number"
                value={settings.late_fee_grace_days}
                onChange={(e) => setSettings({ ...settings, late_fee_grace_days: e.target.value })}
                placeholder="3"
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-muted-foreground">
                Fatura vadesinden sonra faiz uygulanmadan önceki ek süre
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SMTP E-posta Ayarlari */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>SMTP E-posta Ayarları</CardTitle>
            </div>
            <CardDescription>
              E-posta gönderimi için SMTP sunucu ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_host">SMTP Sunucu</Label>
              <Input
                id="smtp_host"
                value={settings.smtp_host}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                placeholder="smtp.example.com"
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_port">SMTP Port</Label>
              <Input
                id="smtp_port"
                type="number"
                value={settings.smtp_port}
                onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                placeholder="587"
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_user">SMTP Kullanıcı Adı</Label>
              <Input
                id="smtp_user"
                value={settings.smtp_user}
                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                placeholder="user@example.com"
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_password">SMTP Şifre</Label>
              <Input
                id="smtp_password"
                type="password"
                value={settings.smtp_password}
                onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                placeholder="********"
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_from_email">Gönderen E-posta</Label>
              <Input
                id="smtp_from_email"
                type="email"
                value={settings.smtp_from_email}
                onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
                placeholder="noreply@example.com"
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_from_name">Gönderen Adı</Label>
              <Input
                id="smtp_from_name"
                value={settings.smtp_from_name}
                onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
                placeholder="Luma Yazılım"
                className="bg-white border-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cloudflare Ayarları */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              <CardTitle>Cloudflare Entegrasyonu</CardTitle>
            </div>
            <CardDescription>
              Domain DNS yönetimi için Cloudflare API bağlantısı. Free planda CF nameserver'ları verilir, Business planda vanity NS kullanılabilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cf_api_token">API Token</Label>
              <Input
                id="cf_api_token"
                type="password"
                value={settings.cf_api_token}
                onChange={(e) => setSettings({ ...settings, cf_api_token: e.target.value })}
                placeholder="Cloudflare API Token"
                className="bg-white border-gray-300 font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Zone:Edit ve DNS:Edit izinleri olan bir API Token oluşturun
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cf_account_id">Account ID</Label>
              <Input
                id="cf_account_id"
                value={settings.cf_account_id}
                onChange={(e) => setSettings({ ...settings, cf_account_id: e.target.value })}
                placeholder="Cloudflare Account ID"
                className="bg-white border-gray-300 font-mono"
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cf_vanity_ns_enabled"
                  checked={settings.cf_vanity_ns_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, cf_vanity_ns_enabled: checked })
                  }
                />
                <Label htmlFor="cf_vanity_ns_enabled" className="text-sm font-normal cursor-pointer">
                  Vanity Nameserver Kullan (Business plan gerekli)
                </Label>
              </div>

              {settings.cf_vanity_ns_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cf_vanity_ns1">NS1</Label>
                    <Input
                      id="cf_vanity_ns1"
                      value={settings.cf_vanity_ns1}
                      onChange={(e) => setSettings({ ...settings, cf_vanity_ns1: e.target.value })}
                      className="bg-white border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cf_vanity_ns2">NS2</Label>
                    <Input
                      id="cf_vanity_ns2"
                      value={settings.cf_vanity_ns2}
                      onChange={(e) => setSettings({ ...settings, cf_vanity_ns2: e.target.value })}
                      className="bg-white border-gray-300"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Ayarları */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle>AI Ayarları</CardTitle>
            </div>
            <CardDescription>
              Yapay zeka destekli özellikler için API ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai_api_key">OpenAI API Key</Label>
              <Input
                id="openai_api_key"
                type="password"
                value={settings.openai_api_key}
                onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                placeholder="sk-..."
                className="bg-white border-gray-300 font-mono"
              />
              <p className="text-xs text-muted-foreground">
                OpenAI API Key - bilet özetleme, taslak yanıt ve semantik arama için
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Kaydet Butonu */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={fetchSettings}
            disabled={saving}
          >
            İptal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  )
}
