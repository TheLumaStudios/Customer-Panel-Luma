import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, FileText, CheckCircle2, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

const emptyForm = { customer_id: '', project_name: '', milestone_name: '', description: '', amount: '', currency: 'TRY', status: 'pending', due_date: '', sort_order: 0 }
const statusLabels = { pending: 'Bekliyor', approved: 'Onaylandı', invoiced: 'Faturalandı', paid: 'Ödendi', cancelled: 'İptal' }
const statusColors = { pending: 'secondary', approved: 'default', invoiced: 'outline', paid: 'default', cancelled: 'destructive' }

export default function ProjectMilestones() {
  const [milestones, setMilestones] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCustomer, setFilterCustomer] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from('project_milestones').select('*, invoice:invoices(invoice_number), customer:profiles!customer_id(full_name, email)').order('project_name').order('sort_order'),
      supabase.from('profiles').select('id, full_name, email').eq('role', 'customer').order('full_name'),
    ])
    setMilestones(m || [])
    setCustomers(c || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = filterCustomer === 'all' ? milestones : milestones.filter(m => m.customer_id === filterCustomer)

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (m) => {
    setEditing(m)
    setForm({ customer_id: m.customer_id, project_name: m.project_name, milestone_name: m.milestone_name, description: m.description || '', amount: m.amount, currency: m.currency, status: m.status, due_date: m.due_date || '', sort_order: m.sort_order })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.customer_id || !form.project_name || !form.milestone_name || !form.amount) {
      toast.error('Zorunlu alanları doldurun'); return
    }
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount), sort_order: parseInt(form.sort_order) || 0 }
      if (!payload.due_date) delete payload.due_date
      if (editing) {
        const { error } = await supabase.from('project_milestones').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Milestone güncellendi')
      } else {
        const { error } = await supabase.from('project_milestones').insert(payload)
        if (error) throw error
        toast.success('Milestone eklendi')
      }
      setFormOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu milestone silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('project_milestones').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Milestone silindi'); fetchData() }
  }

  const handleCreateInvoice = async (milestone) => {
    if (milestone.status !== 'approved') { toast.error('Sadece onaylanan milestone faturalanabilir'); return }
    try {
      const invoiceNumber = `PRJ-${Date.now().toString(36).toUpperCase()}`
      const { data: inv, error: invErr } = await supabase.from('invoices').insert({
        customer_id: milestone.customer_id,
        invoice_number: invoiceNumber,
        amount: milestone.amount,
        currency: milestone.currency,
        status: 'pending',
        due_date: milestone.due_date || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        description: `${milestone.project_name} - ${milestone.milestone_name}`,
      }).select().single()
      if (invErr) throw invErr

      const { error: upErr } = await supabase.from('project_milestones').update({ status: 'invoiced', invoice_id: inv.id }).eq('id', milestone.id)
      if (upErr) throw upErr

      toast.success('Fatura oluşturuldu', { description: invoiceNumber })
      fetchData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase.from('project_milestones').update({ status: newStatus }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Durum güncellendi'); fetchData() }
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proje Faturaları</h1>
          <p className="text-muted-foreground text-sm">Milestone bazlı faturalandırma yönetimi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-1" /> Yenile</Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Milestone Ekle</Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <Label className="text-sm">Müşteri:</Label>
        <Select value={filterCustomer} onValueChange={setFilterCustomer}>
          <SelectTrigger className="w-[250px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Müşteriler</SelectItem>
            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead>Proje</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Fatura</TableHead>
                <TableHead>Vade</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{m.customer?.full_name || m.customer?.email || '-'}</TableCell>
                  <TableCell className="font-medium">{m.project_name}</TableCell>
                  <TableCell>{m.milestone_name}</TableCell>
                  <TableCell className="font-medium">{Number(m.amount).toLocaleString('tr-TR', { style: 'currency', currency: m.currency || 'TRY' })}</TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{m.invoice?.invoice_number || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.due_date || '-'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {m.status === 'pending' && (
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(m.id, 'approved')} title="Onayla">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </Button>
                    )}
                    {m.status === 'approved' && (
                      <Button variant="ghost" size="sm" onClick={() => handleCreateInvoice(m)} title="Fatura Kes">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Henüz milestone eklenmemiş</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Milestone Düzenle' : 'Yeni Milestone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Müşteri</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Müşteri seçin" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Proje Adı</Label>
              <Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} placeholder="örnek: Kurumsal Web Sitesi" />
            </div>
            <div>
              <Label>Milestone Adı</Label>
              <Input value={form.milestone_name} onChange={(e) => setForm({ ...form, milestone_name: e.target.value })} placeholder="örnek: Tasarım, Backend, Frontend" />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Milestone detayları" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tutar</Label>
                <Input type="number" min={0} step={0.01} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>Para Birimi</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TRY</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vade Tarihi</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <Label>Sıra</Label>
                <Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
            </div>
            {editing && (
              <div>
                <Label>Durum</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Bekliyor</SelectItem>
                    <SelectItem value="approved">Onaylandı</SelectItem>
                    <SelectItem value="invoiced">Faturalandı</SelectItem>
                    <SelectItem value="paid">Ödendi</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
