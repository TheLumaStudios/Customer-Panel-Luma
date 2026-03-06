import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Send, X } from 'lucide-react'

export default function SendPasswordModal({
  open,
  onOpenChange,
  customer,
  message,
  password,
  isExisting,
  onConfirm,
  onCancel
}) {
  const [sending, setSending] = useState(false)

  const handleConfirm = async () => {
    setSending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('Send error:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Panel Şifresi Gönder</DialogTitle>
          <DialogDescription>
            {customer?.full_name} - {customer?.phone}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Password Info */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">E-posta:</span>
                <span className="text-sm">{customer?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Telefon:</span>
                <span className="text-sm">{customer?.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Şifre:</span>
                <span className="text-sm font-mono bg-background px-2 py-1 rounded">
                  {password}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Durum:</span>
                <span className={`text-sm ${isExisting ? 'text-blue-600' : 'text-green-600'}`}>
                  {isExisting ? 'Mevcut Şifre' : 'Yeni Şifre'}
                </span>
              </div>
            </div>
          </Card>

          {/* SMS Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium">SMS İçeriği:</label>
            <Textarea
              value={message}
              readOnly
              rows={10}
              className="font-mono text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Mesaj uzunluğu: {message.length} karakter (~{Math.ceil(message.length / 160)} SMS)
            </p>
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ SMS gönderimi {customer?.phone} numarasına yapılacaktır.
              {!isExisting && ' Bu yeni bir şifredir.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={sending}
          >
            {sending ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                SMS Gönder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
