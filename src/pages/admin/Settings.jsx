import { useState, useEffect } from 'react'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Building2, CreditCard, Mail, Save, Settings as SettingsIcon } from 'lucide-react'
import { toast } from '@/lib/toast'

export default function Settings() {
  const { data: settings, isLoading, error } = useSettings()
  const updateSettings = useUpdateSettings()

  const [formData, setFormData] = useState({})

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateSettings.mutateAsync(formData)
      toast.success('Ayarlar başarıyla güncellendi', {
        description: 'Sistem ayarlarınız kaydedildi'
      })
    } catch (error) {
      toast.error('Ayarlar güncellenemedi', {
        description: error.message
      })
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Sistem Ayarları
        </h1>
        <p className="text-muted-foreground mt-1">
          Şirket bilgileri, banka bilgileri ve fatura ayarlarını yönetin
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Şirket Bilgileri
            </CardTitle>
            <CardDescription>
              Faturalarda görünecek şirket bilgilerinizi girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Şirket Adı</label>
                <Input
                  value={formData.company_name || ''}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="SIRKET ADIN"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slogan</label>
                <Input
                  value={formData.company_slogan || ''}
                  onChange={(e) => handleChange('company_slogan', e.target.value)}
                  placeholder="Müşteri ve Hizmet Yönetim Sistemleri"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input
                  value={formData.company_website || ''}
                  onChange={(e) => handleChange('company_website', e.target.value)}
                  placeholder="www.sirketiniz.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-posta</label>
                <Input
                  value={formData.company_email || ''}
                  onChange={(e) => handleChange('company_email', e.target.value)}
                  placeholder="info@sirketiniz.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon</label>
                <Input
                  value={formData.company_phone || ''}
                  onChange={(e) => handleChange('company_phone', e.target.value)}
                  placeholder="+90 (212) 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vergi Dairesi</label>
                <Input
                  value={formData.company_tax_office || ''}
                  onChange={(e) => handleChange('company_tax_office', e.target.value)}
                  placeholder="Kadıköy Vergi Dairesi"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vergi Numarası</label>
                <Input
                  value={formData.company_tax_number || ''}
                  onChange={(e) => handleChange('company_tax_number', e.target.value)}
                  placeholder="1234567890"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Adres</label>
              <Textarea
                value={formData.company_address || ''}
                onChange={(e) => handleChange('company_address', e.target.value)}
                placeholder="Şirket adresinizi girin"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Banka Bilgileri
            </CardTitle>
            <CardDescription>
              Faturalarda görünecek banka bilgilerinizi girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Banka Adı</label>
                <Input
                  value={formData.bank_name || ''}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  placeholder="Ziraat Bankası"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hesap Adı</label>
                <Input
                  value={formData.bank_account_name || ''}
                  onChange={(e) => handleChange('bank_account_name', e.target.value)}
                  placeholder="SIRKET ADIN"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">IBAN</label>
                <Input
                  value={formData.bank_iban || ''}
                  onChange={(e) => handleChange('bank_iban', e.target.value)}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SWIFT Kodu</label>
                <Input
                  value={formData.bank_swift || ''}
                  onChange={(e) => handleChange('bank_swift', e.target.value)}
                  placeholder="TCZBTR2A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Şube</label>
              <Input
                value={formData.bank_branch || ''}
                onChange={(e) => handleChange('bank_branch', e.target.value)}
                placeholder="Kadıköy Şubesi"
              />
            </div>
          </CardContent>
        </Card>

        {/* Support Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Destek Bilgileri
            </CardTitle>
            <CardDescription>
              Müşteri desteği için iletişim bilgileri
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Destek E-posta</label>
                <Input
                  value={formData.support_email || ''}
                  onChange={(e) => handleChange('support_email', e.target.value)}
                  placeholder="destek@sirketiniz.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Destek Telefon</label>
                <Input
                  value={formData.support_phone || ''}
                  onChange={(e) => handleChange('support_phone', e.target.value)}
                  placeholder="+90 (212) 123 45 67"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Fatura Ayarları</CardTitle>
            <CardDescription>
              Faturalarda görünecek metinler ve KDV oranı
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Varsayılan KDV Oranı (%)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.default_tax_rate || 0}
                onChange={(e) => handleChange('default_tax_rate', e.target.value)}
                placeholder="18.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fatura Footer Metni</label>
              <Textarea
                value={formData.invoice_footer_text || ''}
                onChange={(e) => handleChange('invoice_footer_text', e.target.value)}
                placeholder="Bu belge elektronik ortamda oluşturulmuş olup..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Yasal Metin</label>
              <Textarea
                value={formData.invoice_legal_text || ''}
                onChange={(e) => handleChange('invoice_legal_text', e.target.value)}
                placeholder="İşbu sözleşme elektronik ortamda..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ekstra Notlar (Opsiyonel)</label>
              <Textarea
                value={formData.invoice_notes || ''}
                onChange={(e) => handleChange('invoice_notes', e.target.value)}
                placeholder="Tüm faturalarda görünecek ekstra notlar"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={updateSettings.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateSettings.isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}
