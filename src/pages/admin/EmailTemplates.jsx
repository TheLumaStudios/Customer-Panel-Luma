import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/lib/toast'
import { Mail, Plus, Pencil, Trash2 } from 'lucide-react'

const templateSchema = z.object({
  name: z.string().min(1, 'Şablon adı zorunlu'),
  template_key: z.string().min(1, 'Şablon anahtarı zorunlu').regex(/^[a-z0-9_]+$/, 'Sadece küçük harf, rakam ve alt çizgi'),
  subject: z.string().min(1, 'Konu zorunlu'),
  body_html: z.string().min(1, 'HTML içerik zorunlu'),
  variables: z.string().optional(),
  is_active: z.boolean().default(true),
})

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', template_key: '', subject: '', body_html: '', variables: '', is_active: true },
  })

  const fetchTemplates = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      toast.error('Şablonlar yüklenemedi', { description: error.message })
    } else {
      setTemplates(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  const handleCreate = () => {
    setEditingTemplate(null)
    form.reset({ name: '', template_key: '', subject: '', body_html: '', variables: '', is_active: true })
    setDialogOpen(true)
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    form.reset({
      name: template.name || '',
      template_key: template.template_key || '',
      subject: template.subject || '',
      body_html: template.body_html || '',
      variables: Array.isArray(template.variables) ? template.variables.join(', ') : '',
      is_active: template.is_active ?? true,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      variables: data.variables ? data.variables.split(',').map((v) => v.trim()).filter(Boolean) : [],
    }

    try {
      if (editingTemplate) {
        const { error } = await supabase.from('email_templates').update(payload).eq('id', editingTemplate.id)
        if (error) throw error
        toast.success('Şablon güncellendi')
      } else {
        const { error } = await supabase.from('email_templates').insert(payload)
        if (error) throw error
        toast.success('Şablon oluşturuldu')
      }
      setDialogOpen(false)
      fetchTemplates()
    } catch (error) {
      toast.error('İşlem başarısız', { description: error.message })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return
    try {
      const { error } = await supabase.from('email_templates').delete().eq('id', id)
      if (error) throw error
      toast.success('Şablon silindi')
      fetchTemplates()
    } catch (error) {
      toast.error('Silme başarısız', { description: error.message })
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">E-posta Şablonları</h1>
          <p className="page-description">Sistem e-posta şablonlarını görüntüleyin ve yönetin</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Şablon
        </Button>
      </div>

      <Card className="rounded-xl shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Şablon Listesi
          </CardTitle>
          <CardDescription>Toplam {templates.length} e-posta şablonu</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-t first:border-t-0">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 100}px` }} />
                  ))}
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="empty-state">
              <Mail className="empty-state-icon" />
              <p className="empty-state-title">Henüz şablon yok</p>
              <p className="empty-state-description">Yeni bir e-posta şablonu oluşturun</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6">Ad</TableHead>
                  <TableHead>Anahtar</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right pr-6">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="pl-6 font-medium">{t.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{t.template_key}</code>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">{t.subject}</TableCell>
                    <TableCell>
                      <StatusBadge status={t.is_active ? 'active' : 'inactive'} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(t.id)}>
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
        <DialogContent className="w-[700px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şablon Adı</FormLabel>
                      <FormControl><Input {...field} placeholder="Fatura Hatırlatma" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="template_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şablon Anahtarı</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="invoice_reminder" readOnly={!!editingTemplate} className={editingTemplate ? 'bg-muted' : 'font-mono'} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konu</FormLabel>
                    <FormControl><Input {...field} placeholder="Faturanız oluşturuldu - {{invoice_number}}" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body_html"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTML İçerik</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="<html>...</html>" className="min-h-[200px] font-mono text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="variables"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Değişkenler</FormLabel>
                    <FormControl><Input {...field} placeholder="customer_name, invoice_number, amount" className="font-mono text-sm" /></FormControl>
                    <FormDescription>Virgülle ayırın. Şablonda {'{{degisken}}'} olarak kullanılır.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  {form.formState.isSubmitting ? 'Kaydediliyor...' : editingTemplate ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
