import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle, RefreshCw } from 'lucide-react'

export default function PaymentFailed() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-700">Ödeme Başarısız</CardTitle>
          <CardDescription className="text-base mt-2">
            Ödemeniz tamamlanamadı.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Hata:</strong> {decodeURIComponent(error)}
              </p>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Ödemeniz aşağıdaki nedenlerle başarısız olmuş olabilir:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Yetersiz bakiye</li>
              <li>Kart limiti aşımı</li>
              <li>Hatalı kart bilgileri</li>
              <li>3D Secure doğrulama hatası</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navigate(-1)}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tekrar Dene
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/invoices')}
              className="w-full"
            >
              Faturalar Sayfasına Dön
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Sorun devam ederse lütfen destek ekibimizle iletişime geçin.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
