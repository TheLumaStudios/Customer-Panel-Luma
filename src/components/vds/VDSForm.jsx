import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { useServers } from '@/hooks/useServers'

const vdsSchema = z.object({
  vds_name: z.string().min(1, 'VDS adı gerekli'),
  customer_id: z.string().min(1, 'Müşteri seçimi gerekli'),
  server_id: z.string().optional().or(z.literal('')),
  vds_type: z.enum(['VDS', 'VPS', 'Dedicated']).default('VDS'),
  cpu_cores: z.coerce.number().min(1, 'CPU core sayısı gerekli'),
  ram_gb: z.coerce.number().min(1, 'RAM gerekli'),
  disk_space_gb: z.coerce.number().min(1, 'Disk alanı gerekli'),
  bandwidth_gb: z.coerce.number().optional(),
  ip_address: z.string().optional().or(z.literal('')),
  operating_system: z.string().optional().or(z.literal('')),
  control_panel: z.string().optional().or(z.literal('')),
  username: z.string().optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  root_password: z.string().optional().or(z.literal('')),
  ssh_port: z.coerce.number().optional(),
  control_panel_url: z.string().optional().or(z.literal('')),
  control_panel_username: z.string().optional().or(z.literal('')),
  control_panel_password: z.string().optional().or(z.literal('')),
  vnc_port: z.coerce.number().optional(),
  vnc_password: z.string().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')).nullable(),
  expiration_date: z.string().optional().or(z.literal('')).nullable(),
  billing_cycle: z.enum(['monthly', 'yearly', 'quarterly', 'one-time']).default('monthly'),
  monthly_price: z.coerce.number().optional(),
  yearly_price: z.coerce.number().optional(),
  setup_fee: z.coerce.number().optional(),
  status: z.enum(['active', 'suspended', 'expired', 'terminated']).default('active'),
  notes: z.string().optional().or(z.literal('')),
})

