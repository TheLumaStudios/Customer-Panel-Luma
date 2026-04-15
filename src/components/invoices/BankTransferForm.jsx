import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import { Upload, Copy, CheckCircle2, Building2 } from 'lucide-react'

const OUR_BANKS = [
  {
    name: 'Türkiye İş Bankası',
    logo: '/isbankasi-removebg-preview.png',
    holder: 'Enes POYRAZ',
    iban: 'TR24 0006 4000 0012 2051 4479 69',
    ibanRaw: 'TR240006400000122051447969',
    color: '#003087',
  },
  {
    name: 'VakıfBank',
    logo: '/vakitbank_de9b7a5f51-removebg-preview.png',
    holder: 'Enes POYRAZ',
    iban: 'TR14 0001 5001 5800 7379 9097 49',
    ibanRaw: 'TR140001500158007379909749',
    color: '#FFA300',
  },
]

export default function BankTransferForm({ invoiceId, invoiceNumber, invoiceTotal, onSuccess }) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptFile, setReceiptFile] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const [selectedBank, setSelectedBank] = useState(null)
  const [form, setForm] = useState({
    sender_name: '',
    transfer_date: new Date().toISOString().split('T')[0],
    amount: invoiceTotal || '',
  })

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success('Kopyalandı')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedBank || !form.sender_name || !form.transfer_date || !form.amount) {
      toast.error('Eksik bilgi', { description: 'Lütfen banka seçin ve zorunlu alanları doldurun' })
      return
    }

    setIsSubmitting(true)

    try {
      let receipt_url = null

      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop()
        const fileName = `${invoiceId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName)

        receipt_url = urlData.publicUrl
      }

      const { error } = await supabase.from('bank_transfer_confirmations').insert({
        invoice_id: invoiceId,
        customer_id: user?.id,
        bank_name: selectedBank.name,
        sender_name: form.sender_name,
        transfer_date: form.transfer_date,
        amount: parseFloat(form.amount),
        receipt_url,
        status: 'pending',
      })

      if (error) throw error

      setForm({ sender_name: '', transfer_date: '', amount: '', reference_number: '' })
      setReceiptFile(null)
      setSelectedBank(null)

      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error('Gönderim başarısız', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Bank accounts */}
      <div>
        <Label className="mb-3 block">Havale yapacağınız hesabı seçin *</Label>
        <div className="grid grid-cols-2 gap-3">
          {OUR_BANKS.map((bank, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedBank(bank)}
              className={`rounded-xl border overflow-hidden text-left transition-all ${
                selectedBank?.ibanRaw === bank.ibanRaw
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="bg-muted/30 px-4 py-3 flex items-center justify-center">
                <img src={bank.logo} alt={bank.name} className="h-8 w-auto object-contain" />
              </div>
              <div className="p-3 space-y-1.5">
                <p className="text-xs text-muted-foreground">Hesap Sahibi</p>
                <p className="text-sm font-medium">{bank.holder}</p>
                <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">IBAN</p>
                    <p className="text-xs font-mono font-medium truncate">{bank.iban}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleCopy(bank.ibanRaw, `iban-${i}`) }}
                    className="p-1 rounded hover:bg-background transition-colors shrink-0"
                  >
                    {copiedField === `iban-${i}` ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Transfer form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gönderen Ad Soyad *</Label>
            <Input
              value={form.sender_name}
              onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
              placeholder="Ad Soyad"
            />
          </div>
          <div className="space-y-2">
            <Label>Tutar (TL)</Label>
            <Input
              type="number"
              value={form.amount}
              disabled
              className="font-semibold"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Dekont (Opsiyonel)</Label>
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="cursor-pointer"
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Havale açıklamasına şunu yazın:</p>
            <button
              type="button"
              onClick={() => handleCopy(`${invoiceNumber || invoiceId} numarali hizmet bedeli`, 'desc')}
              className="p-1 rounded hover:bg-background transition-colors"
            >
              {copiedField === 'desc' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
          <p className="text-sm font-medium bg-background rounded px-3 py-2 font-mono">
            {invoiceNumber || invoiceId} numaralı hizmet bedeli
          </p>
          <p className="text-xs text-muted-foreground">Ödemeniz kontrol edildikten sonra faturanız otomatik onaylanır.</p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !selectedBank}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent mr-2" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Bildirimi Gönder
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
