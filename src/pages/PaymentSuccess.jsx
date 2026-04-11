import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { supabase } from '@/lib/supabase'
import { useCheckoutStore } from '@/stores/checkoutStore'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invoiceId = searchParams.get('invoice')
  const paymentId = searchParams.get('payment')

  const [loading, setLoading] = useState(!!invoiceId)
  const [itemTypes, setItemTypes] = useState([])
  const [invoiceTotal, setInvoiceTotal] = useState(null)

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
// Clear any stale checkout state so the next landing-cart session starts
// clean and a duplicate invoice is never created.
    useCheckoutStore.getState().clearCheckout()
  }, [])

  useEffect(() => {
    if (!invoiceId) return
    ;(async () => {
      try {
        const [{ data: inv }, { data: items }] = await Promise.all([
          supabase.from('invoices').select('total, currency').eq('id', invoiceId).maybeSingle(),
          supabase.from('invoice_items').select('type').eq('invoice_id', invoiceId),
        ])
        setInvoiceTotal(inv?.total ?? null)
        setItemTypes((items || []).map(i => i.type))
      } finally {
        setLoading(false)
      }
    })()
  }, [invoiceId])

  const renderMessage = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Detaylar yükleniyor...
        </div>
      )
    }
    if (itemTypes.includes('wallet_topup')) {
      return (
        <p className="text-sm">
          ₺{invoiceTotal} cüzdanınıza eklendi. Yeni bakiyenizi <b>Cüzdanım</b> sayfasında görebilirsiniz.
        </p>
      )
    }
    if (itemTypes.includes('domain')) {
      return (
        <p className="text-sm">
          Domain kayıt işleminiz sıraya alındı. Ekibimiz reseller panelinden kaydı 5-15 dakika içinde tamamlar.
        </p>
      )
    }
    if (itemTypes.some(t => t === 'hosting' || t === 'vds')) {
      return (
        <p className="text-sm">
          Hizmetiniz 1 iş günü içinde aktif edilecek. Ekibimiz sizi bilgilendirecektir.
        </p>
      )
    }
    return <p className="text-sm">Ödemeniz başarıyla tamamlandı.</p>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Ödeme Başarılı!</CardTitle>
          <CardDescription className="text-base mt-2">
            Ödemeniz başarıyla tamamlandı.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            {renderMessage()}
            {invoiceId && (
              <div className="flex justify-between text-xs pt-2 border-t mt-2">
                <span className="text-muted-foreground">Fatura ID:</span>
                <span className="font-medium">{invoiceId}</span>
              </div>
            )}
            {paymentId && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Ödeme ID:</span>
                <span className="font-medium">{paymentId}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {invoiceId && (
              <Button onClick={() => navigate(`/invoice/${invoiceId}`)} className="w-full">
                Faturayı Görüntüle
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/invoices')}
              className="w-full"
            >
              Faturalar Sayfasına Dön
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Fatura detayları e-posta adresinize gönderilecektir.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
