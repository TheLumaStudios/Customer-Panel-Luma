import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from '@/hooks/useTickets'
import { useCustomers } from '@/hooks/useCustomers'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Eye, MessageSquare, Sparkles, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'
import TicketForm from '@/components/tickets/TicketForm'

export default function Tickets() {
  const navigate = useNavigate()
  const { data: tickets, isLoading, error } = useTickets()
  const { data: customers } = useCustomers()
  const createTicket = useCreateTicket()
  const updateTicket = useUpdateTicket()
  const deleteTicket = useDeleteTicket()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState(null)
  const [departments, setDepartments] = useState([])
  const [filterDepartmentId, setFilterDepartmentId] = useState('all')
  const [aiRunningId, setAiRunningId] = useState(null)

  const handleAiRespond = async (ticketId) => {
    setAiRunningId(ticketId)
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
        body: JSON.stringify({ ticket_id: ticketId }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'AI çalıştırılamadı')

      const actionCount = (result.actions || []).length
      toast.success('AI cevapladı', {
        description: `${actionCount} eylem gerçekleştirildi. Ticket güncellendi.`,
      })
// Refetch tickets to show updated status/replies
      window.location.reload()
    } catch (error) {
      toast.error('AI çalıştırılamadı', { description: error.message })
    } finally {
      setAiRunningId(null)
    }
  }

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase
        .from('ticket_departments')
        .select('*')
        .order('name')
      if (data) setDepartments(data)
    }
    fetchDepartments()
  }, [])

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
    return <StatusBadge status={status} />
  }

  const getPriorityBadge = (priority) => {
    return <StatusBadge status={priority} />
  }

  // Filter tickets by department
  const filteredTickets = filterDepartmentId === 'all'
    ? tickets
    : tickets?.filter(t => t.department_id === filterDepartmentId)

  // Calculate summary statistics
  const openTickets = filteredTickets?.filter(t => t.status === 'open').length || 0
  const inProgressTickets = filteredTickets?.filter(t => t.status === 'in_progress').length || 0
  const resolvedTickets = filteredTickets?.filter(t => t.status === 'resolved').length || 0

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Destek Talepleri</h1>
          <p className="page-description">
            Tüm destek taleplerini görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex items-center gap-3">
          {departments.length > 0 && (
            <Select value={filterDepartmentId} onValueChange={setFilterDepartmentId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Departman Filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Departmanlar</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Talep
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-label">Açık Talepler</p>
            <div className="stat-card-icon bg-blue-100">
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="stat-card-value">{openTickets}</p>
          <p className="text-xs text-muted-foreground">
            Bekleyen destek talepleri
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-label">İşlemde</p>
            <div className="stat-card-icon bg-amber-100">
              <MessageSquare className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="stat-card-value">{inProgressTickets}</p>
          <p className="text-xs text-muted-foreground">
            Üzerinde çalışılan talepler
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-label">Çözüldü</p>
            <div className="stat-card-icon bg-emerald-100">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="stat-card-value">{resolvedTickets}</p>
          <p className="text-xs text-muted-foreground">
            Çözülen talepler
          </p>
        </div>
      </div>

      <Card className="rounded-xl shadow-card">
        <CardHeader>
          <CardTitle>Talep Listesi</CardTitle>
          <CardDescription>
            Toplam {filteredTickets?.length || 0} destek talebi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTickets?.length === 0 ? (
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
                {filteredTickets?.map((ticket) => {
// `getTickets` only selects `*`, so there is no joined
// customer object. Resolve the customer client-side from
// the separately-loaded `customers` list.
                  const ticketCustomer = customers?.find(c => c.id === ticket.customer_id)
                  return (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
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
                      <div>
                        <div className="font-medium">
                          {ticketCustomer?.full_name || ticketCustomer?.email || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ticketCustomer?.customer_code}
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
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAiRespond(ticket.id)}
                          disabled={aiRunningId === ticket.id || ['resolved', 'closed'].includes(ticket.status)}
                          title="AI ile cevapla"
                          className="text-primary hover:text-primary"
                        >
                          {aiRunningId === ticket.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          <span className="ml-1 hidden sm:inline">AI</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                          title="Detayı aç"
                        >
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
                  )
                })}
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
