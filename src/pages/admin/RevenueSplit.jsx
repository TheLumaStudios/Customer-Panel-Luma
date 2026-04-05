import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, TrendingUp, DollarSign, Users, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

const emptyPartner = { name: '', email: '', share_percent: 0, is_active: true }

export default function RevenueSplit() {
  const [partners, setPartners] = useState([])
  const [splits, setSplits] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyPartner)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('revenue_partners').select('*').order('created_at', { ascending: false }),
      supabase.from('revenue_splits').select('*, partner:revenue_partners(name), invoice:invoices(invoice_number)').order('created_at', { ascending: false }).limit(50),
    ])
    setPartners(p || [])
    setSplits(s || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyPartner); setFormOpen(true) }
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, email: p.email, share_percent: p.share_percent, is_active: p.is_active }); setFormOpen(true) }

  const handleSave = async () => {
    if (!form.name || !form.email || form.share_percent < 0 || form.share_percent > 100) {
      toast.error('Lütfen tüm alanları doğru doldurun'); return
    }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('revenue_partners').update(form).eq('id', editing.id)
        if (error) throw error
        toast.success('Partner güncellendi')
      } else {
        const { error } = await supabase.from('revenue_partners').insert(form)
        if (error) throw error
        toast.success('Partner eklendi')
      }
      setFormOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu partneri silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('revenue_partners').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Partner silindi'); fetchData() }
  }

  const totalShare = partners.filter(p => p.is_active).reduce((s, p) => s + Number(p.share_percent), 0)

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gelir Paylaşımı</h1>
          <p className="text-muted-foreground text-sm">Partner gelir dağılımı yönetimi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-1" /> Yenile</Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Partner Ekle</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{partners.length}</p><p className="text-xs text-muted-foreground">Toplam Partner</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">%{totalShare.toFixed(1)}</p><p className="text-xs text-muted-foreground">Toplam Pay Oranı</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center"><DollarSign className="h-5 w-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{splits.length}</p><p className="text-xs text-muted-foreground">Toplam Split</p></div></div></CardContent></Card>
      </div>

      {/* Partners Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Partnerler</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Pay %</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kayıt</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell><Badge variant="outline">%{p.share_percent}</Badge></TableCell>
                  <TableCell><Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Aktif' : 'Pasif'}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(p.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {partners.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Henüz partner eklenmemiş</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revenue Split History */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Gelir Paylaşım Geçmişi</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Brüt</TableHead>
                <TableHead>Partner Payi</TableHead>
                <TableHead>Bizim Pay</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {splits.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.invoice?.invoice_number || '-'}</TableCell>
                  <TableCell>{s.partner?.name || '-'}</TableCell>
                  <TableCell className="font-medium">{Number(s.gross_amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</TableCell>
                  <TableCell className="text-red-600">{Number(s.partner_share).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</TableCell>
                  <TableCell className="text-emerald-600">{Number(s.our_share).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(s.created_at)}</TableCell>
                </TableRow>
              ))}
              {splits.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Henüz gelir paylaşımı yok</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Partner Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Partner Düzenle' : 'Yeni Partner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ad</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Partner adı" />
            </div>
            <div>
              <Label>E-posta</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="partner@example.com" />
            </div>
            <div>
              <Label>Pay Oranı (%)</Label>
              <Input type="number" min={0} max={100} step={0.01} value={form.share_percent} onChange={(e) => setForm({ ...form, share_percent: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Durum</Label>
              <Select value={form.is_active ? 'active' : 'passive'} onValueChange={(v) => setForm({ ...form, is_active: v === 'active' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="passive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
