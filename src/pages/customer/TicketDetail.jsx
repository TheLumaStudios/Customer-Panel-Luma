import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User as UserIcon,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [ticket, setTicket] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

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
      // Customers never see internal notes
      setReplies((replyData || []).filter(r => !r.is_internal))
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
          is_internal: false,
        })
        .select()
        .single()
      if (err) throw err

      // Customer reply reopens waiting/resolved tickets so the team notices
      if (['waiting_customer', 'resolved'].includes(ticket.status)) {
        await supabase
          .from('support_tickets')
          .update({ status: 'open' })
          .eq('id', ticket.id)
        setTicket(prev => ({ ...prev, status: 'open' }))
      }

      setReplies(prev => [...prev, data])
      setReplyText('')
      toast.success('Cevabınız gönderildi')
    } catch (err) {
      toast.error('Gönderilemedi', { description: err.message })
    } finally {
      setSending(false)
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
            <p className="text-lg font-medium">Destek talebi bulunamadı</p>
            <p className="text-sm text-muted-foreground">
              Bu talep sizin olmayabilir veya silinmiş olabilir.
            </p>
            <Button onClick={() => navigate('/tickets')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Taleplere Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const closed = ['closed', 'resolved'].includes(ticket.status)

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/tickets')}
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
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{ticket.category || 'general'}</Badge>
            <StatusBadge status={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="space-y-4">
        {/* Original message */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Siz</div>
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
              Henüz cevap yok. Ekibimiz en kısa sürede dönüş yapacak.
            </CardContent>
          </Card>
        ) : (
          replies.map((reply) => {
            const isFromCustomer = reply.user_id === user?.id
            const isFromSystem = !reply.user_id
            return (
              <Card
                key={reply.id}
                className={`rounded-xl ${
                  isFromCustomer
                    ? 'bg-primary/5 border-primary/20 ml-12'
                    : 'mr-12'
                }`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        isFromSystem
                          ? 'bg-primary/15 text-primary'
                          : isFromCustomer
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
                            ? 'Siz'
                            : 'Destek Ekibi'}
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {formatDate(reply.created_at)}
                      </div>
                    </div>
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
      </div>

      {/* Reply composer */}
      {closed ? (
        <Card className="rounded-xl bg-muted/30 border-dashed">
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            Bu talep {ticket.status === 'resolved' ? 'çözümlendi' : 'kapatıldı'}.
            Yeni bir sorun için{' '}
            <button
              className="underline font-medium"
              onClick={() => navigate('/tickets')}
            >
              yeni talep oluşturabilirsiniz
            </button>
            .
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-sm">Cevap yaz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Destek ekibine mesajınızı yazın..."
              rows={4}
              className="resize-none"
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
                    Cevap Gönder
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
