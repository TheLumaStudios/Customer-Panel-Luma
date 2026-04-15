import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, AlertTriangle, Clock, CheckCircle, Eye, Send } from 'lucide-react'

const STATUS_CONFIG = {
  investigating: { label: 'Araştırılıyor', color: 'bg-yellow-500', variant: 'secondary' },
  identified: { label: 'Tespit Edildi', color: 'bg-orange-500', variant: 'secondary' },
  monitoring: { label: 'İzleniyor', color: 'bg-blue-500', variant: 'default' },
  resolved: { label: 'Çözüldü', color: 'bg-green-500', variant: 'default' },
}

const SEVERITY_CONFIG = {
  minor: { label: 'Düşük', variant: 'outline' },
  major: { label: 'Yüksek', variant: 'secondary' },
  critical: { label: 'Kritik', variant: 'destructive' },
}

export default function Incidents() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [updates, setUpdates] = useState([])
  const [form, setForm] = useState({ title: '', description: '', status: 'investigating', severity: 'minor' })
  const [updateForm, setUpdateForm] = useState({ status: '', message: '' })

  const fetchIncidents = async () => {
    const { data } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
    setIncidents(data || [])
    setLoading(false)
  }

  const fetchUpdates = async (incidentId) => {
    const { data } = await supabase
      .from('incident_updates')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: true })
    setUpdates(data || [])
  }

  useEffect(() => { fetchIncidents() }, [])

  const handleCreate = async () => {
    if (!form.title) { toast.error('Başlık zorunludur'); return }
    const { error } = await supabase.from('incidents').insert({
      title: form.title,
      description: form.description,
      status: form.status,
      severity: form.severity,
    })
    if (error) toast.error('Hata: ' + error.message)
    else {
      toast.success('Olay oluşturuldu')
      setDialogOpen(false)
      setForm({ title: '', description: '', status: 'investigating', severity: 'minor' })
      fetchIncidents()
    }
  }

  const handleAddUpdate = async () => {
    if (!updateForm.message || !selectedIncident) return
    const newStatus = updateForm.status || selectedIncident.status

    await supabase.from('incident_updates').insert({
      incident_id: selectedIncident.id,
      status: newStatus,
      message: updateForm.message,
    })

    const updatePayload = { status: newStatus, updated_at: new Date().toISOString() }
    if (newStatus === 'resolved') updatePayload.resolved_at = new Date().toISOString()

    await supabase.from('incidents').update(updatePayload).eq('id', selectedIncident.id)

    toast.success('Güncelleme eklendi')
    setUpdateForm({ status: '', message: '' })
    fetchUpdates(selectedIncident.id)
    fetchIncidents()
  }

  const openDetails = async (incident) => {
    setSelectedIncident(incident)
    await fetchUpdates(incident.id)
    setUpdateDialogOpen(true)
    setUpdateForm({ status: incident.status, message: '' })
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-6 w-6" /> Olaylar</h1>
          <p className="text-muted-foreground">Sistem olaylarını ve kesintileri yönetin</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Yeni Olay
        </Button>
      </div>

      <div className="space-y-3">
        {incidents.map((incident) => {
          const statusCfg = STATUS_CONFIG[incident.status] || STATUS_CONFIG.investigating
          const sevCfg = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.minor
          return (
            <Card key={incident.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openDetails(incident)}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${statusCfg.color}`} />
                    <div>
                      <h3 className="font-medium">{incident.title}</h3>
                      {incident.description && <p className="text-sm text-muted-foreground mt-0.5">{incident.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sevCfg.variant}>{sevCfg.label}</Badge>
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(incident.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {incidents.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Aktif olay yok</CardContent></Card>
        )}
      </div>

      {/* Create Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDialogOpen(false)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Yeni Olay</h2>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Sunucu kesintisi" />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detaylar..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Önem</Label>
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                    {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button onClick={handleCreate}>Oluştur</Button>
            </div>
          </div>
        </div>
      )}

      {/* Update/Details Dialog */}
      {updateDialogOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setUpdateDialogOpen(false)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{selectedIncident.title}</h2>
              <Badge variant={STATUS_CONFIG[selectedIncident.status]?.variant}>{STATUS_CONFIG[selectedIncident.status]?.label}</Badge>
            </div>

            {/* Timeline */}
            <div className="space-y-3 border-l-2 border-muted pl-4 ml-2">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                <p className="text-xs text-muted-foreground">{new Date(selectedIncident.created_at).toLocaleString('tr-TR')}</p>
                <p className="text-sm">Olay oluşturuldu - {selectedIncident.description || 'Açıklama yok'}</p>
              </div>
              {updates.map((upd) => (
                <div key={upd.id} className="relative">
                  <div className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[upd.status]?.color || 'bg-muted'}`} />
                  <p className="text-xs text-muted-foreground">{new Date(upd.created_at).toLocaleString('tr-TR')} - {STATUS_CONFIG[upd.status]?.label}</p>
                  <p className="text-sm">{upd.message}</p>
                </div>
              ))}
            </div>

            {/* Add Update */}
            {selectedIncident.status !== 'resolved' && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-medium">Güncelleme Ekle</h3>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px]" value={updateForm.message} onChange={(e) => setUpdateForm({ ...updateForm, message: e.target.value })} placeholder="Güncelleme mesajı..." />
                <Button onClick={handleAddUpdate} className="gap-2" disabled={!updateForm.message}>
                  <Send className="h-4 w-4" /> Güncelle
                </Button>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>Kapat</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
