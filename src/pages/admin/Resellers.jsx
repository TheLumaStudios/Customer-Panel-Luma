import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Store, Plus, Edit2, Trash2, Globe, Wallet, TrendingUp,
  Users, CheckCircle, XCircle, Clock, Copy, Check,
  ShieldCheck, AlertCircle,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
}
const STATUS_LABELS = { active: 'Aktif', suspended: 'Askıya Alındı', pending: 'Onay Bekliyor' }
const STATUS_ICONS = { active: CheckCircle, suspended: XCircle, pending: Clock }

function StatCard({ icon: Icon, label, value, color = 'text-primary' }) {
  return (
    <Card className="rounded-xl">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const EMPTY_FORM = {
  company_name: '',
  domain: '',
  status: 'active',
  margin_type: 'percent',
  margin_value: 20,
  brand_name: '',
  brand_primary_color: '#4F46E5',
  brand_secondary_color: '#7C3AED',
  brand_footer_text: '',
  contact_email: '',
  contact_phone: '',
  notes: '',
}

export default function Resellers() {
  const [resellers, setResellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [earningsMap, setEarningsMap] = useState({}) // reseller_id → total earned
  const [customerCountMap, setCustomerCountMap] = useState({}) // reseller_id → count
  const [copiedToken, setCopiedToken] = useState(null)
  const [verifications, setVerifications] = useState([])
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [selectedReseller, setSelectedReseller] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [{ data: rs }, { data: earn }, { data: custs }, { data: verifs }] = await Promise.all([
        supabase.from('resellers').select('*, profiles(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('reseller_earnings').select('reseller_id, earned_amount').eq('status', 'pending'),
        supabase.from('customers').select('reseller_id').not('reseller_id', 'is', null),
        supabase.from('reseller_domain_verifications').select('*'),
      ])
      setResellers(rs || [])
      setVerifications(verifs || [])

      // Earnings sum per reseller
      const em = {}
      for (const e of (earn || [])) {
        em[e.reseller_id] = (em[e.reseller_id] || 0) + Number(e.earned_amount)
      }
      setEarningsMap(em)

      // Customer count per reseller
      const cm = {}
      for (const c of (custs || [])) {
        cm[c.reseller_id] = (cm[c.reseller_id] || 0) + 1
      }
      setCustomerCountMap(cm)
    } catch (err) {
      toast.error('Veriler yüklenemedi', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (r) => {
    setEditingId(r.id)
    setForm({
      company_name: r.company_name || '',
      domain: r.domain || '',
      status: r.status || 'active',
      margin_type: r.margin_type || 'percent',
      margin_value: r.margin_value ?? 20,
      brand_name: r.brand_name || '',
      brand_primary_color: r.brand_primary_color || '#4F46E5',
      brand_secondary_color: r.brand_secondary_color || '#7C3AED',
      brand_footer_text: r.brand_footer_text || '',
      contact_email: r.contact_email || '',
      contact_phone: r.contact_phone || '',
      notes: r.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      toast.error('Şirket adı zorunludur')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase.from('resellers').update({
          ...form,
          margin_value: Number(form.margin_value),
          updated_at: new Date().toISOString(),
        }).eq('id', editingId)
        if (error) throw error
        toast.success('Bayi güncellendi')
      } else {
        // Yeni bayi için önce bir profile_id gerekli — admin oluşturuyorsa geçici profil
        // Gerçekte bayi kayıt akışı ayrı bir onboarding sayfasında olmalı.
        // Şimdilik sadece var olan bir profile_id bağlanıyor (contact_email üzerinden arama)
        const { data: profileData, error: pErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', form.contact_email)
          .maybeSingle()
        if (pErr) throw pErr
        if (!profileData) {
          toast.error('Bu e-posta ile kayıtlı bir kullanıcı bulunamadı', {
            description: 'Bayi önce sisteme kayıt olmalı, sonra admin bayi olarak tanımlayabilir.'
          })
          return
        }
        const { error } = await supabase.from('resellers').insert({
          ...form,
          profile_id: profileData.id,
          margin_value: Number(form.margin_value),
        })
        if (error) throw error
        toast.success('Bayi oluşturuldu')
      }
      setDialogOpen(false)
      fetchAll()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu bayiyi silmek istediğinizden emin misiniz?')) return
    const { error } = await supabase.from('resellers').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Bayi silindi')
    fetchAll()
  }

  const handleStatusToggle = async (r) => {
    const next = r.status === 'active' ? 'suspended' : 'active'
    await supabase.from('resellers').update({ status: next }).eq('id', r.id)
    fetchAll()
  }

  const openVerification = (r) => {
    setSelectedReseller(r)
    setVerifyDialogOpen(true)
  }

  const createVerification = async () => {
    if (!selectedReseller?.domain) {
      toast.error('Bayinin domain alanı boş')
      return
    }
    const { error } = await supabase.from('reseller_domain_verifications').insert({
      reseller_id: selectedReseller.id,
      domain: selectedReseller.domain,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Doğrulama kaydı oluşturuldu')
    fetchAll()
  }

  const markVerified = async (verif) => {
    await supabase.from('reseller_domain_verifications').update({
      verified: true, verified_at: new Date().toISOString()
    }).eq('id', verif.id)
    toast.success('Domain doğrulandı')
    fetchAll()
  }

  const copyToken = async (token) => {
    await navigator.clipboard.writeText(token)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const totalResellers = resellers.length
  const activeResellers = resellers.filter(r => r.status === 'active').length
  const totalPendingEarnings = Object.values(earningsMap).reduce((a, b) => a + b, 0)
  const totalCustomers = Object.values(customerCountMap).reduce((a, b) => a + b, 0)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bayi Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kendi domainleriyle satış yapan bayi ortakları
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Yeni Bayi
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Store} label="Toplam Bayi" value={totalResellers} />
        <StatCard icon={CheckCircle} label="Aktif Bayi" value={activeResellers} color="text-green-600" />
        <StatCard icon={Users} label="Bayi Müşterileri" value={totalCustomers} color="text-blue-600" />
        <StatCard icon={Wallet} label="Bekleyen Kazanç" value={`₺${totalPendingEarnings.toFixed(2)}`} color="text-violet-600" />
      </div>

      {/* Resellers Table */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Bayiler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            </div>
          ) : resellers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Henüz bayi tanımlanmamış</p>
              <p className="text-xs mt-1">Bayiler kendi domainleriyle Luma altyapısını kullanabilir</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bayi</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Müşteriler</TableHead>
                  <TableHead>Kar Marjı</TableHead>
                  <TableHead>Bekleyen Kazanç</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resellers.map((r) => {
                  const StatusIcon = STATUS_ICONS[r.status] || Clock
                  const custCount = customerCountMap[r.id] || 0
                  const pendingEarning = earningsMap[r.id] || 0
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{r.company_name}</p>
                          <p className="text-xs text-muted-foreground">{r.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.domain ? (
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-mono">{r.domain}</span>
                            {verifications.find(v => v.reseller_id === r.id && v.verified) ? (
                              <ShieldCheck className="h-3.5 w-3.5 text-green-500" title="Doğrulandı" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5 text-yellow-500" title="Doğrulanmadı" />
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {custCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {r.margin_type === 'percent' ? `%${r.margin_value}` : `₺${r.margin_value}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${pendingEarning > 0 ? 'text-violet-600' : 'text-muted-foreground'}`}>
                          ₺{pendingEarning.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[r.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_LABELS[r.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => openVerification(r)}
                            title="Domain doğrulama"
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleStatusToggle(r)}
                            title={r.status === 'active' ? 'Askıya al' : 'Aktifleştir'}
                          >
                            {r.status === 'active'
                              ? <XCircle className="h-3.5 w-3.5 text-red-500" />
                              : <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            }
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => openEdit(r)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Bayi Düzenle' : 'Yeni Bayi Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Şirket Adı *</Label>
                <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="ABC Hosting Ltd." />
              </div>
              <div className="space-y-1.5">
                <Label>Panel Domain</Label>
                <Input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="panel.bayidomain.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>İletişim E-posta {!editingId && '*'}</Label>
                <Input
                  value={form.contact_email}
                  onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                  placeholder="bayi@ornek.com"
                  disabled={!!editingId}
                />
                {!editingId && <p className="text-[11px] text-muted-foreground">Sistemde kayıtlı kullanıcı e-postası</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="+90 5XX XXX XX XX" />
              </div>
            </div>

            {/* Durum */}
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="pending">Onay Bekliyor</SelectItem>
                  <SelectItem value="suspended">Askıya Alındı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kar Marjı */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Marj Tipi</Label>
                <Select value={form.margin_type} onValueChange={v => setForm(f => ({ ...f, margin_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Yüzde (%)</SelectItem>
                    <SelectItem value="fixed">Sabit (₺)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Marj Değeri</Label>
                <Input
                  type="number"
                  value={form.margin_value}
                  onChange={e => setForm(f => ({ ...f, margin_value: e.target.value }))}
                  placeholder={form.margin_type === 'percent' ? '20' : '50'}
                  min={0}
                />
                <p className="text-[11px] text-muted-foreground">
                  {form.margin_type === 'percent'
                    ? `Her satışın %${form.margin_value}'si bayiye gider`
                    : `Her satışta ₺${form.margin_value} sabit kazanır`}
                </p>
              </div>
            </div>

            {/* Marka Ayarları */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Marka Ayarları</p>
              <div className="space-y-1.5">
                <Label>Marka Adı</Label>
                <Input value={form.brand_name} onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))} placeholder="Bayi markası — panelde Luma yerine görünür" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Ana Renk</Label>
                  <div className="flex gap-2">
                    <input type="color" value={form.brand_primary_color} onChange={e => setForm(f => ({ ...f, brand_primary_color: e.target.value }))} className="h-9 w-10 rounded border cursor-pointer" />
                    <Input value={form.brand_primary_color} onChange={e => setForm(f => ({ ...f, brand_primary_color: e.target.value }))} className="font-mono" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>İkincil Renk</Label>
                  <div className="flex gap-2">
                    <input type="color" value={form.brand_secondary_color} onChange={e => setForm(f => ({ ...f, brand_secondary_color: e.target.value }))} className="h-9 w-10 rounded border cursor-pointer" />
                    <Input value={form.brand_secondary_color} onChange={e => setForm(f => ({ ...f, brand_secondary_color: e.target.value }))} className="font-mono" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Alt Bilgi Metni</Label>
                <Input value={form.brand_footer_text} onChange={e => setForm(f => ({ ...f, brand_footer_text: e.target.value }))} placeholder="© 2026 ABC Hosting — Tüm hakları saklıdır." />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notlar (dahili)</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Sözleşme tarihi, özel koşullar vb." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domain Doğrulama — {selectedReseller?.domain || '(domain yok)'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bayinin domain sahipliğini doğrulamak için DNS TXT kaydı kullanılır.
            </p>

            {!selectedReseller?.domain ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                Bayiye önce bir domain tanımlamanız gerekiyor.
              </div>
            ) : (
              <>
                {verifications.filter(v => v.reseller_id === selectedReseller?.id).length === 0 ? (
                  <Button onClick={createVerification} className="w-full">Doğrulama Kaydı Oluştur</Button>
                ) : (
                  <div className="space-y-3">
                    {verifications
                      .filter(v => v.reseller_id === selectedReseller?.id)
                      .map((v) => (
                        <div key={v.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Domain</span>
                            <span className="text-xs font-mono">{v.domain}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">TXT Kaydı Adı</span>
                            <code className="text-xs bg-background px-2 py-0.5 rounded border">_luma-verify.{v.domain}</code>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Doğrulama Kodu</span>
                            <div className="flex items-center gap-1.5">
                              <code className="text-xs bg-background px-2 py-0.5 rounded border font-mono truncate max-w-[180px]">{v.verification_token}</code>
                              <button
                                onClick={() => copyToken(v.verification_token)}
                                className="p-1 hover:bg-muted rounded"
                              >
                                {copiedToken === v.verification_token
                                  ? <Check className="h-3.5 w-3.5 text-green-500" />
                                  : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                }
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Durum</span>
                            {v.verified ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Doğrulandı
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-yellow-100 text-yellow-700 text-xs">Bekliyor</Badge>
                                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => markVerified(v)}>
                                  Manuel Onayla
                                </Button>
                              </div>
                            )}
                          </div>
                          {!v.verified && (
                            <p className="text-[11px] text-muted-foreground">
                              Bayiye bu TXT kaydını DNS'e ekletmesini söyleyin. Eklendikten sonra "Manuel Onayla" tuşuna basın veya otomatik kontrol bekleyin.
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
