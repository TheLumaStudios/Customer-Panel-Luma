import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Webhook, Copy, Plus, Trash2, Clock } from 'lucide-react'

export function DeployHooks({ customerId, hostingId, vdsId }) {
  const [hooks, setHooks] = useState([])

  const fetchHooks = async () => {
    let query = supabase.from('deploy_hooks').select('*').eq('customer_id', customerId)
    if (hostingId) query = query.eq('hosting_id', hostingId)
    if (vdsId) query = query.eq('vds_id', vdsId)
    const { data } = await query.order('created_at', { ascending: false })
    setHooks(data || [])
  }

  useEffect(() => { if (customerId) fetchHooks() }, [customerId, hostingId, vdsId])

  const createHook = async () => {
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 8)
    await supabase.from('deploy_hooks').insert({
      customer_id: customerId,
      hosting_id: hostingId || null,
      vds_id: vdsId || null,
      hook_token: token,
      name: `Deploy Hook ${hooks.length + 1}`,
    })
    toast.success('Deploy hook oluşturuldu')
    fetchHooks()
  }

  const deleteHook = async (id) => {
    if (!confirm('Bu deploy hook silinecek. Emin misiniz?')) return
    await supabase.from('deploy_hooks').delete().eq('id', id)
    toast.success('Silindi')
    fetchHooks()
  }

  const copyUrl = (token) => {
    const url = `${window.location.origin}/api/deploy/${token}`
    navigator.clipboard.writeText(url)
    toast.success('URL kopyalandı')
  }

  return (
    <Card className="rounded-xl shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Webhook className="h-5 w-5" />
              Deploy Hooks
            </CardTitle>
            <CardDescription>GitHub/GitLab push'ta otomatik deploy için webhook URL'leri</CardDescription>
          </div>
          <Button size="sm" className="gap-1.5" onClick={createHook}>
            <Plus className="h-3.5 w-3.5" /> Yeni Hook
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hooks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Henüz deploy hook yok</p>
        ) : (
          <div className="space-y-3">
            {hooks.map((hook) => (
              <div key={hook.id} className="flex items-center gap-3 p-3 border rounded-lg group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{hook.name}</span>
                    <Badge variant="outline" className="text-[10px]">{hook.branch}</Badge>
                    {hook.last_triggered_at && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {format(new Date(hook.last_triggered_at), 'd MMM HH:mm', { locale: tr })}
                      </span>
                    )}
                  </div>
                  <code className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 block truncate">
                    {window.location.origin}/api/deploy/{hook.hook_token}
                  </code>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyUrl(hook.hook_token)} title="Kopyala">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteHook(hook.id)} title="Sil">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
