import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth.jsx'
import {
  useCustomerCredit,
  useCreateSelfInvoice,
  useInitializeIyzicoPayment,
} from '@/hooks/useInvoices'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Wallet as WalletIcon, CreditCard, Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { toast } from '@/lib/toast'
import { formatDate } from '@/lib/utils'
import IyzicoPaymentDialog from '@/components/payments/IyzicoPaymentDialog'

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000, 2500]
const MIN_AMOUNT = 50
const MAX_AMOUNT = 10000

const formatCurrency = (amount, currency = 'TRY') =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
  }).format(amount || 0)

export default function Wallet() {
  const { user } = useAuth()
  const { data: credit, refetch: refetchCredit } = useCustomerCredit(user?.id)
  const createSelfInvoice = useCreateSelfInvoice()
  const initializeIyzico = useInitializeIyzicoPayment()

  const [amount, setAmount] = useState(100)
  const [transactions, setTransactions] = useState([])
  const [iyzicoOpen, setIyzicoOpen] = useState(false)
  const [iyzicoContent, setIyzicoContent] = useState('')
  const [iyzicoUrl, setIyzicoUrl] = useState('')
  const [pendingInvoiceId, setPendingInvoiceId] = useState(null)

  const isPaying = createSelfInvoice.isPending || initializeIyzico.isPending

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('credit_transactions')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setTransactions(data || []))
  }, [user?.id, iyzicoOpen])

  const handleTopUp = async () => {
    const value = Number(amount)
    if (!Number.isFinite(value) || value < MIN_AMOUNT || value > MAX_AMOUNT) {
      toast.error(`Tutar ${MIN_AMOUNT} ile ${MAX_AMOUNT} TRY arasında olmalı`)
      return
    }

    try {
      const invoice = await createSelfInvoice.mutateAsync({
        items: [
          {
            type: 'wallet_topup',
            description: 'Cüzdana Bakiye Yükleme',
            quantity: 1,
            unit_price: value,
          },
        ],
      })
      setPendingInvoiceId(invoice.id)

      const result = await initializeIyzico.mutateAsync({
        invoice_id: invoice.id,
        return_url: `${window.location.origin}/payment-success`,
      })

      setIyzicoContent(result.checkoutFormContent || '')
      setIyzicoUrl(result.paymentPageUrl || '')
      setIyzicoOpen(true)
    } catch (error) {
      toast.error('Bakiye yükleme başlatılamadı', { description: error.message })
    }
  }

  /**
   * User closed the iyzico dialog. If the invoice is still `unpaid`
   * (payment didn't complete), mark it as `cancelled` so we don't leave
   * orphan invoices lying around for admins to look at. If the user already
   * completed payment, the callback has set status=paid and this no-op.
   */
  const handleDialogChange = async (open) => {
    setIyzicoOpen(open)
    if (open) return

    const invoiceId = pendingInvoiceId
    setPendingInvoiceId(null)
    setIyzicoContent('')
    setIyzicoUrl('')

    if (!invoiceId) return
    try {
      const { data: inv } = await supabase
        .from('invoices')
        .select('status')
        .eq('id', invoiceId)
        .maybeSingle()
      if (inv?.status === 'unpaid') {
        await supabase
          .from('invoices')
          .update({ status: 'cancelled' })
          .eq('id', invoiceId)
      }
    } catch (e) {
      // non-fatal
      console.warn('Could not cancel abandoned wallet invoice', e)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <WalletIcon className="h-8 w-8" /> Cüzdanım
        </h1>
        <p className="text-muted-foreground mt-1">
          Bakiye yükleyerek faturalarınızı hızlıca ödeyebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardDescription>Mevcut Bakiye</CardDescription>
            <CardTitle className="text-4xl">
              {formatCurrency(credit?.balance || 0, credit?.currency || 'TRY')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => refetchCredit()}>
              Yenile
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bakiye Yükle</CardTitle>
            <CardDescription>
              Hızlı tutar seçin veya özel bir tutar girin ({MIN_AMOUNT}-{MAX_AMOUNT} TRY).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <Button
                  key={a}
                  variant={Number(amount) === a ? 'default' : 'outline'}
                  onClick={() => setAmount(a)}
                  disabled={isPaying}
                >
                  ₺{a}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step={10}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="max-w-xs"
                disabled={isPaying}
              />
              <span className="text-sm text-muted-foreground">TRY</span>
            </div>

            <Button
              size="lg"
              onClick={handleTopUp}
              disabled={isPaying}
              className="w-full sm:w-auto"
            >
              {isPaying ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Bakiye Yükle
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Son İşlemler</CardTitle>
          <CardDescription>Son 20 bakiye işlemi</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz işlem yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="text-right">Bakiye</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.created_at)}</TableCell>
                    <TableCell>
                      {tx.type === 'credit' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <ArrowDownCircle className="h-4 w-4" /> Yükleme
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <ArrowUpCircle className="h-4 w-4" /> Harcama
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate">{tx.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      {tx.type === 'credit' ? '+' : '-'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(tx.balance_after, tx.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <IyzicoPaymentDialog
        open={iyzicoOpen}
        onOpenChange={handleDialogChange}
        paymentPageUrl={iyzicoUrl}
        htmlContent={iyzicoContent}
      />
    </div>
  )
}
