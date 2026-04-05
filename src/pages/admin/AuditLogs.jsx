import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/ui/status-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Search, Shield, ChevronLeft, ChevronRight, Eye, RefreshCw } from 'lucide-react'
import SEO from '@/components/SEO'

const ACTION_LABELS = {
  create: { label: 'Oluşturma', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  update: { label: 'Güncelleme', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  delete: { label: 'Silme', color: 'bg-red-50 text-red-700 border-red-200' },
  suspend: { label: 'Askıya Alma', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  unsuspend: { label: 'Aktifleştirme', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  login: { label: 'Giriş', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  payment: { label: 'Ödeme', color: 'bg-purple-50 text-purple-700 border-purple-200' },
}

const ENTITY_LABELS = {
  invoices: 'Fatura',
  hosting: 'Hosting',
  domains: 'Domain',
  customers: 'Müşteri',
  payments: 'Ödeme',
  support_tickets: 'Destek Talebi',
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [filterEntity, setFilterEntity] = useState('all')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedLog, setSelectedLog] = useState(null)
  const perPage = 50

  const fetchLogs = async () => {
    setLoading(true)
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * perPage, (page + 1) * perPage - 1)

    if (filterAction !== 'all') query = query.eq('action', filterAction)
    if (filterEntity !== 'all') query = query.eq('entity_type', filterEntity)
    if (search) query = query.or(`actor_email.ilike.%${search}%,entity_name.ilike.%${search}%`)

    const { data, count, error } = await query
    if (!error) {
      setLogs(data || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [page, filterAction, filterEntity])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    fetchLogs()
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="page-container">
      <SEO title="İşlem Logları" noIndex />
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield className="h-6 w-6" />
            İşlem Logları
          </h1>
          <p className="page-description">Sistemdeki tüm değişikliklerin izlenebilir kaydı</p>
        </div>
        <Button variant="outline" onClick={fetchLogs} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="E-posta veya kayıt adı..." className="pl-9 h-9" />
        </form>
        <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(0) }}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="İşlem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm İşlemler</SelectItem>
            <SelectItem value="create">Oluşturma</SelectItem>
            <SelectItem value="update">Güncelleme</SelectItem>
            <SelectItem value="delete">Silme</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEntity} onValueChange={(v) => { setFilterEntity(v); setPage(0) }}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Tablo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Tablolar</SelectItem>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{total} kayıt</span>
      </div>

      {/* Log List */}
      <Card className="rounded-xl shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3 border-t first:border-t-0">
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${50 + Math.random() * 100}px` }} />
                  ))}
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <Shield className="empty-state-icon" />
              <p className="empty-state-title">Log bulunamadı</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => {
                const actionConfig = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-50 text-gray-700 border-gray-200' }
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors group"
                    onClick={() => setSelectedLog(log)}
                  >
                    <UserAvatar name={log.actor_email || 'System'} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{log.actor_email || 'Sistem'}</span>
                        <Badge variant="outline" className={`text-[10px] ${actionConfig.color}`}>{actionConfig.label}</Badge>
                        <span className="text-xs text-muted-foreground">{ENTITY_LABELS[log.entity_type] || log.entity_type}</span>
                      </div>
                      {log.entity_name && (
                        <p className="text-xs text-muted-foreground truncate">{log.entity_name}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'd MMM HH:mm', { locale: tr })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sayfa {page + 1} / {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="w-[600px] max-w-[90vw]">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle>İşlem Detayı</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Yapan</p>
                    <div className="flex items-center gap-2">
                      <UserAvatar name={selectedLog.actor_email || 'System'} size={24} />
                      <span className="font-medium">{selectedLog.actor_email || 'Sistem'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Rol</p>
                    <StatusBadge status={selectedLog.actor_role || 'system'} />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">İşlem</p>
                    <Badge variant="outline" className={(ACTION_LABELS[selectedLog.action] || {}).color}>
                      {(ACTION_LABELS[selectedLog.action] || {}).label || selectedLog.action}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Tablo</p>
                    <span>{ENTITY_LABELS[selectedLog.entity_type] || selectedLog.entity_type}</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Tarih</p>
                    <span>{format(new Date(selectedLog.created_at), 'd MMMM yyyy HH:mm:ss', { locale: tr })}</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Kayıt ID</p>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{selectedLog.entity_id}</code>
                  </div>
                </div>
                {selectedLog.changes && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Değişiklikler</p>
                    <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto max-h-[300px] font-mono">
                      {JSON.stringify(typeof selectedLog.changes === 'string' ? JSON.parse(selectedLog.changes) : selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
