import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { Settings, Save, CreditCard, Building2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export default function SystemSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    iyzico_invoice_type: '',
    iyzico_payment_method: '',
    iyzico_official_invoice: true,
    is_bankasi_iban: '',
    ziraat_bankasi_iban: '',
    default_bank_iban: '',
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
