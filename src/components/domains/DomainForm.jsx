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
import { CustomerCombobox } from '@/components/ui/customer-combobox'

const domainSchema = z.object({
  domain_name: z.string().min(1, 'Domain adı gerekli'),
  customer_id: z.string().min(1, 'Müşteri seçimi gerekli'),
  registration_date: z.string().min(1, 'Kayıt tarihi gerekli'),
  expiration_date: z.string().min(1, 'Son kullanma tarihi gerekli'),
  auto_renewal: z.boolean().default(false),
  registrar: z.string().optional(),
  status: z.enum(['active', 'expired', 'pending']).default('active'),
})

export default function DomainForm({ open, onOpenChange, domain, customers, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      domain_name: domain?.domain_name || '',
      customer_id: domain?.customer_id || '',
      registration_date: domain?.registration_date || new Date().toISOString().split('T')[0],
      expiration_date: domain?.expiration_date || '',
      auto_renewal: domain?.auto_renewal || false,
      registrar: domain?.registrar || '',
      status: domain?.status || 'active',
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {domain ? 'Domain Düzenle' : 'Yeni Domain Ekle'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="domain_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain Adı</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ornek.com" />
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

            <FormField
              control={form.control}
              name="registrar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registrar</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="GoDaddy, Namecheap, vb." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registration_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kayıt Tarihi</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiration_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Son Kullanma Tarihi</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durum</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçiniz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="expired">Süresi Dolmuş</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="auto_renewal"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Otomatik Yenileme</FormLabel>
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
                {domain ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
