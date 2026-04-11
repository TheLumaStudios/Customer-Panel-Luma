import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth.jsx'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { Upload, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react'

/**
 * Blocks customer panel access until the logged-in customer has uploaded
 * both the front and back of their identity card. Non-customers (admin,
 * employee) are never gated.
 */
export default function IdCardUploadGate() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState(null)
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const frontInputRef = useRef(null)
  const backInputRef = useRef(null)

  const isCustomer = profile?.role === 'customer' || (!profile?.role && !!user)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!user || !profile || profile.role !== 'customer') {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        // Find the customer row linked to this profile (by profile_id or email fallback)
        let { data: byProfile } = await supabase
          .from('customers')
          .select('id, id_card_front_url, id_card_back_url')
          .eq('profile_id', user.id)
          .maybeSingle()

        if (!byProfile && profile.email) {
          const { data: byEmail } = await supabase
            .from('customers')
            .select('id, id_card_front_url, id_card_back_url')
            .eq('email', profile.email)
            .maybeSingle()
          byProfile = byEmail
        }
        if (!cancelled) setCustomer(byProfile || null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user?.id, profile?.role, profile?.email])

  if (!isCustomer) return null
  if (loading) return null
  if (!customer) return null
  if (customer.id_card_front_url && customer.id_card_back_url) return null

  const handleFile = (side) => (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya en fazla 5MB olabilir')
      return
    }
    if (side === 'front') setFrontFile(file)
    else setBackFile(file)
  }

  const uploadSide = async (file, side) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const key = `${user.id}/${side}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('customer-kyc')
      .upload(key, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || undefined,
      })
    if (upErr) throw upErr
    // Signed URL valid for 10 years — effectively permanent, but still tied to RLS.
    const { data: signed, error: signErr } = await supabase.storage
      .from('customer-kyc')
      .createSignedUrl(key, 60 * 60 * 24 * 365 * 10)
    if (signErr) throw signErr
    return signed.signedUrl
  }

  const handleSubmit = async () => {
    if (!frontFile || !backFile) {
      toast.error('Kimliğin ön ve arka yüzü de gereklidir')
      return
    }
    setUploading(true)
    try {
      const [frontUrl, backUrl] = await Promise.all([
        uploadSide(frontFile, 'front'),
        uploadSide(backFile, 'back'),
      ])
      const { error } = await supabase
        .from('customers')
        .update({
          id_card_front_url: frontUrl,
          id_card_back_url: backUrl,
          id_card_uploaded_at: new Date().toISOString(),
        })
        .eq('id', customer.id)
      if (error) throw error
      toast.success('Kimlik bilgileri kaydedildi', {
        description: 'Panel erişiminiz açıldı.',
      })
      setCustomer({
        ...customer,
        id_card_front_url: frontUrl,
        id_card_back_url: backUrl,
      })
    } catch (err) {
      toast.error('Kaydedilemedi', { description: err.message })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open modal>
      <DialogContent
        className="sm:max-w-[560px]"
        // Prevent closing — mandatory upload
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" /> Kimlik Doğrulama Gerekli
          </DialogTitle>
          <DialogDescription>
            Panel üzerinden işlem yapabilmek için kimlik kartınızın ön ve arka
            yüzünü yüklemeniz gerekmektedir. Bilgileriniz yalnızca doğrulama
            amacıyla kullanılır.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <SlotCard
            label="Ön Yüz"
            file={frontFile}
            inputRef={frontInputRef}
            onPick={handleFile('front')}
          />
          <SlotCard
            label="Arka Yüz"
            file={backFile}
            inputRef={backInputRef}
            onPick={handleFile('back')}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Desteklenen biçimler: PNG, JPG, WEBP · Maks. 5MB/dosya
        </p>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSubmit}
            disabled={uploading || !frontFile || !backFile}
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yükleniyor...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" /> Gönder
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SlotCard({ label, file, inputRef, onPick }) {
  const previewUrl = file ? URL.createObjectURL(file) : null

  return (
    <div className="border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center gap-2 min-h-[180px] bg-muted/20">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={onPick}
      />
      {previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt={label}
            className="max-h-[110px] max-w-full object-contain rounded"
          />
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Seçildi
          </div>
          <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
            Değiştir
          </Button>
        </>
      ) : (
        <>
          <Upload className="h-7 w-7 text-muted-foreground" />
          <div className="text-sm font-medium">{label}</div>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Dosya Seç
          </Button>
        </>
      )}
    </div>
  )
}
