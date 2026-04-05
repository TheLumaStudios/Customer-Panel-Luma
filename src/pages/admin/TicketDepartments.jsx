import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/lib/toast'
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react'

function generateSlug(name) {
  return name.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const departmentSchema = z.object({
  name: z.string().min(1, 'Departman adı zorunlu'),
  slug: z.string().min(1, 'Slug zorunlu').regex(/^[a-z0-9-]+$/, 'Sadece küçük harf, rakam ve tire'),
  description: z.string().optional(),
  email: z.string().email('Geçerli e-posta giriniz').or(z.literal('')).optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
})

export default function TicketDepartments() {
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)

  const form = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', slug: '', description: '', email: '', is_active: true, sort_order: 0 },
  })

  const fetchDepartments = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from('ticket_departments').select('*').order('sort_order')
    if (error) toast.error('Yüklenemedi', { description: error.message })
    else setDepartments(data || [])
    setIsLoading(false)
  }

  useEffect(() => { fetchDepartments() }, [])

  const handleCreate = () => {
    setEditingDepartment(null)
    form.reset({ name: '', slug: '', description: '', email: '', is_active: true, sort_order: departments.length })
    setDialogOpen(true)
  }

  const handleEdit = (dept) => {
    setEditingDepartment(dept)
    form.reset({
      name: dept.name || '',
      slug: dept.slug || '',
      description: dept.description || '',
      email: dept.email || '',
      is_active: dept.is_active ?? true,
      sort_order: dept.sort_order || 0,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data) => {
    try {
      if (editingDepartment) {
        const { error } = await supabase.from('ticket_departments').update(data).eq('id', editingDepartment.id)
        if (error) throw error
        toast.success('Departman güncellendi')
      } else {
        const { error } = await supabase.from('ticket_departments').insert(data)
        if (error) throw error
        toast.success('Departman oluşturuldu')
      }
      setDialogOpen(false)
      fetchDepartments()
    } catch (error) {
      toast.error('İşlem başarısız', { description: error.message })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu departmanı silmek istediğinizden emin misiniz?')) return
    try {
      const { error } = await supabase.from('ticket_departments').delete().eq('id', id)
      if (error) throw error
      toast.success('Departman silindi')
      fetchDepartments()
    } catch (error) {
      toast.error('Silme başarısız', { description: error.message })
    }
  }

  // İsim değiştiğinde slug otomatik oluştur (sadece yeni kayıtta)
  const watchName = form.watch('name')
  useEffect(() => {
    if (!editingDepartment && watchName) {
      form.setValue('slug', generateSlug(watchName))
    }
  }, [watchName, editingDepartment])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Destek Departmanları</h1>
          <p className="page-description">Destek talebi departmanlarını yönetin</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Departman
        </Button>
      </div>

      <Card className="rounded-xl shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Departman Listesi
          </CardTitle>
          <CardDescription>Toplam {departments.length} departman</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-t first:border-t-0">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${50 + Math.random() * 80}px` }} />
                  ))}
                </div>
              ))}
            </div>
          ) : departments.length === 0 ? (
            <div className="empty-state">
              <Building2 className="empty-state-icon" />
              <p className="empty-state-title">Henüz departman yok</p>
              <p className="empty-state-description">Yeni bir destek departmanı oluşturun</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6 w-8">Sıra</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right pr-6">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id} className="group">
                    <TableCell className="pl-6 text-muted-foreground text-sm">{dept.sort_order}</TableCell>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{dept.slug}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{dept.email || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{dept.description || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={dept.is_active ? 'active' : 'inactive'} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(dept)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(dept.id)}>
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
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[550px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? 'Departmanı Düzenle' : 'Yeni Departman'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departman Adı</FormLabel>
                      <FormControl><Input {...field} placeholder="Teknik Destek" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl><Input {...field} placeholder="teknik-destek" className="font-mono" readOnly={!!editingDepartment} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Bu departman hakkında kısa açıklama" className="min-h-[80px]" /></FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta</FormLabel>
                      <FormControl><Input {...field} type="email" placeholder="destek@lumayazilim.com" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sıralama</FormLabel>
                      <FormControl><Input {...field} type="number" /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Aktif</FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Kaydediliyor...' : editingDepartment ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
