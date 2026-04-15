import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Wallet, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0)

const STATUS_CONFIG = {
  pending: { label: 'Bekliyor', variant: 'secondary', icon: Clock },
  approved: { label: 'Onaylandı', variant: 'default', icon: CheckCircle },
  rejected: { label: 'Reddedildi', variant: 'destructive', icon: XCircle },
  completed: { label: 'Tamamlandı', variant: 'default', icon: CheckCircle },
}

export default function WalletRefunds() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('wallet_refund_requests')
      .select('*, profile:profiles(full_name, email)')
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRequests() }, [])

  const handleAction = async (req, action) => {
    setProcessing(req.id)
    try {
      if (action === 'approve') {
        await supabase.from('wallet_refund_requests').update({
          status: 'approved',
          admin_note: 'Onaylandı, iyzico üzerinden iade yapılacak.',
          updated_at: new Date().toISOString(),
        }).eq('id', req.id)
        toast.success('İade talebi onaylandı')
      } else {
        await supabase.from('wallet_refund_requests').update({
          status: 'rejected',
          admin_note: 'Reddedildi.',
          updated_at: new Date().toISOString(),
        }).eq('id', req.id)
        toast.success('İade talebi reddedildi')
      }
      fetchRequests()
    } catch (err) {
      toast.error('İşlem başarısız: ' + err.message)
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6" /> Bakiye İade Talepleri</h1>
        <p className="text-muted-foreground">Müşteri bakiye iade taleplerini yönetin</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Müşteri</th>
                  <th className="text-left p-3 font-medium">Tutar</th>
                  <th className="text-left p-3 font-medium">Açıklama</th>
                  <th className="text-left p-3 font-medium">Tarih</th>
                  <th className="text-left p-3 font-medium">Durum</th>
                  <th className="text-right p-3 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending
                  return (
                    <tr key={req.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium">{req.profile?.full_name || 'Bilinmeyen'}</div>
                        <div className="text-xs text-muted-foreground">{req.profile?.email}</div>
                      </td>
                      <td className="p-3 font-medium">{formatCurrency(req.amount)}</td>
                      <td className="p-3 text-muted-foreground">{req.reason || '-'}</td>
                      <td className="p-3 text-muted-foreground">{new Date(req.created_at).toLocaleDateString('tr-TR')}</td>
                      <td className="p-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="p-3 text-right">
                        {req.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAction(req, 'approve')}
                              disabled={processing === req.id}
                            >
                              {processing === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Onayla'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => handleAction(req, 'reject')}
                              disabled={processing === req.id}
                            >
                              Reddet
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {requests.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Henüz iade talebi yok</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
