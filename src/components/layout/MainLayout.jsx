import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from './AppHeader'
import CommandPalette from './CommandPalette'
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useGlobalHotkeys } from '@/hooks/useGlobalHotkeys'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'
import { GhostBanner } from '@/components/shared/GhostBanner'

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

      {/* Ana İçerik */}
      <main className="max-w-[1600px] mx-auto p-5">
        <Outlet />
      </main>

      <CommandPalette />
      <KeyboardShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  )
}
