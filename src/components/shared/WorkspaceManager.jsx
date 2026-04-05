import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { FolderOpen, Plus, Pencil, Trash2 } from 'lucide-react'

const workspaceSchema = z.object({
  name: z.string().min(1, 'Proje adı zorunlu'),
  description: z.string().optional(),
  color: z.string().default('#4F46E5'),
})

export function WorkspaceManager({ customerId, onSelect }) {
  const [workspaces, setWorkspaces] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const form = useForm({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: '', description: '', color: '#4F46E5' },
  })

  const fetch = async () => {
    const { data } = await supabase.from('workspaces').select('*').eq('customer_id', customerId).order('created_at')
    setWorkspaces(data || [])
    if (!activeId && data?.length > 0) {
      setActiveId(data[0].id)
      onSelect?.(data[0].id)
    }
  }

  useEffect(() => { if (customerId) fetch() }, [customerId])

  const generateSlug = (name) => name.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await supabase.from('workspaces').update({ name: data.name, description: data.description, color: data.color }).eq('id', editing.id)
        toast.success('Proje güncellendi')
      } else {
        await supabase.from('workspaces').insert({ customer_id: customerId, name: data.name, slug: generateSlug(data.name), description: data.description, color: data.color })
        toast.success('Proje oluşturuldu')
      }
      setDialogOpen(false)
      fetch()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return
    await supabase.from('workspaces').delete().eq('id', id)
    toast.success('Proje silindi')
    fetch()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Button
          variant={!activeId ? 'default' : 'outline'}
          size="sm" className="h-8 text-xs flex-shrink-0"
          onClick={() => { setActiveId(null); onSelect?.(null) }}
        >
          Tümü
        </Button>
        {workspaces.map((ws) => (
          <Button
            key={ws.id}
            variant={activeId === ws.id ? 'default' : 'outline'}
            size="sm" className="h-8 text-xs flex-shrink-0 gap-1.5 group"
            onClick={() => { setActiveId(ws.id); onSelect?.(ws.id) }}
          >
            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ws.color }} />
            {ws.name}
            <button
              className="opacity-0 group-hover:opacity-100 ml-1"
              onClick={(e) => { e.stopPropagation(); setEditing(ws); form.reset({ name: ws.name, description: ws.description || '', color: ws.color }); setDialogOpen(true) }}
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
          </Button>
        ))}
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 flex-shrink-0" onClick={() => { setEditing(null); form.reset({ name: '', description: '', color: '#4F46E5' }); setDialogOpen(true) }}>
          <Plus className="h-3 w-3" /> Proje Ekle
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[450px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Projeyi Düzenle' : 'Yeni Proje'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Proje Adı</FormLabel>
                  <FormControl><Input {...field} placeholder="SeferX Yemek" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl><Input {...field} placeholder="Proje hakkında kısa açıklama" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem>
                  <FormLabel>Renk</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <input type="color" {...field} className="h-9 w-12 rounded border cursor-pointer" />
                      <Input {...field} placeholder="#4F46E5" className="font-mono flex-1" />
                    </div>
                  </FormControl>
                </FormItem>
              )} />
              <div className="flex justify-between pt-2">
                {editing && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => { handleDelete(editing.id); setDialogOpen(false) }}>
                    Sil
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                  <Button type="submit">{editing ? 'Güncelle' : 'Oluştur'}</Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
