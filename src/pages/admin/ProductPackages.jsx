import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProductPackages, useCreateProductPackage, useUpdateProductPackage, useDeleteProductPackage } from '@/hooks/useProductPackages'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { StatusBadge } from '@/components/ui/status-badge'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const PRODUCT_TYPES = [
  { value: 'vds', label: 'VDS' },
  { value: 'vps', label: 'VPS' },
  { value: 'dedicated', label: 'Dedicated' },
  { value: 'cpanel_hosting', label: 'cPanel Hosting' },
  { value: 'plesk_hosting', label: 'Plesk Hosting' },
  { value: 'reseller_hosting', label: 'Reseller Hosting' },
]

const HOSTING_TYPES = ['cpanel_hosting', 'plesk_hosting', 'reseller_hosting']

const packageSchema = z.object({
  name: z.string().min(1, 'Paket adı zorunlu'),
  slug: z.string().optional(),
  description: z.string().optional(),
  product_type: z.string().min(1, 'Ürün tipi zorunlu'),
  cpu_cores: z.coerce.number().optional(),
  cpu_model: z.string().optional(),
  ram_gb: z.coerce.number().optional(),
  ram_type: z.string().optional(),
  disk_gb: z.coerce.number().optional(),
  disk_type: z.string().optional(),
  bandwidth: z.string().optional(),
  domains_allowed: z.coerce.number().optional(),
  email_accounts: z.string().optional(),
  databases: z.string().optional(),
  cost_monthly: z.coerce.number().min(0, 'Maliyet 0 veya üzeri olmalı'),
  price_monthly: z.coerce.number().min(0, 'Fiyat 0 veya üzeri olmalı'),
  price_original: z.coerce.number().optional(),
  price_quarterly: z.coerce.number().optional(),
  price_semi_annual: z.coerce.number().optional(),
  price_annual: z.coerce.number().optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  badge_text: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  tax_included: z.boolean().default(false),
  features: z.string().optional(),
})

const emptyFormValues = {
  name: '',
  slug: '',
  description: '',
  product_type: 'vds',
  cpu_cores: '',
  cpu_model: '',
  ram_gb: '',
  ram_type: '',
  disk_gb: '',
  disk_type: '',
  bandwidth: '',
  domains_allowed: '',
  email_accounts: '',
  databases: '',
  cost_monthly: '',
  price_monthly: '',
  price_original: '',
  price_quarterly: '',
  price_semi_annual: '',
  price_annual: '',
  is_featured: false,
  is_active: true,
  badge_text: '',
  sort_order: 0,
  features: '',
  tax_included: false,
}

function profitMargin(price, cost) {
  if (!price || !cost || price === 0) return '-'
  return ((price - cost) / price * 100).toFixed(1) + '%'
}

