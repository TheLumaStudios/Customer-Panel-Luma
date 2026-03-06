import { useAuth } from '@/hooks/useAuth.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Phone, Building2 } from 'lucide-react'

export default function Profile() {
  const { profile } = useAuth()

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
              <span className="text-sm text-muted-foreground">Rol</span>
              <span className="font-medium capitalize">{profile?.role || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Kayıt Tarihi</span>
              <span className="font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Son Güncelleme</span>
              <span className="font-medium">
                {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

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
