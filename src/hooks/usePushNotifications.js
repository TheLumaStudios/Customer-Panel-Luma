import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth.jsx'
import { supabase } from '@/lib/supabase'

const baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const FUNCTIONS_URL = baseUrl.includes('/rest/v1')
  ? baseUrl.replace('/rest/v1', '/functions/v1')
  : `${baseUrl}/functions/v1`

export function usePushNotifications() {
  const { user } = useAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)

      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        setIsSubscribed(!!sub)
      })
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return false

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      })

      const subJson = sub.toJSON()
      const { data: { session } } = await supabase.auth.getSession()

      await fetch(`${FUNCTIONS_URL}/push-subscribe`, {
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

      setIsSubscribed(true)
      return true
    } catch (err) {
      console.error('Push subscribe error:', err)
      return false
    }
  }, [isSupported, user])

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()

        const { data: { session } } = await supabase.auth.getSession()
        await fetch(`${FUNCTIONS_URL}/push-subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({ endpoint: sub.endpoint, action: 'unsubscribe' }),
        })
      }

      setIsSubscribed(false)
      return true
    } catch (err) {
      console.error('Push unsubscribe error:', err)
      return false
    }
  }, [isSupported])

  return { isSupported, isSubscribed, permission, subscribe, unsubscribe }
}
