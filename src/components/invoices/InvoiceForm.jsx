import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import { CustomerCombobox } from '@/components/ui/customer-combobox'
import { toast } from '@/lib/toast'

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Açıklama gerekli'),
  quantity: z.number().min(1, 'Miktar en az 1 olmalı'),
  unit_price: z.number().min(0, 'Birim fiyat gerekli'),
})

const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'Müşteri seçimi gerekli'),
  invoice_number: z.string().min(1, 'Fatura numarası gerekli'),
  invoice_date: z.string().min(1, 'Fatura tarihi gerekli'),
  due_date: z.string().min(1, 'Vade tarihi gerekli'),
  status: z.enum(['paid', 'pending', 'overdue', 'cancelled']).default('pending'),
  payment_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
})

export default function InvoiceForm({ open, onOpenChange, invoice, customers, onSubmit }) {
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: 0 }
  ])

  const getDefaultValues = () => ({
    customer_id: invoice?.customer_id || '',
    invoice_number: invoice?.invoice_number || '',
    invoice_date: invoice?.invoice_date || new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date || '',
    status: invoice?.status || 'pending',
    payment_date: invoice?.payment_date || '',
    notes: invoice?.notes || '',
  })

  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: getDefaultValues(),
  })

  // Reset form when dialog opens or invoice data changes
  useEffect(() => {
    if (open) {
      const values = getDefaultValues()
      form.reset(values)

      // Load invoice items or set default
      if (invoice?.invoice_items && invoice.invoice_items.length > 0) {
        setItems(invoice.invoice_items)
      } else {
        setItems([{ description: '', quantity: 1, unit_price: 0 }])
      }

      // Generate new invoice number only when creating
      if (!invoice) {
        form.setValue('invoice_number', `INV-${Date.now()}`)
      }
    }
  }, [open, invoice])

  const watchStatus = form.watch('status')

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.unit_price))
    }, 0)
  }

  const handleSubmit = async (data) => {
    try {
      // Validate items
      const validItems = items.filter(item => item.description && item.quantity && item.unit_price)

      if (validItems.length === 0) {
        toast.warning('En az bir fatura kalemi eklemelisiniz', {
          description: 'Lütfen faturaya en az bir kalem ekleyin'
        })
        return
      }

      const total = calculateTotal()

      const invoiceData = {
        customer_id: data.customer_id,
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        status: data.status,
        payment_date: data.status === 'paid' && data.payment_date ? data.payment_date : null,
        notes: data.notes || null,
        subtotal: total,
        total_amount: total,
        invoice_items: validItems.map(item => {
          const total = Number(item.quantity) * Number(item.unit_price)
          return {
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: total,
            total_price: total
          }
        })
      }

      await onSubmit(invoiceData)
      form.reset()
      setItems([{ description: '', quantity: 1, unit_price: 0 }])
      onOpenChange(false)
    } catch (error) {
      console.error('Form submission error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      toast.error('Fatura kaydedilemedi', {
        description: error.response?.data?.message || error.message
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? 'Fatura Düzenle' : 'Yeni Fatura Oluştur'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fatura Numarası</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="INV-12345" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Müşteri</FormLabel>
                    <FormControl>
                      <CustomerCombobox
                        customers={customers}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Ad, TC, telefon ile ara..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="invoice_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fatura Tarihi</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vade Tarihi</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durum</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Durum seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Beklemede</SelectItem>
                        <SelectItem value="paid">Ödendi</SelectItem>
                        <SelectItem value="overdue">Vadesi Geçmiş</SelectItem>
                        <SelectItem value="cancelled">İptal Edildi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchStatus === 'paid' && (
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ödeme Tarihi</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Fatura Kalemleri</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Kalem Ekle
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <Input
                        placeholder="Açıklama"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Adet"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Birim Fiyat"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)} ₺
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end">
                <div className="text-lg font-bold">
                  Toplam: {calculateTotal().toFixed(2)} ₺
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Ek notlar (opsiyonel)" rows={3} />
                  </FormControl>
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
                {invoice ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
