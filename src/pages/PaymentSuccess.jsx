import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invoiceId = searchParams.get('invoice')
  const paymentId = searchParams.get('payment')

  useEffect(() => {
    // Konfeti efekti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }, [])

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
            {invoiceId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fatura ID:</span>
                <span className="font-medium">{invoiceId}</span>
              </div>
            )}
            {paymentId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ödeme ID:</span>
                <span className="font-medium">{paymentId}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {invoiceId && (
              <Button
                onClick={() => navigate(`/admin/invoice/${invoiceId}`)}
                className="w-full"
              >
                Faturayı Görüntüle
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/admin/invoices')}
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
