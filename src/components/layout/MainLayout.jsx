import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from './AppHeader'
import CommandPalette from './CommandPalette'
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useGlobalHotkeys } from '@/hooks/useGlobalHotkeys'
import { supabase } from '@/lib/supabase'
import { X, Bell, Terminal } from 'lucide-react'
import { GhostBanner } from '@/components/shared/GhostBanner'
import IdCardUploadGate from '@/components/kyc/IdCardUploadGate'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useDevMode } from '@/contexts/DevModeContext'
import { useAuth } from '@/hooks/useAuth.jsx'

const announcementColors = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
  maintenance: 'bg-gray-50 border-gray-200 text-gray-800',
}

export default function MainLayout() {
  const [helpOpen, setHelpOpen] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [dismissedIds, setDismissedIds] = useState([])
  const [pushBannerDismissed, setPushBannerDismissed] = useState(() => localStorage.getItem('luma-push-dismissed') === '1')
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe: pushSubscribe } = usePushNotifications()
  const { devMode, toggle: toggleDevMode } = useDevMode()
  const { profile } = useAuth()
  const isCustomer = profile?.role === 'customer'

  useKeyboardShortcuts({
    onHelpOpen: () => setHelpOpen(true)
  })

  useGlobalHotkeys()

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('created_at', { ascending: false })

      if (data) setAnnouncements(data)
    }
    fetchAnnouncements()
  }, [])

  const dismissAnnouncement = (id) => {
    setDismissedIds(prev => [...prev, id])
  }

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id))

  return (
    <div className="min-h-screen bg-background">
      <GhostBanner />
      <AppHeader />

      {/* Duyuru Banner'ları */}
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={`flex items-center justify-between px-5 py-2 border-b text-sm ${announcementColors[announcement.type] || announcementColors.info}`}
        >
          <span className="font-medium">{announcement.title}: {announcement.content}</span>
          <button
            onClick={() => dismissAnnouncement(announcement.id)}
            className="ml-4 p-1 rounded hover:bg-black/10 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {/* Push Notification Banner */}
      {pushSupported && !pushSubscribed && !pushBannerDismissed && (
        <div className="flex items-center justify-between px-5 py-2.5 border-b bg-indigo-50 border-indigo-200 text-sm text-indigo-800">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Bildirimleri açarak fatura hatırlatmaları ve sunucu durumu güncellemelerini anında alın.</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button
              onClick={async () => {
                const ok = await pushSubscribe()
                if (ok) setPushBannerDismissed(true)
              }}
              className="px-3 py-1 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
            >
              Bildirimleri Aç
            </button>
            <button
              onClick={() => { setPushBannerDismissed(true); localStorage.setItem('luma-push-dismissed', '1') }}
              className="p-1 rounded hover:bg-black/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* DevMode Banner — sadece müşteri panelinde */}
      {isCustomer && devMode && (
        <div className="flex items-center justify-between px-5 py-2 border-b bg-violet-50 border-violet-300 text-sm text-violet-900">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-violet-600" />
            <span className="font-medium">Geliştirici Modu aktif</span>
            <span className="text-violet-600 text-xs">— Sayfalarda API endpoint'leri ve curl örnekleri görünür. Kapatmak için tekrar tıkla veya Ctrl+Shift+D.</span>
          </div>
          <button
            onClick={toggleDevMode}
            className="p-1 rounded hover:bg-violet-100 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Ana İçerik */}
      <main className="max-w-[1600px] mx-auto p-5">
        <Outlet />
      </main>

      <CommandPalette />
      <KeyboardShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <IdCardUploadGate />
    </div>
  )
}
