import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  useAllAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from '@/hooks/useAnnouncements'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/lib/toast'
import { Megaphone, Plus, Pencil, Trash2, AlertTriangle, Info, AlertOctagon, Wrench } from 'lucide-react'

const typeConfig = {
  info: { label: 'Bilgi', icon: Info, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  warning: { label: 'Uyarı', icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  critical: { label: 'Kritik', icon: AlertOctagon, color: 'bg-red-50 text-red-700 border-red-200' },
  maintenance: { label: 'Bakım', icon: Wrench, color: 'bg-slate-50 text-slate-700 border-slate-200' },
}

const announcementSchema = z.object({
  title: z.string().min(1, 'Başlık zorunlu'),
  content: z.string().min(1, 'İçerik zorunlu'),
  type: z.enum(['info', 'warning', 'critical', 'maintenance']).default('info'),
  is_active: z.boolean().default(true),
  show_on_login: z.boolean().default(false),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

export default function Announcements() {
  const { data: announcements, isLoading } = useAllAnnouncements()
  const createAnnouncement = useCreateAnnouncement()
  const updateAnnouncement = useUpdateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const form = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '', type: 'info', is_active: true, show_on_login: false, starts_at: '', ends_at: '' },
  })

  const handleCreate = () => {
    setEditing(null)
    form.reset({ title: '', content: '', type: 'info', is_active: true, show_on_login: false, starts_at: '', ends_at: '' })
    setDialogOpen(true)
  }

  const handleEdit = (a) => {
    setEditing(a)
    form.reset({
      title: a.title || '',
      content: a.content || '',
      type: a.type || 'info',
      is_active: a.is_active ?? true,
      show_on_login: a.show_on_login ?? false,
      starts_at: a.starts_at ? a.starts_at.slice(0, 16) : '',
      ends_at: a.ends_at ? a.ends_at.slice(0, 16) : '',
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : new Date().toISOString(),
      ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
    }
    try {
      if (editing) {
        await updateAnnouncement.mutateAsync({ id: editing.id, data: payload })
        toast.success('Duyuru güncellendi')
      } else {
        await createAnnouncement.mutateAsync(payload)
        toast.success('Duyuru oluşturuldu')
      }
      setDialogOpen(false)
    } catch (error) {
      toast.error('İşlem başarısız', { description: error.message })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return
    try {
      await deleteAnnouncement.mutateAsync(id)
      toast.success('Duyuru silindi')
    } catch (error) {
      toast.error('Silme başarısız', { description: error.message })
    }
  }

  const formatDate = (d) => {
    if (!d) return '-'
    try { return format(new Date(d), 'd MMM yyyy HH:mm', { locale: tr }) }
    catch { return '-' }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Duyurular</h1>
          <p className="page-description">Sistem duyurularını görüntüleyin ve yönetin</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Duyuru
        </Button>
      </div>

      <Card className="rounded-xl shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5" />
            Duyuru Listesi
          </CardTitle>
          <CardDescription>Toplam {announcements?.length || 0} duyuru</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-t first:border-t-0">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${50 + Math.random() * 80}px` }} />
                  ))}
                </div>
              ))}
            </div>
          ) : !announcements?.length ? (
            <div className="empty-state">
              <Megaphone className="empty-state-icon" />
              <p className="empty-state-title">Henüz duyuru yok</p>
              <p className="empty-state-description">Yeni bir duyuru oluşturun</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Başlık</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Giriş Ekranı</TableHead>
                  <TableHead>Tarih Aralığı</TableHead>
                  <TableHead className="text-right pr-6">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements?.map((a) => {
                  const tc = typeConfig[a.type] || typeConfig.info
                  const TypeIcon = tc.icon
                  return (
                    <TableRow key={a.id} className="group">
                      <TableCell className="pl-6 font-medium">{a.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${tc.color}`}>
                          <TypeIcon className="h-3 w-3" />
                          {tc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={a.is_active ? 'active' : 'inactive'} />
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs ${a.show_on_login ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                          {a.show_on_login ? 'Evet' : 'Hayır'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          <div>{formatDate(a.starts_at)}</div>
                          {a.ends_at && <div>→ {formatDate(a.ends_at)}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(a)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(a.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[650px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Duyuruyu Düzenle' : 'Yeni Duyuru'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlık</FormLabel>
                    <FormControl><Input {...field} placeholder="Planlı bakım çalışması" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İçerik</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Duyuru detayları..." className="min-h-[120px]" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tür</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="info">Bilgi</SelectItem>
                          <SelectItem value="warning">Uyarı</SelectItem>
                          <SelectItem value="critical">Kritik</SelectItem>
                          <SelectItem value="maintenance">Bakım</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="starts_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlangıç</FormLabel>
                      <FormControl><Input {...field} type="datetime-local" /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ends_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bitiş</FormLabel>
                      <FormControl><Input {...field} type="datetime-local" /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-6">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="font-normal cursor-pointer">Aktif</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="show_on_login"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="font-normal cursor-pointer">Giriş ekranında göster</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
