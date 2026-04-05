import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { UserAvatar } from '@/components/ui/user-avatar'
import { toast } from 'sonner'
import { Pin, Trash2, Send } from 'lucide-react'

const noteSchema = z.object({
  content: z.string().min(1, 'Not içeriği zorunlu'),
})

export function InternalNotes({ entityType, entityId }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const form = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: '' },
  })

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('internal_notes')
      .select('*, author:profiles!internal_notes_author_id_fkey(full_name, email)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchNotes() }, [entityType, entityId])

  const onSubmit = async (data) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      // Parse @mentions from content
      const mentionRegex = /@(\w+)/g
      const mentions = [...data.content.matchAll(mentionRegex)].map(m => m[1])

      const { error } = await supabase.from('internal_notes').insert({
        entity_type: entityType,
        entity_id: entityId,
        author_id: user.id,
        content: data.content,
      })
      if (error) throw error
      form.reset()
      fetchNotes()
    } catch (err) {
      toast.error('Not eklenemedi', { description: err.message })
    }
  }

  const togglePin = async (noteId, isPinned) => {
    await supabase.from('internal_notes').update({ is_pinned: !isPinned }).eq('id', noteId)
    fetchNotes()
  }

  const deleteNote = async (noteId) => {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return
    await supabase.from('internal_notes').delete().eq('id', noteId)
    fetchNotes()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        İç Notlar
        <span className="text-xs text-muted-foreground font-normal">(Müşteri göremez)</span>
      </h3>

      {/* Add Note Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea {...field} placeholder="Not ekle... (@isim ile etiketle)" className="min-h-[60px] text-sm" />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" size="icon" className="h-[60px] w-10 flex-shrink-0" disabled={form.formState.isSubmitting}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Form>

      {/* Notes List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 border rounded-lg">
              <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse w-24" />
                <div className="h-3 bg-muted rounded animate-pulse w-full" />
              </div>
            </div>
          ))
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Henüz not yok</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className={`flex gap-3 p-3 rounded-lg border group ${note.is_pinned ? 'bg-amber-50/50 border-amber-200' : 'hover:bg-muted/30'}`}>
              <UserAvatar name={note.author?.full_name || note.author?.email || 'User'} size={28} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{note.author?.full_name || 'Bilinmeyen'}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(note.created_at), 'd MMM HH:mm', { locale: tr })}
                    </span>
                    {note.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePin(note.id, note.is_pinned)}>
                      <Pin className={`h-3 w-3 ${note.is_pinned ? 'text-amber-500' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteNote(note.id)}>
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{note.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
