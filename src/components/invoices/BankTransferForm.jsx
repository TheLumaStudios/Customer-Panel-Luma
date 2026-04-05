import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { Upload, Banknote } from 'lucide-react'

const BANKS = [
  'Ziraat Bankası',
  'Halkbank',
  'Vakıfbank',
  'İş Bankası',
  'Garanti BBVA',
  'Akbank',
  'Yapı Kredi',
  'QNB Finansbank',
  'Denizbank',
  'TEB',
  'ING Bank',
  'HSBC',
  'Şekerbank',
  'Odeabank',
  'Diğer',
]

export default function BankTransferForm({ invoiceId, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptFile, setReceiptFile] = useState(null)
  const [form, setForm] = useState({
    bank_name: '',
    sender_name: '',
    transfer_date: '',
    amount: '',
    reference_number: '',
  })

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setReceiptFile(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.bank_name || !form.sender_name || !form.transfer_date || !form.amount) {
      toast.error('Eksik bilgi', { description: 'Lütfen zorunlu alanları doldurun' })
      return
    }

    setIsSubmitting(true)

    try {
      let receipt_url = null

      // Upload receipt file if provided
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
        bank_name: form.bank_name,
        sender_name: form.sender_name,
        transfer_date: form.transfer_date,
        amount: parseFloat(form.amount),
        reference_number: form.reference_number || null,
        receipt_url,
        status: 'pending',
      })

      if (error) throw error

      toast.success('Havale bildirimi gönderildi', {
        description: 'İnceleme sonrası faturanız onaylanacaktır',
      })

      setForm({
        bank_name: '',
        sender_name: '',
        transfer_date: '',
        amount: '',
        reference_number: '',
      })
      setReceiptFile(null)

      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error('Gönderim başarısız', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Havale / EFT Bildirimi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Banka *</Label>
              <Select
                value={form.bank_name}
                onValueChange={(value) => setForm({ ...form, bank_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Banka seçin" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender_name">Gönderen Ad Soyad *</Label>
              <Input
                id="sender_name"
                value={form.sender_name}
                onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
                placeholder="Ad Soyad"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer_date">Transfer Tarihi *</Label>
              <Input
                id="transfer_date"
                type="date"
                value={form.transfer_date}
                onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Tutar (TL) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference_number">Referans / İşlem Numarası</Label>
            <Input
              id="reference_number"
              value={form.reference_number}
              onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
              placeholder="Banka referans numarası"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt">Dekont (Opsiyonel)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {receiptFile && (
                <span className="text-sm text-muted-foreground">{receiptFile.name}</span>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
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
      </CardContent>
    </Card>
  )
}