export default function ProductPackages() {
  const [activeTab, setActiveTab] = useState('vds')
  const { data: packages, isLoading, error } = useProductPackages(activeTab)
  const createPackage = useCreateProductPackage()
  const updatePackage = useUpdateProductPackage()
  const deletePackage = useDeleteProductPackage()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)

  const form = useForm({
    resolver: zodResolver(packageSchema),
    defaultValues: emptyFormValues,
  })

  const watchProductType = form.watch('product_type')
  const watchPriceMonthly = form.watch('price_monthly')
  const watchCostMonthly = form.watch('cost_monthly')
  const isHostingType = HOSTING_TYPES.includes(watchProductType)

  const handleCreate = () => {
    setEditingPackage(null)
    form.reset({ ...emptyFormValues, product_type: activeTab })
    setDialogOpen(true)
  }

  const handleEdit = (pkg) => {
    setEditingPackage(pkg)
    const featuresText = Array.isArray(pkg.features)
      ? pkg.features.join('\n')
      : ''
    form.reset({
      name: pkg.name || '',
      slug: pkg.slug || '',
      description: pkg.description || '',
      product_type: pkg.product_type || 'vds',
      cpu_cores: pkg.cpu_cores ?? '',
      cpu_model: pkg.cpu_model || '',
      ram_gb: pkg.ram_gb ?? '',
      ram_type: pkg.ram_type || '',
      disk_gb: pkg.disk_gb ?? '',
      disk_type: pkg.disk_type || '',
      bandwidth: pkg.bandwidth ?? '',
      domains_allowed: pkg.domains_allowed ?? '',
      email_accounts: pkg.email_accounts ?? '',
      databases: pkg.databases ?? '',
      cost_monthly: pkg.cost_monthly ?? '',
      price_monthly: pkg.price_monthly ?? '',
      price_original: pkg.price_original ?? '',
      price_quarterly: pkg.price_quarterly ?? '',
      price_semi_annual: pkg.price_semi_annual ?? '',
      price_annual: pkg.price_annual ?? '',
      is_featured: pkg.is_featured || false,
      is_active: pkg.is_active ?? true,
      badge_text: pkg.badge_text || '',
      sort_order: pkg.sort_order ?? 0,
      features: featuresText,
      tax_included: pkg.tax_included || false,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data) => {
    const featuresArray = data.features
      ? data.features.split('\n').map(f => f.trim()).filter(f => f.length > 0)
      : []

    const payload = {
      name: data.name,
      description: data.description || null,
      product_type: data.product_type,
      cpu_cores: data.cpu_cores || null,
      cpu_model: data.cpu_model || null,
      ram_gb: data.ram_gb || null,
      ram_type: data.ram_type || null,
      disk_gb: data.disk_gb || null,
      disk_type: data.disk_type || null,
      bandwidth: data.bandwidth ? Number(data.bandwidth) : null,
      domains_allowed: data.domains_allowed || null,
      email_accounts: data.email_accounts ? Number(data.email_accounts) : null,
      databases: data.databases ? Number(data.databases) : null,
      cost_monthly: data.cost_monthly || null,
      price_monthly: data.price_monthly || null,
      price_original: data.price_original || null,
      price_quarterly: data.price_quarterly || null,
      price_semi_annual: data.price_semi_annual || null,
      price_annual: data.price_annual || null,
      is_featured: data.is_featured,
      is_active: data.is_active,
      badge_text: data.badge_text || null,
      sort_order: data.sort_order || 0,
      features: featuresArray.length > 0 ? featuresArray : null,
      tax_included: data.tax_included,
    }

    try {
      if (editingPackage) {
        await updatePackage.mutateAsync({ id: editingPackage.id, data: payload })
        toast.success('Paket güncellendi', { description: 'Değişiklikler başarıyla kaydedildi' })
      } else {
        await createPackage.mutateAsync(payload)
        toast.success('Paket oluşturuldu', { description: 'Yeni ürün paketi sisteme eklendi' })
      }
      setDialogOpen(false)
    } catch (err) {
      console.error('Error:', err)
      toast.error('İşlem başarısız', { description: err.message })
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Bu ürün paketini silmek istediğinizden emin misiniz?')) {
      try {
        await deletePackage.mutateAsync(id)
        toast.success('Paket silindi', { description: 'Kayıt sistemden kaldırıldı' })
      } catch (err) {
        toast.error('Silme işlemi başarısız', { description: err.message })
      }
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Hata</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ürün Paketleri</h1>
          <p className="page-description">
            Tüm ürün paketlerini yönetin, fiyat ve maliyet bilgilerini düzenleyin
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Paket
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {PRODUCT_TYPES.map(pt => (
            <TabsTrigger key={pt.value} value={pt.value}>
              {pt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="rounded-xl shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">
            {PRODUCT_TYPES.find(pt => pt.value === activeTab)?.label} Paketleri
          </CardTitle>
          <CardDescription>
            Toplam {packages?.length || 0} paket
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-t first:border-t-0">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${40 + Math.random() * 80}px` }} />
                  ))}
                </div>
              ))}
            </div>
          ) : packages?.length === 0 ? (
            <div className="empty-state">
              <Plus className="empty-state-icon" />
              <p className="empty-state-title">Henüz paket yok</p>
              <p className="empty-state-description">Bu kategoride henüz paket bulunmuyor. Yeni bir paket ekleyin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-6">Ad</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>RAM</TableHead>
                    <TableHead>Disk</TableHead>
                    <TableHead>Aylık Fiyat</TableHead>
                    <TableHead>Eski Fiyat</TableHead>
                    <TableHead>Maliyet</TableHead>
                    <TableHead>Kar Marjı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right pr-6">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages?.map((pkg) => (
                    <TableRow key={pkg.id} className="group">
                      <TableCell className="pl-6 font-medium">
                        <div className="flex items-center gap-2">
                          {pkg.name}
                          {pkg.is_featured && (
                            <Badge variant="default" className="text-xs">Öne Çıkan</Badge>
                          )}
                          {pkg.badge_text && (
                            <Badge variant="secondary" className="text-xs">{pkg.badge_text}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{pkg.cpu_cores ? `${pkg.cpu_cores} Core` : '-'}</TableCell>
                      <TableCell>{pkg.ram_gb ? `${pkg.ram_gb} GB` : '-'}</TableCell>
                      <TableCell>
                        {pkg.disk_gb ? `${pkg.disk_gb} GB` : '-'}
                        {pkg.disk_type ? ` ${pkg.disk_type}` : ''}
                      </TableCell>
                      <TableCell className="font-medium">
                        {pkg.price_monthly ? `${pkg.price_monthly} ₺` : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground line-through">
                        {pkg.price_original ? `${pkg.price_original} ₺` : '-'}
                      </TableCell>
                      <TableCell>
                        {pkg.cost_monthly ? `${pkg.cost_monthly} ₺` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          pkg.price_monthly && pkg.cost_monthly
                            ? ((pkg.price_monthly - pkg.cost_monthly) / pkg.price_monthly * 100) > 30
                              ? 'default'
                              : 'secondary'
                            : 'outline'
                        }>
                          {profitMargin(pkg.price_monthly, pkg.cost_monthly)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={pkg.is_active ? 'active' : 'inactive'} />
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(pkg)} title="Düzenle">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(pkg.id)} title="Sil">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[800px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Paketi Düzenle' : 'Yeni Paket Oluştur'}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? 'Paket bilgilerini güncelleyin'
                : 'Yeni bir ürün paketi tanımlayın'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Genel Bilgiler */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Genel Bilgiler</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paket Adı *</FormLabel>
                        <FormControl><Input {...field} placeholder="Örn: VDS Pro" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="product_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ürün Tipi</FormLabel>
                        <FormControl>
                          <select
                            value={field.value}
                            onChange={field.onChange}
                            className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            {PRODUCT_TYPES.map(pt => (
                              <option key={pt.value} value={pt.value}>{pt.label}</option>
                            ))}
                          </select>
                        </FormControl>
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
                      <FormControl><Textarea {...field} placeholder="Paket açıklaması" rows={2} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Donanım Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Donanım Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cpu_cores"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPU Core</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="Örn: 4" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpu_model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPU Model</FormLabel>
                        <FormControl><Input {...field} placeholder="Örn: Intel Xeon E5" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ram_gb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RAM (GB)</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="Örn: 8" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ram_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RAM Tipi</FormLabel>
                        <FormControl><Input {...field} placeholder="Örn: DDR4" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="disk_gb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disk (GB)</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="Örn: 100" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="disk_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disk Tipi</FormLabel>
                        <FormControl><Input {...field} placeholder="Örn: NVMe SSD" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bandwidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bant Genişliği (GB)</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="Örn: 1000 (-1: Sınırsız)" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Hosting Özellikleri */}
              {isHostingType && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Hosting Özellikleri</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="domains_allowed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain Sayısı</FormLabel>
                          <FormControl><Input {...field} type="number" placeholder="-1: Sınırsız" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email_accounts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-posta Hesabı</FormLabel>
                          <FormControl><Input {...field} type="number" placeholder="-1: Sınırsız" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="databases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Veritabanı</FormLabel>
                          <FormControl><Input {...field} type="number" placeholder="-1: Sınırsız" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Fiyatlandırma */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Fiyatlandırma</h3>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cost_monthly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maliyet (Aylık) ₺</FormLabel>
                        <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_monthly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Satış Fiyatı (Aylık) ₺ *</FormLabel>
                        <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_original"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eski Fiyat ₺</FormLabel>
                        <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_quarterly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>3 Aylık Fiyat ₺</FormLabel>
                        <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_semi_annual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>6 Aylık Fiyat ₺</FormLabel>
                        <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_annual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yıllık Fiyat ₺</FormLabel>
                        <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {watchPriceMonthly && watchCostMonthly && (
                  <div className="text-sm text-muted-foreground">
                    Kar Marjı: <span className="font-semibold text-foreground">
                      {profitMargin(Number(watchPriceMonthly), Number(watchCostMonthly))}
                    </span>
                    {' '}({(Number(watchPriceMonthly) - Number(watchCostMonthly)).toFixed(2)} ₺ kar)
                  </div>
                )}
              </div>

              {/* Görünüm & Sıralama */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Görünüm & Sıralama</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="badge_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rozet Metni</FormLabel>
                        <FormControl><Input {...field} placeholder="Örn: En Popüler" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sıralama</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center gap-6">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal cursor-pointer">Aktif</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal cursor-pointer">Öne Çıkan</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tax_included"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal cursor-pointer">KDV Dahil</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Özellikler */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Özellikler</h3>
                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Özellik Listesi (her satıra bir özellik)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder={"DDoS Koruması\n7/24 Destek\nÜcretsiz SSL"} rows={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || createPackage.isPending || updatePackage.isPending}>
                  {(form.formState.isSubmitting || createPackage.isPending || updatePackage.isPending) ? (
                    <>
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    editingPackage ? 'Güncelle' : 'Oluştur'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
