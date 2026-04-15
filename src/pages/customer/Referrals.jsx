import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth.jsx'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Users2, Copy, Check, Gift, TrendingUp, Clock } from 'lucide-react'

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)

export default function Referrals() {
  const { user, profile } = useAuth()
  const [referralCode, setReferralCode] = useState('')
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      // Get referral code
      const { data: prof } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single()
      if (prof?.referral_code) setReferralCode(prof.referral_code)

      // Get rewards
      const { data: rw } = await supabase
        .from('referral_rewards')
        .select('*, referred:profiles!referred_id(email, full_name)')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })
      setRewards(rw || [])
      setLoading(false)
    }
    fetch()
  }, [user])

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Link kopyalandı!')
    setTimeout(() => setCopied(false), 2000)
  }

  const totalEarnings = rewards.filter(r => r.reward_status === 'credited').reduce((s, r) => s + parseFloat(r.reward_amount || 0), 0)
  const pendingEarnings = rewards.filter(r => r.reward_status === 'pending').reduce((s, r) => s + parseFloat(r.reward_amount || 0), 0)

  const maskEmail = (email) => {
    if (!email) return '***'
    const [name, domain] = email.split('@')
    return `${name.slice(0, 2)}***@${domain}`
  }

  const statusLabels = {
    pending: { label: 'Bekliyor', variant: 'secondary' },
    credited: { label: 'Ödendi', variant: 'default' },
    cancelled: { label: 'İptal', variant: 'destructive' },
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users2 className="h-6 w-6" /> Arkadaşını Getir</h1>
        <p className="text-muted-foreground">Arkadaşlarınızı davet edin, her ödemeden %10 kazanın</p>
      </div>

      {/* Referral Link */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Referans Linkiniz</p>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="font-mono text-sm" />
                <Button onClick={copyLink} variant="outline" className="gap-2 shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Bu linki paylaşın. Arkadaşınız kayıt olup ödeme yaptığında, ödeme tutarının %10'u cüzdanınıza eklenir.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rewards.length}</p>
              <p className="text-xs text-muted-foreground">Toplam Davet</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrice(totalEarnings)}₺</p>
              <p className="text-xs text-muted-foreground">Toplam Kazanç</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrice(pendingEarnings)}₺</p>
              <p className="text-xs text-muted-foreground">Bekleyen Ödül</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Referans Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Davet Edilen</th>
                  <th className="text-left p-3 font-medium">Tarih</th>
                  <th className="text-right p-3 font-medium">Fatura Tutarı</th>
                  <th className="text-right p-3 font-medium">Ödül (%10)</th>
                  <th className="text-right p-3 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((r) => {
                  const st = statusLabels[r.reward_status] || statusLabels.pending
                  return (
                    <tr key={r.id} className="border-b">
                      <td className="p-3">{maskEmail(r.referred?.email)}</td>
                      <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString('tr-TR')}</td>
                      <td className="p-3 text-right">{formatPrice(r.invoice_total)}₺</td>
                      <td className="p-3 text-right font-medium text-green-600">{formatPrice(r.reward_amount)}₺</td>
                      <td className="p-3 text-right"><Badge variant={st.variant}>{st.label}</Badge></td>
                    </tr>
                  )
                })}
                {rewards.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Henüz referans yok. Linkinizi paylaşarak kazanmaya başlayın!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}