import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { toast } from 'sonner'
import { Palette, Upload, Image } from 'lucide-react'

const brandingSchema = z.object({
  company_name: z.string().optional(),
  primary_color: z.string().default('#4F46E5'),
  secondary_color: z.string().default('#7C3AED'),
  footer_text: z.string().optional(),
})

export function BrandingSettings({ customerId }) {
  const [branding, setBranding] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(null)

  const form = useForm({
    resolver: zodResolver(brandingSchema),
    defaultValues: { company_name: '', primary_color: '#4F46E5', secondary_color: '#7C3AED', footer_text: '' },
  })

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('customer_branding').select('*').eq('customer_id', customerId).single()
      if (data) {
        setBranding(data)
        setLogoUrl(data.logo_url)
        form.reset({
          company_name: data.company_name || '',
          primary_color: data.primary_color || '#4F46E5',
          secondary_color: data.secondary_color || '#7C3AED',
          footer_text: data.footer_text || '',
        })
      }
    }
    if (customerId) fetch()
  }, [customerId])

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `branding/${customerId}/logo.${ext}`
      const { error: uploadErr } = await supabase.storage.from('public').upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(path)
      setLogoUrl(publicUrl)
      // Upsert branding
      await supabase.from('customer_branding').upsert({ customer_id: customerId, logo_url: publicUrl }, { onConflict: 'customer_id' })
      toast.success('Logo yüklendi')
    } catch (err) {
      toast.error('Logo yüklenemedi', { description: err.message })
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      await supabase.from('customer_branding').upsert({
        customer_id: customerId,
        ...data,
        logo_url: logoUrl,
      }, { onConflict: 'customer_id' })
      toast.success('Marka ayarları kaydedildi')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Card className="rounded-xl shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5" />
          Beyaz Etiket (White-Label)
        </CardTitle>
        <CardDescription>PDF raporlarında görünecek marka ayarları</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <FormLabel>Logo</FormLabel>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-12 w-auto max-w-[200px] object-contain rounded border p-1" />
                ) : (
                  <div className="h-12 w-24 rounded border-2 border-dashed flex items-center justify-center">
                    <Image className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => document.getElementById('logo-upload').click()} disabled={uploading}>
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? 'Yükleniyor...' : 'Logo Yükle'}
                  </Button>
                </div>
              </div>
            </div>

            <FormField control={form.control} name="company_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Şirket Adı</FormLabel>
                <FormControl><Input {...field} placeholder="Müşterinin şirket adı" /></FormControl>
                <FormDescription>PDF raporlarında Luma yerine gösterilecek</FormDescription>
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="primary_color" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ana Renk</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <input type="color" {...field} className="h-9 w-10 rounded border cursor-pointer" />
                      <Input {...field} className="font-mono" />
                    </div>
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="secondary_color" render={({ field }) => (
                <FormItem>
                  <FormLabel>İkincil Renk</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <input type="color" {...field} className="h-9 w-10 rounded border cursor-pointer" />
                      <Input {...field} className="font-mono" />
                    </div>
                  </FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="footer_text" render={({ field }) => (
              <FormItem>
                <FormLabel>PDF Alt Bilgi</FormLabel>
                <FormControl><Input {...field} placeholder="© 2026 Şirket Adı - Tüm hakları saklıdır." /></FormControl>
              </FormItem>
            )} />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