export default function VDSForm({ open, onOpenChange, vds, customers, onSubmit }) {
  const { data: servers } = useServers()

  const [noStartDate, setNoStartDate] = useState(!vds?.start_date)
  const [noExpirationDate, setNoExpirationDate] = useState(!vds?.expiration_date)

  const getDefaultValues = () => ({
    vds_name: vds?.vds_name || '',
    customer_id: vds?.customer_id || '',
    server_id: vds?.server_id || '',
    vds_type: vds?.vds_type || 'VDS',
    cpu_cores: vds?.cpu_cores || 2,
    ram_gb: vds?.ram_gb || 4,
    disk_space_gb: vds?.disk_space_gb || 50,
    bandwidth_gb: vds?.bandwidth_gb || -1,
    ip_address: vds?.ip_address || '',
    operating_system: vds?.operating_system || '',
    control_panel: vds?.control_panel || 'None',
    username: vds?.username || '',
    password: vds?.password || '',
    root_password: vds?.root_password || '',
    ssh_port: vds?.ssh_port || 22,
    control_panel_url: vds?.control_panel_url || '',
    control_panel_username: vds?.control_panel_username || '',
    control_panel_password: vds?.control_panel_password || '',
    vnc_port: vds?.vnc_port || null,
    vnc_password: vds?.vnc_password || '',
    start_date: vds?.start_date || new Date().toISOString().split('T')[0],
    expiration_date: vds?.expiration_date || '',
    billing_cycle: vds?.billing_cycle || 'monthly',
    monthly_price: vds?.monthly_price || 0,
    yearly_price: vds?.yearly_price || 0,
    setup_fee: vds?.setup_fee || 0,
    status: vds?.status || 'active',
    notes: vds?.notes || '',
  })

  const form = useForm({
    resolver: zodResolver(vdsSchema),
    defaultValues: getDefaultValues(),
  })

  useEffect(() => {
    if (open) {
      const values = getDefaultValues()
      form.reset(values)
      setNoStartDate(!vds?.start_date)
      setNoExpirationDate(!vds?.expiration_date)
    }
  }, [open, vds])

  const handleSubmit = async (data) => {
    try {
      const formattedData = {
        vds_name: data.vds_name,
        customer_id: data.customer_id,
        server_id: data.server_id || null,
        vds_type: data.vds_type,
        cpu_cores: Number(data.cpu_cores),
        ram_gb: Number(data.ram_gb),
        disk_space_gb: Number(data.disk_space_gb),
        bandwidth_gb: Number(data.bandwidth_gb),
        ip_address: data.ip_address || null,
        operating_system: data.operating_system || null,
        control_panel: data.control_panel || null,
        username: data.username || null,
        password: data.password || null,
        root_password: data.root_password || null,
        ssh_port: data.ssh_port || 22,
        control_panel_url: data.control_panel_url || null,
        control_panel_username: data.control_panel_username || null,
        control_panel_password: data.control_panel_password || null,
        vnc_port: data.vnc_port || null,
        vnc_password: data.vnc_password || null,
        start_date: noStartDate || !data.start_date ? null : data.start_date,
        expiration_date: noExpirationDate || !data.expiration_date ? null : data.expiration_date,
        billing_cycle: data.billing_cycle || 'monthly',
        monthly_price: Number(data.monthly_price) || 0,
        yearly_price: Number(data.yearly_price) || 0,
        setup_fee: Number(data.setup_fee) || 0,
        status: data.status,
        notes: data.notes || null,
      }

      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === '' || formattedData[key] === undefined) {
          formattedData[key] = null
        }
      })

      await onSubmit(formattedData)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Form gönderme hatası', {
        description: error.response?.data?.message || error.message
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vds ? 'VDS Düzenle' : 'Yeni VDS Ekle'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-medium border-b pb-2">Temel Bilgiler</h3>

              <FormField
                control={form.control}
                name="vds_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VDS Adı *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Production Server 1" />
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
                    <FormLabel>Müşteri *</FormLabel>
                    <FormControl>
                      <CustomerCombobox
                        customers={customers}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Müşteri seçiniz..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vds_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sunucu Tipi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="VDS">VDS</SelectItem>
                          <SelectItem value="VPS">VPS</SelectItem>
                          <SelectItem value="Dedicated">Dedicated Server</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="server_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiziksel Sunucu</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sunucu seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {servers?.filter(srv => srv.is_active).map((srv) => (
                            <SelectItem key={srv.id} value={srv.id}>
                              {srv.server_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Server Specs */}
            <div className="space-y-4">
              <h3 className="font-medium border-b pb-2">Sunucu Özellikleri</h3>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cpu_cores"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPU Core *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ram_gb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RAM (GB) *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="disk_space_gb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disk (GB) *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bandwidth_gb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bant Genişliği (GB/ay)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="-1 (Sınırsız)" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      -1 = Sınırsız
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Network & OS */}
            <div className="space-y-4">
              <h3 className="font-medium border-b pb-2">Ağ & İşletim Sistemi</h3>

              <FormField
                control={form.control}
                name="ip_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Adresi</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="192.168.1.1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="operating_system"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İşletim Sistemi</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ubuntu 22.04" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="control_panel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontrol Paneli</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="None">Yok</SelectItem>
                          <SelectItem value="cPanel">cPanel</SelectItem>
                          <SelectItem value="Plesk">Plesk</SelectItem>
                          <SelectItem value="DirectAdmin">DirectAdmin</SelectItem>
                          <SelectItem value="Other">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Access */}
            <div className="space-y-4">
              <h3 className="font-medium border-b pb-2">Erişim Bilgileri</h3>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kullanıcı Adı</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="admin" />
                      </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="root_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Root Şifresi</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="••••••••" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ssh_port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SSH Port</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="22" />
                      </FormControl>
                      <FormDescription>Varsayılan: 22</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vnc_port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VNC Port</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="5900" />
                      </FormControl>
                      <FormDescription>Opsiyonel</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="vnc_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VNC Şifresi</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-medium">Kontrol Paneli Bilgileri (Opsiyonel)</h4>
                <FormField
                  control={form.control}
                  name="control_panel_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Panel URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://panel.example.com" />
                      </FormControl>
                      <FormDescription>SolusVM, Virtualizor vb. panel adresi</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="control_panel_username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Panel Kullanıcı Adı</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="admin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="control_panel_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Panel Şifresi</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••••" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Dates & Pricing */}
            <div className="space-y-4">
              <h3 className="font-medium border-b pb-2">Tarihler & Fiyatlandırma</h3>

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
                            form.setValue('start_date', e.target.checked ? '' : new Date().toISOString().split('T')[0])
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
                      <FormLabel>Bitiş Tarihi</FormLabel>
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
                            if (!e.target.checked) {
                              const oneYearLater = new Date()
                              oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
                              form.setValue('expiration_date', oneYearLater.toISOString().split('T')[0])
                            } else {
                              form.setValue('expiration_date', '')
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
                name="billing_cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faturalama Dönemi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Dönem seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Aylık</SelectItem>
                        <SelectItem value="yearly">Yıllık</SelectItem>
                        <SelectItem value="quarterly">3 Aylık</SelectItem>
                        <SelectItem value="one-time">Tek Seferlik</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="monthly_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aylık Fiyat (₺)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Aylık/3 Aylık için
                      </FormDescription>
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
                        <Input {...field} type="number" step="0.01" placeholder="0.00" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Yıllık faturalama için
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="setup_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kurulum Ücreti (₺)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Tek seferlik ücret
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Status & Notes */}
            <div className="space-y-4">
              <h3 className="font-medium border-b pb-2">Durum & Notlar</h3>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durum</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="suspended">Askıya Alınmış</SelectItem>
                        <SelectItem value="expired">Süresi Dolmuş</SelectItem>
                        <SelectItem value="terminated">Sonlandırılmış</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Textarea {...field} rows={3} placeholder="Notlar..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit">
                {vds ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
