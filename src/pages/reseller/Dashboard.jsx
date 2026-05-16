import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useResellerAccount } from '@/hooks/useResellerAccount'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Users, TrendingUp, Wallet, Store, Globe, CheckCircle,
  Clock, AlertCircle, ShieldCheck, Copy, Check, Edit2, X, Save,
  ArrowUpRight, BarChart3, Percent,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary', border }) {
  return (
    <Card className={`rounded-xl ${border || ''}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-0.5">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-muted`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ResellerDashboard() {
  const { resellerAccount, loading: accountLoading } = useResellerAccount()
  const [customers, setCustomers] = useState([])
  const [earnings, setEarnings] = useState([])
  const [editingBrand, setEditingBrand] = useState(false)
  const [brandForm, setBrandForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [copiedDomain, setCopiedDomain] = useState(false)

  useEffect(() => {
    if (!resellerAccount?.id) return
    fetchData()
  }, [resellerAccount?.id])

  useEffect(() => {
    if (resellerAccount) {
      setBrandForm({
        brand_name: resellerAccount.brand_name || '',
        brand_primary_color: resellerAccount.brand_primary_color || '#4F46E5',
        brand_secondary_color: resellerAccount.brand_secondary_color || '#7C3AED',
        brand_footer_text: resellerAccount.brand_footer_text || '',
        brand_logo_url: resellerAccount.brand_logo_url || '',
        contact_phone: resellerAccount.contact_phone || '',
      })
    }
  }, [resellerAccount])

  const fetchData = async () => {
    const [{ data: custs }, { data: earn }] = await Promise.all([
      supabase
        .from('customers')
        .select('id, full_name, email, created_at, status')
        .eq('reseller_id', resellerAccount.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('reseller_earnings')
        .select('*, invoices(invoice_number, total_amount)')
        .eq('reseller_id', resellerAccount.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setCustomers(custs || [])
    setEarnings(earn || [])
  }

  const saveBrand = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('resellers')
      .update({ ...brandForm, updated_at: new Date().toISOString() })
      .eq('id', resellerAccount.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Marka ayarları kaydedildi')
    setEditingBrand(false)
    // Sayfayı yenile ki CSS değişkenleri güncellensin
    window.location.reload()
  }

  if (accountLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    )
  }

  if (!resellerAccount) return null

  const totalEarned = earnings.reduce((s, e) => s + Number(e.earned_amount), 0)
  const pendingEarned = earnings.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.earned_amount), 0)
  const paidEarned = earnings.filter(e => e.status === 'paid').reduce((s, e) => s + Number(e.earned_amount), 0)
  const totalSales = earnings.reduce((s, e) => s + Number(e.gross_amount), 0)

  const marginLabel = resellerAccount.margin_type === 'percent'
    ? `%${resellerAccount.margin_value}`
    : `₺${resellerAccount.margin_value} sabit`

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Başlık */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            {resellerAccount.brand_name || resellerAccount.company_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Bayi Paneli</p>
        </div>
        <Badge
          className={
            resellerAccount.status === 'active'
              ? 'bg-green-100 text-green-700'
              : resellerAccount.status === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }
        >
          {resellerAccount.status === 'active' ? 'Aktif' : resellerAccount.status === 'pending' ? 'Onay Bekliyor' : 'Askıya Alındı'}
        </Badge>
      </div>

      {/* Stat Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Toplam Müşteri"
          value={customers.length}
          sub="Bayin üzerinden kayıt"
          color="text-blue-600"
        />
        <StatCard
          icon={BarChart3}
          label="Toplam Ciro"
          value={`₺${totalSales.toFixed(2)}`}
          sub="Tüm zamanlar"
          color="text-indigo-600"
        />
        <StatCard
          icon={Wallet}
          label="Bekleyen Kazanç"
          value={`₺${pendingEarned.toFixed(2)}`}
          sub={`Toplam: ₺${totalEarned.toFixed(2)}`}
          color="text-violet-600"
          border="border-violet-200"
        />
        <StatCard
          icon={TrendingUp}
          label="Ödenen Kazanç"
          value={`₺${paidEarned.toFixed(2)}`}
          sub="Hesabınıza aktarıldı"
          color="text-green-600"
        />
      </div>

      {/* Panel Domain ve Kar Oranı */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Panel Domain'im
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resellerAccount.domain ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg">
                  <code className="flex-1 text-sm font-mono">{resellerAccount.domain}</code>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(resellerAccount.domain)
                      setCopiedDomain(true)
                      setTimeout(() => setCopiedDomain(false), 2000)
                    }}
                    className="p-1.5 hover:bg-muted rounded"
                  >
                    {copiedDomain ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">DNS CNAME kaydını bu domain'e yönlendir: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">panel.luma.com.tr</code></span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Henüz domain tanımlanmamış. Luma ekibiyle iletişime geçin.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Kar Marjım
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                <span className="text-sm text-muted-foreground">Her satıştan kazanıyorum</span>
                <span className="text-2xl font-bold text-primary">{marginLabel}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {resellerAccount.margin_type === 'percent'
                  ? `Müşteri ₺100 ödediğinde sen ₺${resellerAccount.margin_value} kazanırsın.`
                  : `Her satıştan sabit ₺${resellerAccount.margin_value} kazanırsın.`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marka Ayarları */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Store className="h-4 w-4" />
                Marka Ayarlarım
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Müşterilerinin gördüğü panel görünümü</CardDescription>
            </div>
            {editingBrand ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingBrand(false)}>
                  <X className="h-3.5 w-3.5 mr-1" /> İptal
                </Button>
                <Button size="sm" onClick={saveBrand} disabled={saving}>
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditingBrand(true)}>
                <Edit2 className="h-3.5 w-3.5 mr-1" /> Düzenle
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingBrand ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Marka Adı</Label>
                <Input value={brandForm.brand_name} onChange={e => setBrandForm(f => ({ ...f, brand_name: e.target.value }))} placeholder="Müşterilerin göreceği isim" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Logo URL</Label>
                <Input value={brandForm.brand_logo_url} onChange={e => setBrandForm(f => ({ ...f, brand_logo_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ana Renk</Label>
                <div className="flex gap-2">
                  <input type="color" value={brandForm.brand_primary_color} onChange={e => setBrandForm(f => ({ ...f, brand_primary_color: e.target.value }))} className="h-9 w-10 rounded border cursor-pointer" />
                  <Input value={brandForm.brand_primary_color} onChange={e => setBrandForm(f => ({ ...f, brand_primary_color: e.target.value }))} className="font-mono" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">İkincil Renk</Label>
                <div className="flex gap-2">
                  <input type="color" value={brandForm.brand_secondary_color} onChange={e => setBrandForm(f => ({ ...f, brand_secondary_color: e.target.value }))} className="h-9 w-10 rounded border cursor-pointer" />
                  <Input value={brandForm.brand_secondary_color} onChange={e => setBrandForm(f => ({ ...f, brand_secondary_color: e.target.value }))} className="font-mono" />
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Alt Bilgi Metni</Label>
                <Input value={brandForm.brand_footer_text} onChange={e => setBrandForm(f => ({ ...f, brand_footer_text: e.target.value }))} placeholder="© 2026 Marka Adım — Tüm hakları saklıdır." />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Marka Adı</p>
                <p className="text-sm font-medium">{resellerAccount.brand_name || resellerAccount.company_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Ana Renk</p>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded border" style={{ backgroundColor: resellerAccount.brand_primary_color }} />
                  <code className="text-xs">{resellerAccount.brand_primary_color}</code>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">İkincil Renk</p>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded border" style={{ backgroundColor: resellerAccount.brand_secondary_color }} />
                  <code className="text-xs">{resellerAccount.brand_secondary_color}</code>
                </div>
              </div>
              {resellerAccount.brand_logo_url && (
                <div className="md:col-span-3">
                  <p className="text-xs text-muted-foreground mb-1">Logo</p>
                  <img src={resellerAccount.brand_logo_url} alt="logo" className="h-8 object-contain" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Müşterilerim */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Müşterilerim
            <Badge variant="outline" className="ml-1">{customers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Henüz müşteriniz yok.</p>
              <p className="text-xs mt-1">Domain'inize gelen ziyaretçiler kayıt olunca burada görünür.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{c.full_name || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                    <TableCell>
                      <Badge
                        className={c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
                      >
                        {c.status === 'active' ? 'Aktif' : c.status || 'Aktif'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Kazanç Geçmişi */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Kazanç Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Wallet className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Henüz kazanç kaydı yok.</p>
              <p className="text-xs mt-1">Müşterileriniz ödeme yaptıkça burada görünür.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Ciro</TableHead>
                  <TableHead>Oran</TableHead>
                  <TableHead>Kazancım</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(e.created_at)}</TableCell>
                    <TableCell className="text-sm font-mono text-xs">
                      {e.invoices?.invoice_number || e.invoice_id?.slice(0, 8) + '…'}
                    </TableCell>
                    <TableCell className="text-sm">₺{Number(e.gross_amount).toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      %{(Number(e.margin_pct) * 100).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-violet-700">
                      +₺{Number(e.earned_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {e.status === 'paid' ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> Ödendi
                        </Badge>
                      ) : e.status === 'pending' ? (
                        <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                          <Clock className="h-3 w-3 mr-1" /> Bekliyor
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 text-xs">İptal</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
