import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ticketSchema = z.object({
  department_id: z.string().optional(),
  subject: z.string().min(3, 'Konu en az 3 karakter olmalı'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalı'),
  category: z.string().min(1, 'Kategori seçimi gerekli'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
})

export default function CustomerTicketForm({ open, onOpenChange, onSubmit }) {
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase
        .from('ticket_departments')
        .select('*')
        .order('name')
      if (data) setDepartments(data)
    }
    fetchDepartments()
  }, [])

  const form = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      department_id: '',
      subject: '',
      description: '',
      category: '',
      priority: 'medium',
    },
  })

  const handleSubmit = async (data) => {
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Yeni Destek Talebi Oluştur</DialogTitle>
          <DialogDescription>
            Sorunuzu detaylı bir şekilde açıklayın, en kısa sürede size dönüş yapacağız.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {departments.length > 0 && (
              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departman</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Departman seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçiniz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technical">Teknik Destek</SelectItem>
                      <SelectItem value="billing">Faturalama</SelectItem>
                      <SelectItem value="sales">Satış</SelectItem>
                      <SelectItem value="general">Genel</SelectItem>
                      <SelectItem value="hosting">Hosting Sorunu</SelectItem>
                      <SelectItem value="vds">VDS/VPS Sorunu</SelectItem>
                      <SelectItem value="domain">Domain Sorunu</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konu</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Örn: Web siteme erişemiyorum" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Sorunun detaylarını mümkün olduğunca açıklayıcı bir şekilde yazın..."
                      rows={8}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Öncelik</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Öncelik seçiniz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Düşük - Acil değil</SelectItem>
                      <SelectItem value="medium">Orta - Normal</SelectItem>
                      <SelectItem value="high">Yüksek - Önemli</SelectItem>
                      <SelectItem value="urgent">Acil - Hemen çözüm gerekli</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit">
                Talep Oluştur
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
