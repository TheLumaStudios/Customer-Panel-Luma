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
import { Server, Lock, MapPin, Settings } from 'lucide-react'

const serverSchema = z.object({
  server_name: z.string().min(1, 'Sunucu adı gerekli'),
  hostname: z.string().min(1, 'Hostname gerekli'),
  ip_address: z.string().min(1, 'IP adresi gerekli'),
  server_type: z.enum(['cpanel', 'plesk', 'directadmin', 'custom']).default('cpanel'),
  port: z.coerce.number().default(2087),
  username: z.string().optional(),
  password: z.string().optional(),
  access_hash: z.string().optional(),
  api_token: z.string().optional(),
  datacenter: z.string().optional(),
  country: z.string().default('Türkiye'),
  max_accounts: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
})

export default function ServerForm({ open, onOpenChange, server, onSubmit }) {
  const getDefaultValues = () => ({
    server_name: server?.server_name || '',
    hostname: server?.hostname || '',
    ip_address: server?.ip_address || '',
    server_type: server?.server_type || 'cpanel',
    port: server?.port || 2087,
    username: server?.username || '',
    password: server?.password || '',
    access_hash: server?.access_hash || '',
    api_token: server?.api_token || '',
    datacenter: server?.datacenter || '',
    country: server?.country || 'Türkiye',
    max_accounts: server?.max_accounts || 0,
    is_active: server?.is_active ?? true,
    notes: server?.notes || '',
  })

  const form = useForm({
    resolver: zodResolver(serverSchema),
    defaultValues: getDefaultValues(),
  })

  useEffect(() => {
    if (open) {
      const values = getDefaultValues()
      form.reset(values)
    }
  }, [open, server])

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Server className="h-6 w-6" />
            {server ? 'Sunucu Düzenle' : 'Yeni Sunucu Ekle'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Server className="h-4 w-4" />
                <h3 className="font-medium">Temel Bilgiler</h3>
              </div>

              <FormField
                control={form.control}
                name="server_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sunucu Adı *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Server 1 - İstanbul" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hostname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hostname *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="server1.example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ip_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Adresi *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="185.123.45.67" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="server_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sunucu Tipi</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sunucu tipi seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cpanel">cPanel/WHM</SelectItem>
                          <SelectItem value="plesk">Plesk</SelectItem>
                          <SelectItem value="directadmin">DirectAdmin</SelectItem>
                          <SelectItem value="custom">Özel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="2087" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        cPanel: 2087, Plesk: 8443
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Access Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Lock className="h-4 w-4" />
                <h3 className="font-medium">Erişim Bilgileri</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kullanıcı Adı</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="root" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        WHM/root kullanıcı adı
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="••••••••" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Root şifresi
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="access_hash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Hash / API Key</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="WHM access hash veya API key" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      API çağrıları için access hash
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="api_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Token</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="API token" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <MapPin className="h-4 w-4" />
                <h3 className="font-medium">Konum</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="datacenter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datacenter</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="İstanbul DC" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
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

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Settings className="h-4 w-4" />
                <h3 className="font-medium">Ayarlar</h3>
              </div>

              <FormField
                control={form.control}
                name="max_accounts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maksimum Hesap Sayısı</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="0" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      0 = Sınırsız
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
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
                    <FormLabel className="!mt-0">Aktif (yeni hesap kabul eder)</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Sunucu hakkında notlar..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {server ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
