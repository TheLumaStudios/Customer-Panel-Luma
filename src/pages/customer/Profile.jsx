import { useAuth } from '@/hooks/useAuth.jsx'
import { useCustomers } from '@/hooks/useCustomers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Phone, Building2, FileText, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Profile() {
  const { profile } = useAuth()
  const { data: customers } = useCustomers()

  // Find current customer
  const currentCustomer = customers?.find(c => c.email === profile?.email)

  console.log('Profile Debug:', {
    profile,
    customers,
    currentCustomer
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profilim</h1>
        <p className="text-muted-foreground mt-1">
          Profil bilgilerinizi görüntüleyin ve düzenleyin
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kişisel Bilgiler</CardTitle>
            <CardDescription>
              Hesap ve iletişim bilgileriniz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Ad Soyad</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  defaultValue={profile?.full_name || ''}
                  placeholder="Ad Soyad"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  defaultValue={profile?.email || ''}
                  placeholder="ornek@email.com"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">
                E-posta adresi değiştirilemez
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  defaultValue={profile?.phone || ''}
                  placeholder="+90 555 555 5555"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Şirket Adı</Label>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="company_name"
                  defaultValue={profile?.company_name || ''}
                  placeholder="Şirket Adı (opsiyonel)"
                />
              </div>
            </div>

            <Button className="w-full">
              Değişiklikleri Kaydet
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hesap Bilgileri</CardTitle>
            <CardDescription>
              Hesap durumunuz ve istatistikler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Müşteri Kodu</span>
              <span className="font-medium">{currentCustomer?.customer_code || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Durum</span>
              <span className="font-medium capitalize">{currentCustomer?.status || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Kayıt Tarihi</span>
              <span className="font-medium">
                {currentCustomer?.created_at ? formatDate(currentCustomer.created_at) : '-'}
              </span>
            </div>
            {currentCustomer?.tc_no && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">TC No</span>
                <span className="font-medium">{currentCustomer.tc_no}</span>
              </div>
            )}
            {currentCustomer?.vkn && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">VKN</span>
                <span className="font-medium">{currentCustomer.vkn}</span>
              </div>
            )}
            {currentCustomer?.tax_office && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Vergi Dairesi</span>
                <span className="font-medium">{currentCustomer.tax_office}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {currentCustomer?.billing_address && (
          <Card>
            <CardHeader>
              <CardTitle>Adres Bilgileri</CardTitle>
              <CardDescription>
                Fatura ve teslimat adresiniz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Fatura Adresi
                </Label>
                <div className="p-3 bg-muted/30 rounded-md text-sm">
                  <p>{currentCustomer.billing_address}</p>
                  {currentCustomer.billing_district && <p>{currentCustomer.billing_district}</p>}
                  {currentCustomer.billing_city && <p>{currentCustomer.billing_city}</p>}
                  {currentCustomer.billing_postal_code && <p>Posta Kodu: {currentCustomer.billing_postal_code}</p>}
                  <p>{currentCustomer.billing_country || 'Türkiye'}</p>
                </div>
              </div>

              {!currentCustomer.same_as_billing && currentCustomer.shipping_address && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Teslimat Adresi
                  </Label>
                  <div className="p-3 bg-muted/30 rounded-md text-sm">
                    <p>{currentCustomer.shipping_address}</p>
                    {currentCustomer.shipping_district && <p>{currentCustomer.shipping_district}</p>}
                    {currentCustomer.shipping_city && <p>{currentCustomer.shipping_city}</p>}
                    {currentCustomer.shipping_postal_code && <p>Posta Kodu: {currentCustomer.shipping_postal_code}</p>}
                    <p>{currentCustomer.shipping_country || 'Türkiye'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Şifre Değiştir</CardTitle>
            <CardDescription>
              Hesap güvenliği için şifrenizi güncelleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Mevcut Şifre</Label>
              <Input
                id="current_password"
                type="password"
                placeholder="Mevcut şifreniz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">Yeni Şifre</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Yeni şifre"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Yeni Şifre (Tekrar)</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Yeni şifre tekrar"
              />
            </div>

            <Button className="w-full">
              Şifreyi Güncelle
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
