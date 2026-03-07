import { useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useInvoice } from '@/hooks/useInvoices'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, FileText, Home, Receipt } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const invoiceId = searchParams.get('invoice')
  const paymentId = searchParams.get('payment')

  const { data: invoice, isLoading } = useInvoice(invoiceId)

  useEffect(() => {
    // Confetti effect or celebration animation could go here
    document.title = 'Ödeme Başarılı - Customer Panel'
  }, [])

  const formatCurrency = (amount, currency = 'USD') => {
    if (currency === 'TRY') {
      return `₺${amount.toFixed(2)}`
    }
    return `$${amount.toFixed(2)}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 animate-bounce">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            Ödeme Başarılı!
          </h1>
          <p className="text-muted-foreground">
            Ödemeniz başarıyla alındı ve faturanız ödendi
          </p>
        </div>

        {/* Invoice Details Card */}
        {invoice && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Fatura Detayları
              </CardTitle>
              <CardDescription>
                İşlem başarıyla tamamlandı
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fatura No</p>
                  <p className="font-semibold">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ödenen Tutar</p>
                  <p className="font-semibold text-green-600 dark:text-green-400 text-lg">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ödeme Tarihi</p>
                  <p className="font-semibold">
                    {invoice.paid_date ? formatDate(invoice.paid_date) : 'Şimdi'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ödeme Yöntemi</p>
                  <p className="font-semibold">
                    {invoice.payment_method === 'iyzico' ? 'iyzico' : invoice.payment_method || 'Kredi Kartı'}
                  </p>
                </div>
              </div>

              {paymentId && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">İşlem ID</p>
                  <p className="text-sm font-mono">{paymentId}</p>
                </div>
              )}

              <div className="pt-4 border-t bg-blue-50 dark:bg-blue-950/20 -m-6 mt-4 p-6 rounded-b-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Fatura detaylarını görüntülemek için:
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/invoice/${invoice.id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Faturayı Görüntüle
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Notification Info */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  E-posta gönderildi
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Ödeme onayınız ve fatura detaylarınız e-posta adresinize gönderildi.
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
            onClick={() => navigate('/invoices')}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Faturalarıma Git
          </Button>
        </div>
      </div>
    </div>
  )
}
