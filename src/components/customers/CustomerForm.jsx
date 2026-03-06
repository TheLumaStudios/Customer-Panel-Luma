import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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
import {
  User,
  Building2,
  Phone,
  Mail,
  Hash,
  MapPin,
  CreditCard,
  Globe,
  FileText,
  Truck
} from 'lucide-react'

const customerSchema = z.object({
  // Account Info
  customer_code: z.string().min(1, 'Müşteri kodu gerekli'),
  status: z.enum(['active', 'inactive']).default('active'),

  // Personal/Company Info
  full_name: z.string().min(1, 'Ad soyad gerekli'),
  company_name: z.string().optional(),
  tc_no: z.string().optional(),
  vkn: z.string().optional(),
  tax_office: z.string().optional(),

  // Contact Info
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z.string().optional(),
  fax: z.string().optional(),
  website: z.string().optional(),

  // Billing Address
  billing_address: z.string().optional(),
  billing_city: z.string().optional(),
  billing_district: z.string().optional(),
  billing_postal_code: z.string().optional(),
  billing_country: z.string().default('Türkiye'),

  // Shipping Address
  same_as_billing: z.boolean().default(true),
  shipping_address: z.string().optional(),
  shipping_city: z.string().optional(),
  shipping_district: z.string().optional(),
  shipping_postal_code: z.string().optional(),
  shipping_country: z.string().default('Türkiye'),

  // Notes
  notes: z.string().optional(),
})

export default function CustomerForm({ open, onOpenChange, customer, onSubmit }) {
  const [sameAsBilling, setSameAsBilling] = useState(customer?.same_as_billing ?? true)

  const getDefaultValues = () => ({
    customer_code: customer?.customer_code || `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
    status: customer?.status || 'active',
    full_name: customer?.full_name || customer?.profile?.full_name || '',
    company_name: customer?.company_name || customer?.profile?.company_name || '',
    tc_no: customer?.tc_no || customer?.profile?.tc_no || '',
    vkn: customer?.vkn || customer?.profile?.vkn || '',
    tax_office: customer?.tax_office || customer?.profile?.tax_office || '',
    email: customer?.email || customer?.profile?.email || '',
    phone: customer?.phone || customer?.profile?.phone || '',
    fax: customer?.fax || customer?.profile?.fax || '',
    website: customer?.website || customer?.profile?.website || '',
    billing_address: customer?.billing_address || '',
    billing_city: customer?.billing_city || '',
    billing_district: customer?.billing_district || '',
    billing_postal_code: customer?.billing_postal_code || '',
    billing_country: customer?.billing_country || 'Türkiye',
    same_as_billing: customer?.same_as_billing ?? true,
    shipping_address: customer?.shipping_address || '',
    shipping_city: customer?.shipping_city || '',
    shipping_district: customer?.shipping_district || '',
    shipping_postal_code: customer?.shipping_postal_code || '',
    shipping_country: customer?.shipping_country || 'Türkiye',
    notes: customer?.profile?.notes || '',
  })

  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: getDefaultValues(),
  })

  // Reset form when customer changes or modal opens
  useEffect(() => {
    if (open) {
      const values = getDefaultValues()
      form.reset(values)
      setSameAsBilling(customer?.same_as_billing ?? true)
    }
  }, [open, customer])

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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {customer ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}
          </DialogTitle>
          <DialogDescription>
            Müşteri bilgilerini doldurun. Tüm zorunlu alanlar (*) ile işaretlenmiştir.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Account Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Hesap Bilgileri</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Müşteri Kodu *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="CUST-12345" className="font-mono" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Benzersiz müşteri tanımlama kodu
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hesap Durumu *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Durum seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              Aktif
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-gray-400" />
                              Pasif
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Personal/Company Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Kişisel / Şirket Bilgileri</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad Soyad / Şirket Yetkili *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ahmet Yılmaz" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şirket Adı</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="ABC Teknoloji A.Ş." className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tc_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TC Kimlik No</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345678901" maxLength={11} className="font-mono" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Bireysel müşteriler için
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vkn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vergi Kimlik No (VKN)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="1234567890" maxLength={10} className="pl-10 font-mono" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Kurumsal müşteriler için
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_office"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vergi Dairesi</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Kadıköy" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">İletişim Bilgileri</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta Adresi *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="ornek@email.com"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Giriş ve bildirimler için kullanılacak
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder="0555 123 45 67"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fax</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0212 345 67 89" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder="www.example.com"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Billing Address Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Fatura Adresi</h3>
              </div>

              <FormField
                control={form.control}
                name="billing_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Cadde, sokak, bina no, daire no" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="billing_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İl</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="İstanbul" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billing_district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İlçe</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Kadıköy" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billing_postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posta Kodu</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="34000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billing_country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ülke</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Türkiye" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Shipping Address Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Sevkiyat Adresi</h3>
                </div>
                <FormField
                  control={form.control}
                  name="same_as_billing"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked)
                            setSameAsBilling(e.target.checked)
                          }}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 text-sm font-normal">Fatura adresi ile aynı</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {!sameAsBilling && (
                <>
                  <FormField
                    control={form.control}
                    name="shipping_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adres</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Cadde, sokak, bina no, daire no" rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="shipping_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İl</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="İstanbul" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shipping_district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İlçe</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Kadıköy" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shipping_postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posta Kodu</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="34000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shipping_country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ülke</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Türkiye" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Notlar</h3>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İç Notlar</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Müşteri hakkında özel notlar, hatırlatmalar..." rows={3} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Bu notlar sadece admin tarafından görülebilir
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                * Zorunlu alanlar
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="min-w-[100px]"
                >
                  İptal
                </Button>
                <Button type="submit" className="min-w-[100px]">
                  {customer ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
