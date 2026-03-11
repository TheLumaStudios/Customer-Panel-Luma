import { useState } from 'react'
import { useApprovals, useReviewApproval } from '@/hooks/useApprovals'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Clock, RefreshCw, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

export default function Approvals() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [statusFilter, setStatusFilter] = useState('pending')
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const { data: approvals, isLoading, error, refetch } = useApprovals({
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  const reviewApproval = useReviewApproval()

  const handleReview = (approval, action) => {
    setSelectedApproval({ ...approval, action })
    setReviewNotes('')
    setReviewDialogOpen(true)
  }

  const handleSubmitReview = async () => {
    if (!selectedApproval) return

    try {
      await reviewApproval.mutateAsync({
        id: selectedApproval.id,
        action: selectedApproval.action,
        notes: reviewNotes,
      })

      toast.success(
        selectedApproval.action === 'approve' ? 'İşlem onaylandı' : 'İşlem reddedildi',
        {
          description: `${getOperationLabel(selectedApproval.operation_type)} işlemi ${
            selectedApproval.action === 'approve' ? 'onaylandı' : 'reddedildi'
          }`,
        }
      )

      setReviewDialogOpen(false)
      setSelectedApproval(null)
    } catch (error) {
      toast.error('İşlem başarısız', {
        description: error.message,
      })
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Bekliyor', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      approved: { label: 'Onaylandı', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      rejected: { label: 'Reddedildi', className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    }
    const { label, className, icon: Icon } = config[status] || config.pending
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  const getOperationLabel = (operation_type) => {
    const labels = {
      refund: 'İade',
      credit_add: 'Kredi Ekleme',
      credit_deduct: 'Kredi Düşme',
      invoice_cancel: 'Fatura İptal',
      invoice_edit: 'Fatura Düzenleme',
      payment_reverse: 'Ödeme İptal',
      discount_apply: 'İndirim Uygulama',
    }
    return labels[operation_type] || operation_type
  }

  const getOperationBadge = (operation_type) => {
    const colors = {
      refund: 'bg-red-50 text-red-700 border-red-200',
      credit_add: 'bg-green-50 text-green-700 border-green-200',
      credit_deduct: 'bg-orange-50 text-orange-700 border-orange-200',
      invoice_cancel: 'bg-purple-50 text-purple-700 border-purple-200',
      invoice_edit: 'bg-blue-50 text-blue-700 border-blue-200',
      payment_reverse: 'bg-pink-50 text-pink-700 border-pink-200',
      discount_apply: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    }
    return (
      <Badge variant="outline" className={colors[operation_type] || 'bg-gray-50 text-gray-700 border-gray-200'}>
        {getOperationLabel(operation_type)}
      </Badge>
    )
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

  // Calculate statistics
  const stats = {
    total: approvals?.length || 0,
    pending: approvals?.filter(a => a.status === 'pending').length || 0,
    approved: approvals?.filter(a => a.status === 'approved').length || 0,
    rejected: approvals?.filter(a => a.status === 'rejected').length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isAdmin ? 'Onay Bekleyenler' : 'Onay Taleplerim'}</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Mali işlem onayları' : 'Oluşturduğum mali işlem talepleri'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Onay bekliyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onaylanan</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Onaylandı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reddedilen</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Reddedildi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Tüm talepler</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Onay Talepleri</CardTitle>
              <CardDescription>
                Toplam {stats.total} talep
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tüm Durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="pending">Bekleyen</SelectItem>
                  <SelectItem value="approved">Onaylanan</SelectItem>
                  <SelectItem value="rejected">Reddedilen</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {approvals && approvals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">
                {statusFilter !== 'all'
                  ? 'Bu filtreye uygun talep bulunamadı'
                  : 'Henüz onay talebi bulunmuyor'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İşlem Tipi</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Talep Eden</TableHead>
                  <TableHead>Talep Tarihi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İnceleme</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals?.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>
                      {getOperationBadge(approval.operation_type)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {approval.customer?.full_name || approval.customer_name || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {approval.customer?.customer_code || ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{approval.requester?.full_name || '-'}</div>
                        <div className="text-muted-foreground">{approval.requester?.email || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(approval.requested_at)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(approval.status)}
                    </TableCell>
                    <TableCell>
                      {approval.reviewed_by && (
                        <div className="text-sm">
                          <div className="font-medium">{approval.reviewer?.full_name || '-'}</div>
                          <div className="text-muted-foreground">
                            {approval.reviewed_at ? formatDate(approval.reviewed_at) : ''}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {approval.status === 'pending' && isAdmin && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleReview(approval, 'approve')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Onayla
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleReview(approval, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reddet
                          </Button>
                        </div>
                      )}
                      {!isAdmin && approval.status === 'pending' && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          Onay Bekleniyor
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedApproval?.action === 'approve' ? 'İşlemi Onayla' : 'İşlemi Reddet'}
            </DialogTitle>
            <DialogDescription>
              {selectedApproval && (
                <>
                  <span className="font-medium">{getOperationLabel(selectedApproval.operation_type)}</span>
                  {' işlemini '}
                  {selectedApproval.action === 'approve' ? 'onaylamak' : 'reddetmek'}
                  {' istediğinizden emin misiniz?'}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedApproval && (
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Müşteri:</span>
                  <span className="ml-2 font-medium">
                    {selectedApproval.customer?.full_name || selectedApproval.customer_name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Talep Eden:</span>
                  <span className="ml-2 font-medium">{selectedApproval.requester?.full_name}</span>
                </div>
                {selectedApproval.request_reason && (
                  <div>
                    <span className="text-muted-foreground">Sebep:</span>
                    <p className="mt-1 text-foreground">{selectedApproval.request_reason}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="review_notes">Notlar (Opsiyonel)</Label>
              <Textarea
                id="review_notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="İnceleme notlarınızı buraya yazın..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={reviewApproval.isPending}
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewApproval.isPending}
              className={
                selectedApproval?.action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {reviewApproval.isPending
                ? 'İşleniyor...'
                : selectedApproval?.action === 'approve'
                ? 'Onayla'
                : 'Reddet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
