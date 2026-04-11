import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCustomers } from '@/hooks/useCustomers'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  Lock,
  Sparkles,
  RefreshCw,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Açık' },
  { value: 'in_progress', label: 'İşlemde' },
  { value: 'waiting_customer', label: 'Müşteri Bekleniyor' },
  { value: 'resolved', label: 'Çözüldü' },
  { value: 'closed', label: 'Kapatıldı' },
]

export default function AdminTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: customers } = useCustomers()

  const [ticket, setTicket] = useState(null)
  const [replies, setReplies] = useState([])
  const [replyAuthorRoles, setReplyAuthorRoles] = useState({}) // { userId: 'customer' | 'admin' | 'employee' }
  const [relatedInvoice, setRelatedInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [aiRunning, setAiRunning] = useState(false)
  const [cancellingInvoice, setCancellingInvoice] = useState(false)

  const loadTicket = async () => {
    setLoading(true)
    try {
      const { data: ticketData, error: ticketErr } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (ticketErr) throw ticketErr
      if (!ticketData) {
        setNotFound(true)
        return
      }
      setTicket(ticketData)

      const { data: replyData } = await supabase
        .from('ticket_replies')
        .select('id, message, is_internal, created_at, user_id')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })
      setReplies(replyData || [])

      // Resolve each reply author's role so we can tell "customer" apart from
      // "staff" — reply.user_id is a profiles.id (auth uid), but
      // ticket.customer_id is a customers.id (different UUID), so we can't
      // compare them directly.
      const userIds = Array.from(
        new Set((replyData || []).map(r => r.user_id).filter(Boolean))
      )
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, role')
          .in('id', userIds)
        const map = {}
        for (const p of profs || []) map[p.id] = p.role
        setReplyAuthorRoles(map)
      } else {
        setReplyAuthorRoles({})
      }

      // Auto-detect a referenced invoice from the ticket body/subject.
      // Patterns like "INV-202604-0004" or "Fatura ID: <uuid>" are common
      // because the customer panel embeds them into the description.
      await resolveRelatedInvoice(ticketData)
    } catch (err) {
      toast.error('Talep yüklenemedi', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadTicket()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const resolveRelatedInvoice = async (ticketData) => {
    setRelatedInvoice(null)
    if (!ticketData) return
    const haystack = `${ticketData.subject || ''}\n${ticketData.description || ''}`

    // 1. invoice_number: INV-YYYYMM-NNNN
    const numberMatch = haystack.match(/INV[-\s]?\d{6}[-\s]?\d{3,6}/i)
    if (numberMatch) {
      const number = numberMatch[0].replace(/\s/g, '').toUpperCase()
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, total, currency, customer_id, created_at')
        .eq('invoice_number', number)
        .maybeSingle()
      if (data) {
        setRelatedInvoice(data)
        return
      }
    }

    // 2. Raw UUID "Fatura ID: <uuid>" (fallback)
    const uuidMatch = haystack.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    )
    if (uuidMatch) {
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, total, currency, customer_id, created_at')
        .eq('id', uuidMatch[0])
        .maybeSingle()
      if (data) setRelatedInvoice(data)
    }
  }

  const cancelRelatedInvoice = async () => {
    if (!relatedInvoice) return
    if (relatedInvoice.status === 'paid') {
      toast.error('Ödenmiş fatura iptal edilemez', {
        description: 'Bu işlem için refund/iade akışı gerekir',
      })
      return
    }
    if (relatedInvoice.status === 'cancelled') {
      toast.info('Fatura zaten iptal')
      return
    }
    if (!confirm(`${relatedInvoice.invoice_number} numaralı faturayı iptal etmek istediğinize emin misiniz?`)) return

    setCancellingInvoice(true)
    try {
      const reason = `Ticket #${ticket.ticket_number} (${user?.email || 'admin'})`
      const { error: err } = await supabase
        .from('invoices')
        .update({
          status: 'cancelled',
          admin_notes: `[Admin] Ticket üzerinden iptal edildi — ${reason}`,
        })
        .eq('id', relatedInvoice.id)
      if (err) throw err

      // Add an internal note so the timeline records the action
      await supabase.from('ticket_replies').insert({
        ticket_id: ticket.id,
        user_id: user?.id || null,
        is_internal: true,
        message: `[Admin] ${relatedInvoice.invoice_number} numaralı fatura iptal edildi.`,
      })

      toast.success('Fatura iptal edildi')
      setRelatedInvoice(prev => prev ? { ...prev, status: 'cancelled' } : null)
      await loadTicket()
    } catch (err) {
      toast.error('İptal edilemedi', { description: err.message })
    } finally {
      setCancellingInvoice(false)
    }
  }

  const ticketCustomer = customers?.find(c => c.id === ticket?.customer_id)

  const sendReply = async () => {
    if (!ticket || !replyText.trim() || !user?.id) return
    setSending(true)
    try {
      const { data, error: err } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: ticket.id,
          user_id: user.id,
          message: replyText.trim(),
          is_internal: isInternal,
        })
        .select()
        .single()
      if (err) throw err

      // Public reply to a closed ticket reopens it for the customer flow
      if (!isInternal && ['waiting_customer'].includes(ticket.status)) {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', ticket.id)
        setTicket(prev => ({ ...prev, status: 'in_progress' }))
      }

      setReplies(prev => [...prev, data])
      setReplyText('')
      setIsInternal(false)
      toast.success(isInternal ? 'Dahili not eklendi' : 'Cevap gönderildi')
    } catch (err) {
      toast.error('Gönderilemedi', { description: err.message })
    } finally {
      setSending(false)
    }
  }

  const changeStatus = async (newStatus) => {
    if (!ticket || newStatus === ticket.status) return
    try {
      await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id)
      setTicket(prev => ({ ...prev, status: newStatus }))
      toast.success('Durum güncellendi')
    } catch (err) {
      toast.error('Güncellenemedi', { description: err.message })
    }
  }

  const runAi = async () => {
    setAiRunning(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const functionsUrl = baseUrl.includes('/rest/v1')
        ? baseUrl.replace('/rest/v1', '/functions/v1')
        : `${baseUrl}/functions/v1`

      const response = await fetch(`${functionsUrl}/ai-ticket-responder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({ ticket_id: ticket.id }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'AI çalıştırılamadı')

      const actionCount = (result.actions || []).length
      toast.success('AI tamamlandı', {
        description: `${actionCount} eylem yapıldı`,
      })
      await loadTicket()
    } catch (err) {
      toast.error('AI çalıştırılamadı', { description: err.message })
    } finally {
      setAiRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (notFound || !ticket) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="text-lg font-medium">Talep bulunamadı</p>
            <Button onClick={() => navigate('/admin/tickets')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Taleplere Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/tickets')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>#{ticket.ticket_number}</span>
            <span>•</span>
            <span>{formatDate(ticket.created_at)}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline">{ticket.category || 'general'}</Badge>
            <StatusBadge status={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTicket}
            title="Yenile"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={runAi}
            disabled={aiRunning || ['resolved', 'closed'].includes(ticket.status)}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {aiRunning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI ile Cevapla
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversation */}
        <div className="lg:col-span-2 space-y-4">
          {/* Original message */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">
                    {ticketCustomer?.full_name || ticketCustomer?.email || 'Müşteri'}
                  </div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {formatDate(ticket.created_at)}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Replies */}
          {replies.length === 0 ? (
            <Card className="rounded-xl bg-muted/20 border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Henüz yanıt yok.
              </CardContent>
            </Card>
          ) : (
            replies.map((reply) => {
              const isFromSystem = !reply.user_id
              // Role-based attribution: profiles.role === 'customer' means
              // the reply came from the ticket's customer (not staff).
              const authorRole = reply.user_id ? replyAuthorRoles[reply.user_id] : null
              const isFromCustomer = !isFromSystem && authorRole === 'customer'
              const isStaff = !isFromSystem && !isFromCustomer
              return (
                <Card
                  key={reply.id}
                  className={`rounded-xl ${
                    reply.is_internal
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                      : isStaff || isFromSystem
                        ? 'bg-primary/5 border-primary/20'
                        : 'mr-12'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            isFromSystem
                              ? 'bg-primary/15 text-primary'
                              : isStaff
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-foreground'
                          }`}
                        >
                          {isFromSystem ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            <UserIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {isFromSystem
                              ? 'Luma Destek AI'
                              : isFromCustomer
                                ? ticketCustomer?.full_name || 'Müşteri'
                                : 'Destek Ekibi'}
                          </div>
                          <div className="text-xs text-muted-foreground font-normal">
                            {formatDate(reply.created_at)}
                          </div>
                        </div>
                      </div>
                      {reply.is_internal && (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100/50">
                          <Lock className="h-3 w-3 mr-1" />
                          Dahili Not
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {reply.message}
                    </p>
                  </CardContent>
                </Card>
              )
            })
          )}

          {/* Reply composer */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{isInternal ? 'Dahili Not' : 'Müşteriye Cevap'}</span>
                <button
                  type="button"
                  onClick={() => setIsInternal(v => !v)}
                  className="text-xs text-primary hover:underline"
                >
                  {isInternal ? 'Cevap yaz' : 'Dahili nota çevir'}
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  isInternal
                    ? 'Ekibin görebileceği dahili not...'
                    : 'Müşteriye gönderilecek cevap...'
                }
                rows={4}
                className={`resize-none ${isInternal ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}`}
                disabled={sending}
              />
              <div className="flex justify-end">
                <Button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {isInternal ? 'Dahili Not Ekle' : 'Cevap Gönder'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-sm">Ticket Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Durum</div>
                <Select value={ticket.status} onValueChange={changeStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Öncelik</div>
                <div>
                  <StatusBadge status={ticket.priority} />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Kategori</div>
                <Badge variant="outline">{ticket.category || 'general'}</Badge>
              </div>
            </CardContent>
          </Card>

          {relatedInvoice && (
            <Card className="rounded-xl border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  İlgili Fatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1.5">
                  <div>
                    <div className="text-xs text-muted-foreground">Fatura No</div>
                    <div className="font-mono font-semibold">{relatedInvoice.invoice_number}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tutar</div>
                    <div className="font-semibold">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: relatedInvoice.currency || 'TRY',
                      }).format(relatedInvoice.total || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Durum</div>
                    <div><StatusBadge status={relatedInvoice.status} /></div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Oluşturulma</div>
                    <div className="text-xs">{formatDate(relatedInvoice.created_at)}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/admin/invoice/${relatedInvoice.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Faturayı Aç
                  </Button>
                  {['unpaid', 'overdue'].includes(relatedInvoice.status) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={cancelRelatedInvoice}
                      disabled={cancellingInvoice}
                    >
                      {cancellingInvoice ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          İptal ediliyor...
                        </>
                      ) : (
                        'Faturayı İptal Et'
                      )}
                    </Button>
                  )}
                  {relatedInvoice.status === 'cancelled' && (
                    <div className="text-center text-xs text-muted-foreground py-1">
                      Bu fatura iptal edilmiş
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-sm">Müşteri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Ad</div>
                <div className="font-medium">
                  {ticketCustomer?.full_name || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-mono text-xs">
                  {ticketCustomer?.email || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Kod</div>
                <div className="font-mono text-xs">
                  {ticketCustomer?.customer_code || '-'}
                </div>
              </div>
              {ticketCustomer?.id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => navigate(`/admin/customers/${ticketCustomer.id}`)}
                >
                  Müşteri Profili
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
