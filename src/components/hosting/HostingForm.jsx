import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomerCombobox } from '@/components/ui/customer-combobox'
import { useHostingPackages } from '@/hooks/useHostingPackages'
import { useServers } from '@/hooks/useServers'

const hostingSchema = z.object({
  package_name: z.string().min(1, 'Paket adı gerekli'),
  customer_id: z.string().min(1, 'Müşteri seçimi gerekli'),
  package_id: z.string().min(1, 'Hosting paketi seçimi gerekli'),
  server_id: z.string().optional().or(z.literal('')),
  disk_space_gb: z.coerce.number().min(1, 'Disk alanı gerekli'),
  bandwidth_gb: z.coerce.number().optional(),
  start_date: z.string().optional().or(z.literal('')).nullable(),
  expiration_date: z.string().optional().or(z.literal('')).nullable(),
  server_location: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'suspended', 'expired']).default('active'),
})

export default function HostingForm({ open, onOpenChange, hosting, customers, onSubmit, preselectedCustomerId }) {
  const { data: hostingPackages } = useHostingPackages()
  const { data: servers } = useServers()

  const [noStartDate, setNoStartDate] = useState(!hosting?.start_date)
  const [noExpirationDate, setNoExpirationDate] = useState(!hosting?.expiration_date)

  const getDefaultValues = () => ({
    package_name: hosting?.package_name || '',
    customer_id: hosting?.customer_id || preselectedCustomerId || '',
    package_id: hosting?.package_id || '',
    server_id: hosting?.server_id || '',
    disk_space_gb: hosting?.disk_space_gb || 10,
    bandwidth_gb: hosting?.bandwidth_gb || 100,
    start_date: hosting?.start_date || new Date().toISOString().split('T')[0],
    expiration_date: hosting?.expiration_date || '',
    server_location: hosting?.server_location || '',
    status: hosting?.status || 'active',
  })

  const form = useForm({
    resolver: zodResolver(hostingSchema),
    defaultValues: getDefaultValues(),
  })

  // Reset form when dialog opens or hosting data changes
  useEffect(() => {
    if (open) {
      const values = getDefaultValues()
      form.reset(values)
      setNoStartDate(!hosting?.start_date)
      setNoExpirationDate(!hosting?.expiration_date)
    }
  }, [open, hosting])

  const handleSubmit = async (data) => {
    try {
      // Convert to numbers and handle unlimited dates
      const formattedData = {
        package_name: data.package_name,
        customer_id: data.customer_id,
        package_id: data.package_id,
        server_id: data.server_id || null,
        disk_space_gb: Number(data.disk_space_gb),
        bandwidth_gb: Number(data.bandwidth_gb),
        start_date: noStartDate || !data.start_date ? null : data.start_date,
        expiration_date: noExpirationDate || !data.expiration_date ? null : data.expiration_date,
        server_location: data.server_location || null,
        status: data.status,
      }

      // Remove empty/null values for cleaner API call
      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === '' || formattedData[key] === undefined) {
          formattedData[key] = null
        }
      })

      console.log('Form submission data:', JSON.stringify(formattedData, null, 2))
      await onSubmit(formattedData)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Form submission error:', error)
      console.error('Error details:', error.response?.data)
      toast.error('Hosting paketi kaydedilemedi', {
        description: error.response?.data?.message || error.message
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {hosting ? 'Hosting Paketi Düzenle' : 'Yeni Hosting Paketi Ekle'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="package_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paket Adı</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Web Hosting Paketi" />
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
              name="package_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hosting Paketi</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Hosting paketi seçiniz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hostingPackages?.filter(pkg => pkg.is_active).map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.package_name} - {pkg.disk_space_gb}GB - {pkg.monthly_price}₺/ay
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Hosting paketlerini yönetmek için Hosting Paketleri sayfasını kullanın
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="server_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sunucu (Opsiyonel)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sunucu seçiniz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {servers?.filter(srv => srv.is_active).map((srv) => (
                        <SelectItem key={srv.id} value={srv.id}>
                          {srv.server_name} - {srv.hostname} ({srv.ip_address})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Hosting hesabının bulunduğu sunucuyu seçin
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="disk_space_gb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disk Alanı (GB)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bandwidth_gb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bant Genişliği (GB)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="server_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sunucu Konumu</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="İstanbul, Türkiye" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlangıç Tarihi</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        disabled={noStartDate}
                        value={noStartDate ? '' : field.value}
                      />
                    </FormControl>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={noStartDate}
                        onChange={(e) => {
                          setNoStartDate(e.target.checked)
                          if (e.target.checked) {
                            form.setValue('start_date', '')
                          } else {
                            form.setValue('start_date', new Date().toISOString().split('T')[0])
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <label className="text-sm text-muted-foreground">Sınırsız</label>
                    </div>
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
                      <Input
                        {...field}
                        type="date"
                        disabled={noExpirationDate}
                        value={noExpirationDate ? '' : field.value}
                      />
                    </FormControl>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={noExpirationDate}
                        onChange={(e) => {
                          setNoExpirationDate(e.target.checked)
                          if (e.target.checked) {
                            form.setValue('expiration_date', '')
                          } else {
                            const oneYearLater = new Date()
                            oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
                            form.setValue('expiration_date', oneYearLater.toISOString().split('T')[0])
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <label className="text-sm text-muted-foreground">Sınırsız</label>
                    </div>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçiniz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="suspended">Askıya Alınmış</SelectItem>
                      <SelectItem value="expired">Süresi Dolmuş</SelectItem>
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
                {hosting ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
