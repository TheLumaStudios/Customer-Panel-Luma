import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTickets, useCreateTicket } from '@/hooks/useTickets'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useCustomers } from '@/hooks/useCustomers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Plus, Eye, MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'
import CustomerTicketForm from '@/components/tickets/CustomerTicketForm'

export default function MyTickets() {
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)
  const { profile } = useAuth()
  const { data: allTickets, isLoading, error } = useTickets()
  const { data: customers } = useCustomers()
  const createTicket = useCreateTicket()

  // Find current customer
  const currentCustomer = customers?.find(c => c.email === profile?.email)

  // Filter tickets for current customer
  const tickets = allTickets?.filter(ticket => ticket.customer_id === currentCustomer?.id)

  const handleCreate = () => {
    setFormOpen(true)
  }

  const openDetail = (ticket) => {
    navigate(`/tickets/${ticket.id}`)
  }

  const handleSubmit = async (data) => {
    if (!currentCustomer) {
      toast.error('Müşteri bilgisi bulunamadı', {
        description: 'Lütfen sayfayı yenileyin'
      })
      return
    }

    try {
      await createTicket.mutateAsync({
        customer_id: currentCustomer.id,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: 'open',
      })

      toast.success('Destek talebi oluşturuldu', {
        description: 'Talebiniz en kısa sürede yanıtlanacak'
      })
      setFormOpen(false)
    } catch (error) {
      console.error('Ticket creation error:', error)
      toast.error('Talep oluşturulamadı', {
        description: error.message
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Hata</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    return <StatusBadge status={status} />
  }

  const getPriorityBadge = (priority) => {
    return <StatusBadge status={priority} />
  }

  // Calculate summary statistics
  const openTickets = tickets?.filter(t => t.status === 'open').length || 0
  const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0
  const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Destek Taleplerim</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Destek taleplerini oluşturun ve takip edin
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Talep Oluştur
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-xl border p-5 shadow-card transition-all hover:shadow-card-hover">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-blue-50">
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </div>
            Açık Talepler
          </div>
          <div className="text-2xl font-bold tracking-tight mt-1">{openTickets}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Cevap bekleyen
          </p>
        </div>
        <div className="bg-card rounded-xl border p-5 shadow-card transition-all hover:shadow-card-hover">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-amber-50">
              <MessageSquare className="h-4 w-4 text-amber-600" />
            </div>
            İşlemde
          </div>
          <div className="text-2xl font-bold tracking-tight mt-1">{inProgressTickets}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Üzerinde çalışılıyor
          </p>
        </div>
        <div className="bg-card rounded-xl border p-5 shadow-card transition-all hover:shadow-card-hover">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-emerald-50">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
            </div>
            Çözüldü
          </div>
          <div className="text-2xl font-bold tracking-tight mt-1">{resolvedTickets}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Çözümlenen talepler
          </p>
        </div>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Talep Listesi</CardTitle>
          <CardDescription>
            Toplam {tickets?.length || 0} destek talebi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz destek talebiniz bulunmuyor.</p>
              <p className="text-sm mt-2">Yeni bir talep oluşturmak için yukarıdaki butonu kullanın.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talep No</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oluşturma Tarihi</TableHead>
                  <TableHead>Cevaplar</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets?.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => openDetail(ticket)}
                  >
                    <TableCell className="font-medium">
                      #{ticket.ticket_number}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <div className="font-medium truncate">{ticket.subject}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.category}</Badge>
                    </TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{ticket.ticket_replies?.[0]?.count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDetail(ticket)
                        }}
                        title="Detayları görüntüle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CustomerTicketForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

    </div>
  )
}
