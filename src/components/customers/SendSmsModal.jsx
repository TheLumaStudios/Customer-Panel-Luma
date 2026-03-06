import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send } from 'lucide-react'

const smsSchema = z.object({
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  message: z.string().min(1, 'Mesaj boş olamaz').max(160, 'Mesaj en fazla 160 karakter olabilir'),
})

export default function SendSmsModal({ open, onOpenChange, customer, onSubmit }) {
  const [charCount, setCharCount] = useState(0)

  const getDefaultValues = () => ({
    phone: customer?.profile?.phone || '',
    message: '',
  })

  const form = useForm({
    resolver: zodResolver(smsSchema),
    defaultValues: getDefaultValues(),
  })

  // Reset form when modal opens or customer changes
  useEffect(() => {
    if (open && customer) {
      const values = getDefaultValues()
      form.reset(values)
      setCharCount(0)
    }
  }, [open, customer])

  const handleMessageChange = (value) => {
    setCharCount(value.length)
    return value
  }

  const handleSubmit = async (data) => {
    try {
      await onSubmit(data)
      form.reset()
      setCharCount(0)
      onOpenChange(false)
    } catch (error) {
      console.error('SMS send error:', error)
    }
  }

  const insertTemplate = (template) => {
    const currentMessage = form.getValues('message')
    const newMessage = currentMessage + (currentMessage ? '\n' : '') + template
    form.setValue('message', newMessage)
    setCharCount(newMessage.length)
  }

  const templates = [
    { label: 'Domain Hatırlatma', text: 'Sayın müşterimiz, domain adınızın süresi dolmak üzere. Lütfen yenileme işlemini gerçekleştiriniz.' },
    { label: 'Fatura Hatırlatma', text: 'Sayın müşterimiz, ödenmemiş faturanız bulunmaktadır. Lütfen kontrol ediniz.' },
    { label: 'Hosting Hatırlatma', text: 'Sayın müşterimiz, hosting paketinizin süresi dolmak üzere. Lütfen yenileme işlemini gerçekleştiriniz.' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <MessageSquare className="h-6 w-6" />
            SMS Gönder
          </DialogTitle>
          <DialogDescription>
            {customer?.profile?.full_name || customer?.customer_code} için SMS gönder
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon Numarası *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="05XX XXX XX XX" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Müşterinin kayıtlı telefon numarası
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quick Templates */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Hızlı Şablonlar</label>
              <div className="flex flex-wrap gap-2">
                {templates.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate(template.text)}
                    className="text-xs"
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mesaj İçeriği *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="SMS mesajınızı buraya yazın..."
                      rows={6}
                      onChange={(e) => {
                        field.onChange(e)
                        handleMessageChange(e.target.value)
                      }}
                      className="resize-none"
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormDescription className="text-xs">
                      Türkçe karakter kullanabilirsiniz
                    </FormDescription>
                    <span className={`text-xs font-medium ${charCount > 160 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {charCount} / 160 karakter
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cost Estimation */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">SMS Adedi:</span>
                <span className="font-medium">{Math.ceil(charCount / 160) || 1} SMS</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tahmini Maliyet:</span>
                <span className="font-medium">{((Math.ceil(charCount / 160) || 1) * 0.05).toFixed(2)} ₺</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit" className="min-w-[120px]">
                <Send className="h-4 w-4 mr-2" />
                Gönder
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
