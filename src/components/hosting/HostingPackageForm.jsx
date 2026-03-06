import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Package, DollarSign, HardDrive, Globe } from 'lucide-react'

const packageSchema = z.object({
  package_name: z.string().min(1, 'Paket adı gerekli'),
  package_code: z.string().min(1, 'Paket kodu gerekli').regex(/^[A-Z0-9_]+$/, 'Sadece büyük harf, rakam ve _ kullanın'),
  disk_space_gb: z.coerce.number().min(1, 'Disk alanı gerekli'),
  bandwidth_gb: z.coerce.number().min(-1, 'Bant genişliği gerekli (-1 = Sınırsız)'),
  email_accounts: z.coerce.number().min(-1, 'Email hesap sayısı gerekli (-1 = Sınırsız)'),
  databases: z.coerce.number().min(-1, 'Veritabanı sayısı gerekli (-1 = Sınırsız)'),
  ftp_accounts: z.coerce.number().min(-1, 'FTP hesap sayısı gerekli (-1 = Sınırsız)'),
  ssl_certificate: z.boolean().default(false),
  backup_frequency: z.enum(['none', 'daily', 'weekly', 'monthly']).default('weekly'),
  monthly_price: z.coerce.number().min(0, 'Aylık fiyat gerekli'),
  yearly_price: z.union([z.coerce.number(), z.literal('')]).optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().default(0),
})

export default function HostingPackageForm({ open, onOpenChange, packageData, onSubmit }) {
  const getDefaultValues = () => ({
    package_name: packageData?.package_name || '',
    package_code: packageData?.package_code || '',
    disk_space_gb: packageData?.disk_space_gb || 10,
    bandwidth_gb: packageData?.bandwidth_gb || 100,
    email_accounts: packageData?.email_accounts || 10,
    databases: packageData?.databases || 5,
    ftp_accounts: packageData?.ftp_accounts || 5,
    ssl_certificate: packageData?.ssl_certificate || false,
    backup_frequency: packageData?.backup_frequency || 'weekly',
    monthly_price: packageData?.monthly_price || 0,
    yearly_price: packageData?.yearly_price || 0,
    description: packageData?.description || '',
    is_active: packageData?.is_active ?? true,
    display_order: packageData?.display_order || 0,
  })

  const form = useForm({
    resolver: zodResolver(packageSchema),
    defaultValues: getDefaultValues(),
  })

  useEffect(() => {
    if (open) {
      const values = getDefaultValues()
      form.reset(values)
    }
  }, [open, packageData])

  const handleSubmit = async (data) => {
    try {
      // Convert to numbers
      const formattedData = {
        ...data,
        disk_space_gb: Number(data.disk_space_gb),
        bandwidth_gb: Number(data.bandwidth_gb),
        email_accounts: Number(data.email_accounts),
        databases: Number(data.databases),
        ftp_accounts: Number(data.ftp_accounts),
        monthly_price: Number(data.monthly_price),
        yearly_price: data.yearly_price ? Number(data.yearly_price) : null,
        display_order: Number(data.display_order),
      }

      await onSubmit(formattedData)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="h-6 w-6" />
            {packageData ? 'Hosting Paketi Düzenle' : 'Yeni Hosting Paketi Ekle'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Package className="h-4 w-4" />
                <h3 className="font-medium">Temel Bilgiler</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="package_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paket Adı *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Basic Hosting" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="package_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paket Kodu *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="BASIC" className="uppercase" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Sadece büyük harf, rakam ve _ (örn: BASIC, WEB_HOSTING_1)
                      </FormDescription>
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
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Paket açıklaması..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <HardDrive className="h-4 w-4" />
                <h3 className="font-medium">Kaynaklar</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="disk_space_gb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disk Alanı (GB) *</FormLabel>
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
                      <FormLabel>Bant Genişliği (GB) *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="100 (-1 = Sınırsız)" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        -1 = Sınırsız
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email_accounts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Hesapları *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="10" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        -1 = Sınırsız
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="databases"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veritabanları *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="5" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        -1 = Sınırsız
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ftp_accounts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FTP Hesapları *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="5" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        -1 = Sınırsız
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backup_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yedekleme Sıklığı</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Yedekleme sıklığı" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Yedekleme Yok</SelectItem>
                          <SelectItem value="daily">Günlük</SelectItem>
                          <SelectItem value="weekly">Haftalık</SelectItem>
                          <SelectItem value="monthly">Aylık</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ssl_certificate"
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
                    <FormLabel className="!mt-0">SSL Sertifikası Dahil</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <DollarSign className="h-4 w-4" />
                <h3 className="font-medium">Fiyatlandırma</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthly_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aylık Fiyat (₺) *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="49.90" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearly_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yıllık Fiyat (₺)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="499.00" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Boş bırakılırsa yıllık seçenek gösterilmez
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Globe className="h-4 w-4" />
                <h3 className="font-medium">Ayarlar</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="display_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sıralama</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Paketlerin görüntülenme sırası
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Aktif</FormLabel>
                      </div>
                      <FormDescription className="text-xs">
                        Paketin satışa açık olup olmadığı
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              <Button type="submit">
                {packageData ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
