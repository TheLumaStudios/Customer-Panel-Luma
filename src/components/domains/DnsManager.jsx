import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { Globe, Plus, Pencil, Trash2 } from 'lucide-react'

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA']

const DEFAULT_FORM = {
  type: 'A',
  name: '',
  value: '',
  ttl: '3600',
  priority: '',
}

export default function DnsManager({ domainId, domainName }) {
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form, setForm] = useState({ ...DEFAULT_FORM })

  const fetchRecords = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('dns_records')
      .select('*')
      .eq('domain_id', domainId)
      .order('type')
    if (error) {
      toast.error('DNS kayıtları yüklenemedi', { description: error.message })
    } else {
      setRecords(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (domainId) {
      fetchRecords()
    }
  }, [domainId])

  const handleCreate = () => {
    setEditingRecord(null)
    setForm({ ...DEFAULT_FORM })
    setDialogOpen(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    setForm({
      type: record.type || 'A',
      name: record.name || '',
      value: record.value || '',
      ttl: String(record.ttl || 3600),
      priority: record.priority != null ? String(record.priority) : '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.value) {
      toast.error('Eksik bilgi', { description: 'Ad ve Değer alanları zorunludur' })
      return
    }

    const payload = {
      domain_id: domainId,
      type: form.type,
      name: form.name,
      value: form.value,
      ttl: parseInt(form.ttl, 10) || 3600,
      priority: form.priority ? parseInt(form.priority, 10) : null,
    }

    try {
      if (editingRecord) {
        const { error } = await supabase
          .from('dns_records')
          .update(payload)
          .eq('id', editingRecord.id)
        if (error) throw error
        toast.success('DNS kaydı güncellendi', { description: 'Değişiklikler başarıyla kaydedildi' })
      } else {
        const { error } = await supabase.from('dns_records').insert(payload)
        if (error) throw error
        toast.success('DNS kaydı oluşturuldu', { description: 'Yeni kayıt eklendi' })
      }
      setDialogOpen(false)
      fetchRecords()
    } catch (error) {
      toast.error('İşlem başarısız', { description: error.message })
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Bu DNS kaydını silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await supabase.from('dns_records').delete().eq('id', id)
        if (error) throw error
        toast.success('DNS kaydı silindi', { description: 'Kayıt sistemden kaldırıldı' })
        fetchRecords()
      } catch (error) {
        toast.error('Silme işlemi başarısız', { description: error.message })
      }
    }
  }

  const showPriority = ['MX', 'SRV'].includes(form.type)

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            DNS Yönetimi
          </CardTitle>
          <CardDescription>
            {domainName} - Toplam {records.length} kayıt
          </CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kayıt
        </Button>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Henüz DNS kaydı bulunmuyor.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tür</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead>Değer</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Badge variant="outline">{record.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell className="max-w-[250px] truncate">{record.value}</TableCell>
                  <TableCell>{record.ttl}</TableCell>
                  <TableCell>{record.priority ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'DNS Kaydını Düzenle' : 'Yeni DNS Kaydı'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Kayıt Türü</Label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm({ ...form, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Ad</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="@ veya subdomain"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Değer</Label>
              <Input
                id="value"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === 'A' ? '192.168.1.1' : 'Değer'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ttl">TTL (saniye)</Label>
                <Input
                  id="ttl"
                  type="number"
                  value={form.ttl}
                  onChange={(e) => setForm({ ...form, ttl: e.target.value })}
                />
              </div>
              {showPriority && (
                <div className="space-y-2">
                  <Label htmlFor="priority">Öncelik</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    placeholder="10"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSave}>
                {editingRecord ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
