import { useRef, useState } from 'react'
import {
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
} from '@/hooks/useBankAccounts'
import { uploadBankLogo } from '@/lib/api/bankAccounts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Landmark, Plus, Pencil, Trash2, Copy, Upload, Loader2, X } from 'lucide-react'
import { toast } from '@/lib/toast'

const emptyForm = {
  bank_name: '',
  bank_logo_url: '',
  account_holder: '',
  iban: '',
  swift: '',
  branch: '',
  currency: 'TRY',
  notes: '',
  is_active: true,
  sort_order: 0,
}

export default function BankAccounts() {
  const { data: accounts, isLoading } = useBankAccounts()
  const createMut = useCreateBankAccount()
  const updateMut = useUpdateBankAccount()
  const deleteMut = useDeleteBankAccount()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef(null)

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo en fazla 2MB olabilir')
      return
    }
    setUploadingLogo(true)
    try {
      const url = await uploadBankLogo(file)
      setForm((prev) => ({ ...prev, bank_logo_url: url }))
      toast.success('Logo yüklendi')
    } catch (err) {
      toast.error('Logo yüklenemedi', { description: err.message })
    } finally {
      setUploadingLogo(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (acc) => {
    setEditing(acc)
    setForm({
      bank_name: acc.bank_name || '',
      bank_logo_url: acc.bank_logo_url || '',
      account_holder: acc.account_holder || '',
      iban: acc.iban || '',
      swift: acc.swift || '',
      branch: acc.branch || '',
      currency: acc.currency || 'TRY',
      notes: acc.notes || '',
      is_active: acc.is_active ?? true,
      sort_order: acc.sort_order || 0,
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.bank_name.trim() || !form.account_holder.trim() || !form.iban.trim()) {
      toast.error('Banka adı, hesap sahibi ve IBAN zorunlu')
      return
    }
    const payload = {
      ...form,
      bank_logo_url: form.bank_logo_url?.trim() || null,
      swift: form.swift?.trim() || null,
      branch: form.branch?.trim() || null,
      notes: form.notes?.trim() || null,
      sort_order: Number(form.sort_order) || 0,
    }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, data: payload })
        toast.success('Banka hesabı güncellendi')
      } else {
        await createMut.mutateAsync(payload)
        toast.success('Banka hesabı eklendi')
      }
      setOpen(false)
    } catch (err) {
      toast.error('Kaydedilemedi', { description: err.message })
    }
  }

  const handleDelete = async (acc) => {
    if (!confirm(`${acc.bank_name} banka hesabını silmek istediğinize emin misiniz?`)) return
    try {
      await deleteMut.mutateAsync(acc.id)
      toast.success('Silindi')
    } catch (err) {
      toast.error('Silinemedi', { description: err.message })
    }
  }

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} kopyalandı`)
    } catch (_) {}
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Landmark className="h-7 w-7" />
            Banka Hesapları
          </h1>
          <p className="page-description">
            Müşterilerin havale/EFT yapabileceği banka hesaplarını yönetin. Aktif olanlar
            müşteri cüzdan sayfasında görünür.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Banka Hesabı
        </Button>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Hesaplar</CardTitle>
          <CardDescription>Toplam {accounts?.length || 0} banka hesabı</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Yükleniyor...</p>
          ) : !accounts?.length ? (
            <div className="text-center py-10 text-muted-foreground">
              <Landmark className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Henüz banka hesabı eklenmemiş.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {accounts.map((acc) => (
                <Card key={acc.id} className="p-4 border">
                  <div className="flex items-start gap-3">
                    {acc.bank_logo_url ? (
                      <img
                        src={acc.bank_logo_url}
                        alt={acc.bank_name}
                        className="h-12 w-12 object-contain rounded border bg-white"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded border bg-muted flex items-center justify-center">
                        <Landmark className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{acc.bank_name}</h3>
                        {!acc.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            Pasif
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {acc.account_holder}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate font-mono">
                          {acc.iban}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleCopy(acc.iban, 'IBAN')}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {acc.branch && (
                        <p className="text-xs text-muted-foreground mt-1">Şube: {acc.branch}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(acc)}>
                      <Pencil className="h-4 w-4 mr-1" /> Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(acc)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Sil
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Banka Hesabını Düzenle' : 'Yeni Banka Hesabı'}
            </DialogTitle>
            <DialogDescription>
              Banka adı, logo bağlantısı, hesap sahibi ve IBAN bilgilerini girin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Banka Adı *</Label>
              <Input
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                placeholder="örn: Ziraat Bankası"
              />
            </div>

            <div className="grid gap-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {form.bank_logo_url ? (
                  <div className="relative">
                    <img
                      src={form.bank_logo_url}
                      alt="logo önizleme"
                      className="h-16 w-16 object-contain rounded border bg-white"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, bank_logo_url: '' })}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      title="Logoyu kaldır"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center">
                    <Landmark className="h-7 w-7 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleLogoFile}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {form.bank_logo_url ? 'Logoyu Değiştir' : 'Logo Yükle'}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP veya SVG — en fazla 2MB
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Hesap Sahibi *</Label>
              <Input
                value={form.account_holder}
                onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
                placeholder="Şirket Adı A.Ş."
              />
            </div>

            <div className="grid gap-2">
              <Label>IBAN *</Label>
              <Input
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Şube</Label>
                <Input
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  placeholder="örn: Merkez"
                />
              </div>
              <div className="grid gap-2">
                <Label>SWIFT</Label>
                <Input
                  value={form.swift}
                  onChange={(e) => setForm({ ...form, swift: e.target.value })}
                  placeholder="opsiyonel"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Para Birimi</Label>
                <Input
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  placeholder="TRY"
                />
              </div>
              <div className="grid gap-2">
                <Label>Sıralama</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Not</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Havale açıklamasında ne yazılması gerektiği, vs."
                rows={2}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: !!v })}
              />
              <span className="text-sm">Aktif (müşterilere göster)</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {createMut.isPending || updateMut.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
