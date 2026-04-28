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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Wallet as WalletIcon, CreditCard, Loader2, ArrowDownCircle, ArrowUpCircle, Gift, RefreshCw, ArrowRight, Shield, Percent } from 'lucide-react'
import { toast } from '@/lib/toast'
import { formatDate } from '@/lib/utils'
import { trackWalletTopUp } from '@/lib/analytics'
import IyzicoPaymentDialog from '@/components/payments/IyzicoPaymentDialog'

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000]
const MIN_AMOUNT = 50
const MAX_AMOUNT = 10000

const formatCurrency = (amount, currency = 'TRY') =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
  }).format(amount || 0)

export default function Wallet() {
  const { user, profile } = useAuth()
  const { data: credit, refetch: refetchCredit } = useCustomerCredit(user?.id)
  const createSelfInvoice = useCreateSelfInvoice()
  const initializeIyzico = useInitializeIyzicoPayment()

  const [amount, setAmount] = useState(500)
  const [transactions, setTransactions] = useState([])
  const [bonusTiers, setBonusTiers] = useState([])
  const [iyzicoOpen, setIyzicoOpen] = useState(false)
  const [iyzicoContent, setIyzicoContent] = useState('')
  const [iyzicoUrl, setIyzicoUrl] = useState('')
  const [pendingInvoiceId, setPendingInvoiceId] = useState(null)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundLoading, setRefundLoading] = useState(false)
  const [pendingRefunds, setPendingRefunds] = useState([])

  const isPaying = createSelfInvoice.isPending || initializeIyzico.isPending

  useEffect(() => {
    if (!user?.id) return

    // Fetch transactions
    supabase
      .from('credit_transactions')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setTransactions(data || []))

    // Fetch bonus tiers
    supabase
      .from('wallet_bonus_tiers')
      .select('*')
      .eq('is_active', true)
      .order('min_amount', { ascending: true })
      .then(({ data }) => setBonusTiers(data || []))

    // Fetch pending refund requests
    supabase
      .from('wallet_refund_requests')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setPendingRefunds(data || []))
  }, [user?.id, iyzicoOpen])

  // Calculate bonus for current amount
  const getBonus = (value) => {
    const tier = bonusTiers.find(
      (t) => value >= t.min_amount && (t.max_amount === null || value <= t.max_amount)
    )
    if (!tier) return { bonus: 0, total: value, tier: null }
    const bonus = tier.bonus_percentage > 0
      ? Math.round(value * tier.bonus_percentage) / 100
      : tier.bonus_fixed
    return { bonus, total: value + bonus, tier }
  }

  const currentBonus = getBonus(Number(amount) || 0)

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
            description: currentBonus.bonus > 0
              ? `Cüzdana Bakiye Yükleme (${formatCurrency(value)} + ${formatCurrency(currentBonus.bonus)} bonus)`
              : 'Cüzdana Bakiye Yükleme',
            quantity: 1,
            unit_price: value,
          },
        ],
      })
      setPendingInvoiceId(invoice.id)
      trackWalletTopUp(value)

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
      console.warn('Could not cancel abandoned wallet invoice', e)
    }
  }

  const handleRefundRequest = async () => {
    const value = Number(refundAmount)
    const balance = credit?.balance || 0
    if (!value || value <= 0 || value > balance) {
      toast.error('Geçerli bir tutar girin')
      return
    }

    setRefundLoading(true)
    try {
      // Find customer_id
      const { data: cust } = await supabase
        .from('customers')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      const { error } = await supabase.from('wallet_refund_requests').insert({
        customer_id: cust?.id || user.id,
        profile_id: user.id,
        amount: value,
        reason: refundReason || 'Bakiye iade talebi',
      })

      if (error) throw error

      toast.success('İade talebiniz oluşturuldu. En kısa sürede işleme alınacaktır.')
      setRefundDialogOpen(false)
      setRefundAmount('')
      setRefundReason('')

      // Refresh pending refunds
      const { data: refunds } = await supabase
        .from('wallet_refund_requests')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setPendingRefunds(refunds || [])
    } catch (err) {
      toast.error('İade talebi oluşturulamadı: ' + err.message)
    } finally {
      setRefundLoading(false)
    }
  }

  const refundStatusLabels = {
    pending: { label: 'Bekliyor', variant: 'secondary' },
    approved: { label: 'Onaylandı', variant: 'default' },
    rejected: { label: 'Reddedildi', variant: 'destructive' },
    completed: { label: 'Tamamlandı', variant: 'default' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <WalletIcon className="h-8 w-8" /> Cüzdanım
        </h1>
        <p className="text-muted-foreground mt-1">
          Bakiye yükleyerek faturalarınızı hızlıca ödeyebilir, bonus kazanabilirsiniz.
        </p>
      </div>

      {/* Balance + Top-up */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardDescription>Mevcut Bakiye</CardDescription>
            <CardTitle className="text-4xl">
              {formatCurrency(credit?.balance || 0, credit?.currency || 'TRY')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" size="sm" onClick={() => refetchCredit()} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" /> Yenile
            </Button>
            {(credit?.balance || 0) > 0 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setRefundDialogOpen(true)}
                >
                  Bakiye İade Talebi
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top-up Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Bakiye Yükle
              {currentBonus.bonus > 0 && (
                <Badge className="bg-emerald-500 text-white gap-1">
                  <Gift className="h-3 w-3" /> +{formatCurrency(currentBonus.bonus)} bonus
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Hızlı tutar seçin veya özel bir tutar girin ({MIN_AMOUNT}-{MAX_AMOUNT} TRY).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bonus Tiers Banner */}
            {bonusTiers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {bonusTiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setAmount(tier.min_amount)}
                    className={`rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 ${
                      Number(amount) >= tier.min_amount && (tier.max_amount === null || Number(amount) <= tier.max_amount)
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">+%{tier.bonus_percentage} Bonus</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{tier.label}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((a) => {
                const b = getBonus(a)
                return (
                  <Button
                    key={a}
                    variant={Number(amount) === a ? 'default' : 'outline'}
                    onClick={() => setAmount(a)}
                    disabled={isPaying}
                    className="relative"
                  >
                    ₺{a}
                    {b.bonus > 0 && (
                      <span className="absolute -top-2 -right-2 text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                        +₺{Math.round(b.bonus)}
                      </span>
                    )}
                  </Button>
                )
              })}
            </div>

            {/* Custom amount */}
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

            {/* Summary */}
            {currentBonus.bonus > 0 && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-700">Ödeyeceğiniz:</span>
                  <span className="font-medium">{formatCurrency(Number(amount))}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Bonus:</span>
                  <span className="font-medium">+{formatCurrency(currentBonus.bonus)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-emerald-200 pt-1 mt-1 font-bold text-emerald-800">
                  <span>Cüzdanınıza eklenecek:</span>
                  <span>{formatCurrency(currentBonus.total)}</span>
                </div>
              </div>
            )}

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
                  {currentBonus.bonus > 0
                    ? `₺${Number(amount)} Yükle, ₺${Math.round(currentBonus.total)} Kullan`
                    : 'Bakiye Yükle'}
                </>
              )}
            </Button>

            {/* Trust badges */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> SSL Korumalı Ödeme</span>
              <span>14 gün iade garantisi</span>
              <span>Her ödemede %5 cashback</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Refund Requests */}
      {pendingRefunds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">İade Taleplerim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingRefunds.map((req) => {
                const st = refundStatusLabels[req.status] || refundStatusLabels.pending
                return (
                  <div key={req.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="font-medium">{formatCurrency(req.amount)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{formatDate(req.created_at)}</span>
                      {req.admin_note && <p className="text-xs text-muted-foreground">{req.admin_note}</p>}
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
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

      {/* Refund Request Dialog */}
      {refundDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setRefundDialogOpen(false)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Bakiye İade Talebi</h2>
            <p className="text-sm text-muted-foreground">
              Kullanılmamış bakiyeniz 14 gün içinde yüklendiği ödeme yöntemiyle iade edilebilir.
              Kısmen kullanılmış bakiyelerin iadesi, hizmet sözleşmesi gereği değerlendirilir.
            </p>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>İade Tutarı</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={`Maks: ${credit?.balance || 0}`}
                    max={credit?.balance || 0}
                    min={1}
                  />
                  <span className="text-sm text-muted-foreground">TRY</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Açıklama (opsiyonel)</Label>
                <Input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="İade nedeniniz..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>İptal</Button>
              <Button onClick={handleRefundRequest} disabled={refundLoading}>
                {refundLoading ? 'Gönderiliyor...' : 'Talep Oluştur'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
