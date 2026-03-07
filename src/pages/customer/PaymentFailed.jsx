import { useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { XCircle, AlertCircle, Home, FileText, RefreshCw, HelpCircle } from 'lucide-react'

export default function PaymentFailed() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const error = searchParams.get('error') || 'Ödeme işlemi başarısız oldu'
  const invoiceId = searchParams.get('invoice')

  useEffect(() => {
    document.title = 'Ödeme Başarısız - Customer Panel'
  }, [])

  const handleRetry = () => {
    if (invoiceId) {
      navigate(`/invoices`)
    } else {
      navigate('/invoices')
    }
  }

  // Common error messages and their user-friendly translations
  const getErrorMessage = (errorText) => {
    const errorMap = {
      'Insufficient funds': 'Yetersiz bakiye. Lütfen kartınızda yeterli bakiye olduğundan emin olun.',
      'Card declined': 'Kartınız reddedildi. Lütfen banka ile iletişime geçin veya başka bir kart deneyin.',
      'Invalid card': 'Geçersiz kart bilgisi. Lütfen kart bilgilerinizi kontrol edin.',
      'Expired card': 'Kartınızın süresi dolmuş. Lütfen başka bir kart kullanın.',
      'Transaction timeout': 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.',
      'Payment failed': 'Ödeme başarısız oldu. Lütfen bilgilerinizi kontrol edip tekrar deneyin.',
    }

    for (const [key, value] of Object.entries(errorMap)) {
      if (errorText.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }

    return errorText
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Error Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
            Ödeme Başarısız
          </h1>
          <p className="text-muted-foreground">
            Ödemeniz işlenirken bir sorun oluştu
          </p>
        </div>

        {/* Error Details Card */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Hata Detayları
            </CardTitle>
            <CardDescription>
              Ödeme işlemi tamamlanamadı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ödeme Hatası</AlertTitle>
              <AlertDescription>
                {getErrorMessage(error)}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Troubleshooting Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Sorun Giderme İpuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                <span>Kart bilgilerinizin doğru olduğundan emin olun (kart numarası, son kullanma tarihi, CVV)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                <span>Kartınızda yeterli bakiye olduğunu kontrol edin</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                <span>3D Secure doğrulamasını tamamladığınızdan emin olun</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                <span>İnternet bağlantınızın stabil olduğunu kontrol edin</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                <span>Sorun devam ederse, bankanızla iletişime geçin veya başka bir kart deneyin</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Alternative Payment Methods */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Alternatif Ödeme Yöntemleri
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Wallet bakiyeniz varsa, faturanızı wallet ile ödeyebilirsiniz. Veya havale/EFT ile ödeme yapabilirsiniz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="flex-1"
          >
            <Home className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
          <Button
            onClick={handleRetry}
            variant="default"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
        </div>

        {/* Support Link */}
        <div className="text-center text-sm text-muted-foreground">
          Sorun devam ediyorsa,{' '}
          <Link to="/support" className="text-primary hover:underline font-medium">
            destek ekibimizle iletişime geçin
          </Link>
        </div>
      </div>
    </div>
  )
}
