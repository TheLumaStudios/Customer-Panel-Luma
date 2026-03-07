import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useUpdateProfile, useChangePassword } from '@/hooks/useProfile'
import { useCustomers } from '@/hooks/useCustomers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import AddressManager from '@/components/shared/AddressManager'
import { User, Mail, Phone, Building2, Lock, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

export default function Profile() {
  const { profile, refetch } = useAuth()
  const { data: customers } = useCustomers()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  // Find current customer
  const currentCustomer = customers?.find(c => c.email === profile?.email)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    company_name: profile?.company_name || '',
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Update profile form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        company_name: profile.company_name || '',
      })
    }
  }, [profile])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()

    try {
      await updateProfile.mutateAsync(profileForm)
      await refetch()
      toast.success('Profil güncellendi', {
        description: 'Bilgileriniz başarıyla kaydedildi',
      })
    } catch (error) {
      toast.error('Güncelleme başarısız', {
        description: error.message,
      })
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Şifreler eşleşmiyor', {
        description: 'Yeni şifre ve tekrar alanları aynı olmalıdır',
      })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Şifre çok kısa', {
        description: 'Şifre en az 6 karakter olmalıdır',
      })
      return
    }

    try {
      await changePassword.mutateAsync(passwordForm.newPassword)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      toast.success('Şifre güncellendi', {
        description: 'Şifreniz başarıyla değiştirildi',
      })
    } catch (error) {
      toast.error('Şifre değiştirilemedi', {
        description: error.message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profilim</h1>
        <p className="text-muted-foreground mt-1">
          Profil bilgilerinizi görüntüleyin ve düzenleyin
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Kişisel Bilgiler</CardTitle>
            <CardDescription>
              Hesap ve iletişim bilgileriniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Ad Soyad</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
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
                    value={profile?.email || ''}
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
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
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
                    value={profileForm.company_name}
                    onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                    placeholder="Şirket Adı (opsiyonel)"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Değişiklikleri Kaydet
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Hesap Bilgileri</CardTitle>
            <CardDescription>
              Hesap durumunuz ve istatistikler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Müşteri ID</span>
              <span className="font-medium font-mono text-xs">{profile?.id?.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Rol</span>
              <span className="font-medium capitalize">{profile?.role || 'customer'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Kayıt Tarihi</span>
              <span className="font-medium">
                {profile?.created_at ? formatDate(profile.created_at) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Son Güncelleme</span>
              <span className="font-medium">
                {profile?.updated_at ? formatDate(profile.updated_at) : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle>Şifre Değiştir</CardTitle>
            <CardDescription>
              Hesap güvenliği için şifrenizi güncelleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Mevcut Şifre</Label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Mevcut şifreniz"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Yeni Şifre</Label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Yeni şifre (min 6 karakter)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Yeni Şifre (Tekrar)</Label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Yeni şifre tekrar"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={changePassword.isPending}>
                {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Şifreyi Güncelle
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Stats */}
        {currentCustomer && (
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Detayları</CardTitle>
              <CardDescription>
                Ek müşteri bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentCustomer.customer_code && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Müşteri Kodu</span>
                  <span className="font-medium">{currentCustomer.customer_code}</span>
                </div>
              )}
              {currentCustomer.status && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Durum</span>
                  <span className="font-medium capitalize">{currentCustomer.status}</span>
                </div>
              )}
              {currentCustomer.tc_no && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">TC No</span>
                  <span className="font-medium">{currentCustomer.tc_no}</span>
                </div>
              )}
              {currentCustomer.vkn && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">VKN</span>
                  <span className="font-medium">{currentCustomer.vkn}</span>
                </div>
              )}
              {currentCustomer.tax_office && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Vergi Dairesi</span>
                  <span className="font-medium">{currentCustomer.tax_office}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Address Management */}
      <Separator className="my-8" />
      <AddressManager customerId={profile?.id} />
    </div>
  )
}
