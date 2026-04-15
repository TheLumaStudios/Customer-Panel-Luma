import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Tag, Copy, Check } from 'lucide-react'

export default function PromoCodes() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '0',
    max_uses: '',
    max_uses_per_customer: '',
    valid_from: '',
    valid_until: '',
    applicable_types: [],
    is_active: true,
    is_first_month_free: false,
  })

  const fetchPromos = async () => {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setPromos(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPromos() }, [])

  const resetForm = () => {
    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '0',
      max_uses: '',
      max_uses_per_customer: '',
      valid_from: '',
      valid_until: '',
      applicable_types: [],
      is_active: true,
      is_first_month_free: false,
    })
    setEditing(null)
  }

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      toast.error('Kod ve indirim değeri zorunludur')
      return
    }

    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      max_uses_per_customer: form.max_uses_per_customer ? parseInt(form.max_uses_per_customer) : null,
      valid_from: form.valid_from || new Date().toISOString(),
      valid_until: form.valid_until || null,
      applicable_types: form.applicable_types,
      is_active: form.is_active,
      is_first_month_free: form.is_first_month_free,
    }

    let error
    if (editing) {
      ({ error } = await supabase.from('promo_codes').update(payload).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('promo_codes').insert(payload))
    }

    if (error) {
      toast.error('Kayıt başarısız: ' + error.message)
    } else {
      toast.success(editing ? 'Güncellendi' : 'Oluşturuldu')
      setDialogOpen(false)
      resetForm()
      fetchPromos()
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu promosyon kodunu silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('promo_codes').delete().eq('id', id)
    if (error) toast.error('Silinemedi')
    else {
      toast.success('Silindi')
      fetchPromos()
    }
  }

  const toggleActive = async (promo) => {
    await supabase.from('promo_codes').update({ is_active: !promo.is_active }).eq('id', promo.id)
    fetchPromos()
  }

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openEdit = (promo) => {
    setEditing(promo)
    setForm({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: String(promo.discount_value),
      min_order_amount: String(promo.min_order_amount || 0),
      max_uses: promo.max_uses ? String(promo.max_uses) : '',
      max_uses_per_customer: promo.max_uses_per_customer ? String(promo.max_uses_per_customer) : '',
      valid_from: promo.valid_from ? promo.valid_from.slice(0, 16) : '',
      valid_until: promo.valid_until ? promo.valid_until.slice(0, 16) : '',
      applicable_types: promo.applicable_types || [],
      is_active: promo.is_active,
      is_first_month_free: promo.is_first_month_free || false,
    })
    setDialogOpen(true)
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="h-6 w-6" /> Promosyon Kodları</h1>
          <p className="text-muted-foreground">İndirim ve kampanya kodlarını yönetin</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> Yeni Kod
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Kod</th>
                  <th className="text-left p-3 font-medium">İndirim</th>
                  <th className="text-left p-3 font-medium">Kullanım</th>
                  <th className="text-left p-3 font-medium">Durum</th>
                  <th className="text-left p-3 font-medium">Geçerlilik</th>
                  <th className="text-right p-3 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((promo) => (
                  <tr key={promo.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-primary">{promo.code}</code>
                        <button onClick={() => copyCode(promo.code, promo.id)} className="text-muted-foreground hover:text-foreground">
                          {copiedId === promo.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        {promo.is_first_month_free && <Badge variant="secondary" className="text-[10px]">İlk Ay Bedava</Badge>}
                      </div>
                    </td>
                    <td className="p-3">
                      {promo.discount_type === 'percentage' ? `%${promo.discount_value}` : `${promo.discount_value}₺`}
                      {promo.min_order_amount > 0 && <span className="text-muted-foreground text-xs ml-1">(min {promo.min_order_amount}₺)</span>}
                    </td>
                    <td className="p-3">
                      {promo.used_count}{promo.max_uses ? ` / ${promo.max_uses}` : ' / ∞'}
                    </td>
                    <td className="p-3">
                      <button onClick={() => toggleActive(promo)}>
                        <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                          {promo.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </button>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {promo.valid_from && new Date(promo.valid_from).toLocaleDateString('tr-TR')}
                      {promo.valid_until && ` - ${new Date(promo.valid_until).toLocaleDateString('tr-TR')}`}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(promo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(promo.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Henüz promosyon kodu yok</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDialogOpen(false)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing ? 'Kodu Düzenle' : 'Yeni Promosyon Kodu'}</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kod</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="YENI2024" className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>İndirim Tipi</Label>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                  <option value="percentage">Yüzde (%)</option>
                  <option value="fixed">Sabit (₺)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>İndirim Değeri</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === 'percentage' ? '10' : '50'} />
              </div>
              <div className="space-y-2">
                <Label>Min. Sipariş Tutarı (₺)</Label>
                <Input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Maks. Kullanım</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Sınırsız" />
              </div>
              <div className="space-y-2">
                <Label>Kişi Başı Maks.</Label>
                <Input type="number" value={form.max_uses_per_customer} onChange={(e) => setForm({ ...form, max_uses_per_customer: e.target.value })} placeholder="Sınırsız" />
              </div>
              <div className="space-y-2">
                <Label>Başlangıç</Label>
                <Input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bitiş</Label>
                <Input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                Aktif
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_first_month_free} onChange={(e) => setForm({ ...form, is_first_month_free: e.target.checked })} className="rounded" />
                İlk Ay Bedava
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>İptal</Button>
              <Button onClick={handleSave}>{editing ? 'Güncelle' : 'Oluştur'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
