import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth.jsx'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Bell, BellOff, FileText, Server, MessageSquare, Megaphone } from 'lucide-react'

const NOTIFICATION_TYPES = [
  { key: 'invoice_due', label: 'Fatura Bildirimleri', description: 'Yaklaşan ve geciken faturalar', icon: FileText },
  { key: 'server_down', label: 'Sunucu Kesintileri', description: 'Sunucu durumu değişiklikleri', icon: Server },
  { key: 'ticket_reply', label: 'Destek Yanıtları', description: 'Destek talebi güncellemeleri', icon: MessageSquare },
  { key: 'announcement', label: 'Duyurular', description: 'Sistem duyuruları ve kampanyalar', icon: Megaphone },
]

export default function NotificationPreferences() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState({ invoice_due: true, server_down: true, ticket_reply: true, announcement: true })
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPushSupported('serviceWorker' in navigator && 'PushManager' in window)

    const fetchPrefs = async () => {
      if (!user) return
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        setPrefs({
          invoice_due: data.invoice_due ?? true,
          server_down: data.server_down ?? true,
          ticket_reply: data.ticket_reply ?? true,
          announcement: data.announcement ?? true,
        })
      }

      // Check push subscription
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        setPushEnabled(!!sub)
      }
      setLoading(false)
    }
    fetchPrefs()
  }, [user])

  const togglePush = async () => {
    try {
      if (!pushSupported) {
        toast.error('Bu tarayıcı push bildirimleri desteklemiyor')
        return
      }

      const reg = await navigator.serviceWorker.ready

      if (pushEnabled) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()

          const baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
          const functionsUrl = baseUrl.includes('/rest/v1') ? baseUrl.replace('/rest/v1', '/functions/v1') : `${baseUrl}/functions/v1`
          const { data: { session } } = await supabase.auth.getSession()

          await fetch(`${functionsUrl}/push-subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            },
            body: JSON.stringify({ endpoint: sub.endpoint, action: 'unsubscribe' }),
          })
        }
        setPushEnabled(false)
        toast.success('Bildirimler kapatıldı')
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          toast.error('Bildirim izni reddedildi')
          return
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
        })

        const subJson = sub.toJSON()
        const baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
        const functionsUrl = baseUrl.includes('/rest/v1') ? baseUrl.replace('/rest/v1', '/functions/v1') : `${baseUrl}/functions/v1`
        const { data: { session } } = await supabase.auth.getSession()

        await fetch(`${functionsUrl}/push-subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh,
            auth_key: subJson.keys?.auth,
          }),
        })

        setPushEnabled(true)
        toast.success('Bildirimler açıldı')
      }
    } catch (err) {
      console.error('Push toggle error:', err)
      toast.error('Bildirim ayarı değiştirilemedi')
    }
  }

  const savePrefs = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    if (error) toast.error('Kayıt başarısız')
    else toast.success('Tercihler kaydedildi')
    setSaving(false)
  }

  const togglePref = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" /></div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6" /> Bildirim Tercihleri</h1>
        <p className="text-muted-foreground">Push bildirimlerinizi yönetin</p>
      </div>

      {/* Push Toggle */}
      <Card className={pushEnabled ? 'border-green-200 bg-green-50/50' : ''}>
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {pushEnabled ? <Bell className="h-5 w-5 text-green-600" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
              <div>
                <p className="font-medium">Push Bildirimleri</p>
                <p className="text-sm text-muted-foreground">
                  {pushEnabled ? 'Bildirimler aktif' : pushSupported ? 'Bildirimleri etkinleştirin' : 'Bu tarayıcı desteklemiyor'}
                </p>
              </div>
            </div>
            <Button onClick={togglePush} variant={pushEnabled ? 'outline' : 'default'} disabled={!pushSupported}>
              {pushEnabled ? 'Kapat' : 'Aç'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-Type Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bildirim Türleri</CardTitle>
          <CardDescription>Hangi bildirimleri almak istediğinizi seçin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {NOTIFICATION_TYPES.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <button
                onClick={() => togglePref(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs[key] ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={savePrefs} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}</Button>
    </div>
  )
}