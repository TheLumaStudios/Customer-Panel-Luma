import { useState } from 'react'
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from '@/hooks/useTickets'
import { useCustomers } from '@/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Eye, MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'
import TicketForm from '@/components/tickets/TicketForm'

export default function Tickets() {
  const { data: tickets, isLoading, error } = useTickets()
  const { data: customers } = useCustomers()
  const createTicket = useCreateTicket()
  const updateTicket = useUpdateTicket()
  const deleteTicket = useDeleteTicket()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState(null)

  const handleCreate = () => {
    setEditingTicket(null)
    setFormOpen(true)
  }

  const handleEdit = (ticket) => {
    setEditingTicket(ticket)
    setFormOpen(true)
  }

  const handleSubmit = async (data) => {
    try {
      if (editingTicket) {
        await updateTicket.mutateAsync({ id: editingTicket.id, data })
        toast.success('Destek talebi güncellendi', {
          description: 'Değişiklikler başarıyla kaydedildi'
        })
      } else {
        await createTicket.mutateAsync(data)
        toast.success('Destek talebi oluşturuldu', {
          description: 'Yeni talep sisteme eklendi'
        })
      }
      setFormOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('İşlem başarısız', {
        description: error.message
      })
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Bu destek talebini silmek istediğinizden emin misiniz?')) {
      try {
        await deleteTicket.mutateAsync(id)
        toast.success('Destek talebi silindi', {
          description: 'Kayıt sistemden kaldırıldı'
        })
      } catch (error) {
        toast.error('Silme işlemi başarısız', {
          description: error.message
        })
      }
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
    const variants = {
      open: 'default',
      in_progress: 'secondary',
      resolved: 'default',
      closed: 'secondary',
    }
    const labels = {
      open: 'Açık',
      in_progress: 'İşlemde',
      resolved: 'Çözüldü',
      closed: 'Kapalı',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      urgent: 'destructive',
    }
    const labels = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      urgent: 'Acil',
    }
    return <Badge variant={variants[priority]}>{labels[priority]}</Badge>
  }

  // Calculate summary statistics
  const openTickets = tickets?.filter(t => t.status === 'open').length || 0
  const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0
  const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Destek Talepleri</h1>
          <p className="text-muted-foreground mt-1">
            Tüm destek taleplerini görüntüleyin ve yönetin
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Talep
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Açık Talepler</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Bekleyen destek talepleri
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İşlemde</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTickets}</div>
            <p className="text-xs text-muted-foreground">
              Üzerinde çalışılan talepler
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Çözüldü</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedTickets}</div>
            <p className="text-xs text-muted-foreground">
              Çözülen talepler
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Talep Listesi</CardTitle>
          <CardDescription>
            Toplam {tickets?.length || 0} destek talebi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz destek talebi bulunmuyor.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talep No</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oluşturma</TableHead>
                  <TableHead>Cevaplar</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets?.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      #{ticket.ticket_number}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <div className="font-medium truncate">{ticket.subject}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {ticket.customer?.profile?.full_name || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.customer?.customer_code}
                        </div>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(ticket)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ticket.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TicketForm
        open={formOpen}
        onOpenChange={setFormOpen}
        ticket={editingTicket}
        customers={customers}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
