import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useUpdateProfile, useChangePassword } from '@/hooks/useProfile'
import { useCustomers } from '@/hooks/useCustomers'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import AddressManager from '@/components/shared/AddressManager'
import PasswordStrength from '@/components/shared/PasswordStrength'
import { User, Mail, Phone, Building2, Lock, Loader2, Download, Trash2, Shield } from 'lucide-react'
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
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profilim</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Profil bilgilerinizi görüntüleyin ve düzenleyin
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card className="rounded-xl">
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
        <Card className="rounded-xl">
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
        <Card className="rounded-xl">
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
                <PasswordStrength password={passwordForm.newPassword} />
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
          <Card className="rounded-xl">
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

      {/* KVKK Data Rights */}
      <Separator className="my-8" />
      <KVKKDataRights profile={profile} currentCustomer={currentCustomer} />
    </div>
  )
}

function KVKKDataRights({ profile, currentCustomer }) {
  const [exporting, setExporting] = useState(false)
  const [deleteRequesting, setDeleteRequesting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleExportData = async () => {
    setExporting(true)
    try {
      const exportData = {
        _meta: {
          exported_at: new Date().toISOString(),
          format: 'KVKK md. 11 - Kisisel Veri Raporu',
          data_controller: 'Luma Yazilim - Enes POYRAZ',
        },
        profile: {
          id: profile?.id,
          email: profile?.email,
          full_name: profile?.full_name,
          phone: profile?.phone,
          company_name: profile?.company_name,
          role: profile?.role,
          created_at: profile?.created_at,
        },
        customer: currentCustomer ? {
          customer_code: currentCustomer.customer_code,
          tc_no: currentCustomer.tc_no ? '***' + currentCustomer.tc_no.slice(-4) : null,
          vkn: currentCustomer.vkn,
          tax_office: currentCustomer.tax_office,
          status: currentCustomer.status,
        } : null,
      }

      // Fetch related data
      const [domains, hosting, invoices, addresses, tickets] = await Promise.all([
        supabase.from('domains').select('domain_name, status, registration_date, expiry_date').eq('customer_id', currentCustomer?.id).then(r => r.data),
        supabase.from('hosting_accounts').select('domain, package_name, status, start_date, end_date').eq('customer_id', currentCustomer?.id).then(r => r.data),
        supabase.from('invoices').select('invoice_number, amount, status, due_date, created_at').eq('customer_id', currentCustomer?.id).then(r => r.data),
        supabase.from('customer_addresses').select('address_type, city, country').eq('customer_id', currentCustomer?.id || profile?.id).then(r => r.data),
        supabase.from('tickets').select('subject, status, priority, created_at').eq('customer_id', currentCustomer?.id || profile?.id).then(r => r.data),
      ])

      exportData.domains = domains || []
      exportData.hosting = hosting || []
      exportData.invoices = (invoices || []).map(inv => ({
        ...inv,
        amount: inv.amount ? `${inv.amount} TRY` : null,
      }))
      exportData.addresses = addresses || []
      exportData.tickets = (tickets || []).map(t => ({
        subject: t.subject,
        status: t.status,
        created_at: t.created_at,
      }))

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kvkk-veri-raporu-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Verileriniz indirildi', {
        description: 'KVKK md. 11 kapsaminda kisisel veri raporunuz hazirlanmistir.',
      })
    } catch (error) {
      console.error('Data export failed:', error)
      toast.error('Veri indirme basarisiz', {
        description: 'Lutfen daha sonra tekrar deneyin veya destek talebi olusturun.',
      })
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteRequest = async () => {
    setDeleteRequesting(true)
    try {
      // Create a support ticket for account deletion
      const { error } = await supabase.from('tickets').insert({
        customer_id: currentCustomer?.id || profile?.id,
        subject: 'KVKK - Hesap Silme Talebi',
        message: `KVKK md. 7 ve md. 11/e kapsaminda hesabimin ve tum kisisel verilerimin silinmesini talep ediyorum.\n\nTalep eden: ${profile?.full_name}\nE-posta: ${profile?.email}\nTarih: ${new Date().toLocaleDateString('tr-TR')}`,
        priority: 'high',
        status: 'open',
        department: 'billing',
      })

      if (error) throw error

      toast.success('Silme talebiniz alindi', {
        description: 'KVKK kapsaminda talebiniz 30 gun icinde degerlendirilecektir. Destek taleplerinden takip edebilirsiniz.',
      })
    } catch (error) {
      console.error('Delete request failed:', error)
      toast.error('Talep gonderilemedi', {
        description: 'Lutfen info@lumayazilim.com adresine e-posta gonderiniz.',
      })
    } finally {
      setDeleteRequesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">KVKK Veri Haklarim</h2>
        <p className="text-sm text-muted-foreground">
          6698 sayili KVKK md. 11 kapsamindaki haklarinizi kullanabilirsiniz.{' '}
          <a href="/kvkk" className="text-primary hover:underline" target="_blank">
            Aydinlatma Metni
          </a>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Export Data */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4" />
              Verilerimi Indir
            </CardTitle>
            <CardDescription>
              Islenen kisisel verilerinizin bir kopyasini JSON formatinda indirin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExportData}
              disabled={exporting}
              variant="outline"
              className="w-full"
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hazirlaniyor...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Veri Raporunu Indir
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="rounded-xl border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Trash2 className="h-4 w-4" />
              Hesabimi Sil
            </CardTitle>
            <CardDescription>
              KVKK md. 7 kapsaminda tum verilerinizin silinmesini talep edin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Silme Talebi Olustur
            </Button>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Hesap silme talebi</DialogTitle>
                  <DialogDescription className="space-y-2">
                    <p>Bu islem geri alinamaz. Hesabinizin silinmesi ile:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Tum kisisel verileriniz kalici olarak silinecektir</li>
                      <li>Aktif hizmetleriniz (hosting, domain vb.) sonlandirilacaktir</li>
                      <li>Yasal zorunluluk geregi bazi veriler saklama suresi sonuna kadar tutulabilir</li>
                    </ul>
                    <p className="text-sm font-medium mt-2">
                      Talebiniz KVKK kapsaminda 30 gun icinde degerlendirilecektir.
                    </p>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Vazgec</Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await handleDeleteRequest()
                      setDeleteDialogOpen(false)
                    }}
                    disabled={deleteRequesting}
                  >
                    {deleteRequesting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Talebi Gonder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
