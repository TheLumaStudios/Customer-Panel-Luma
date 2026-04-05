import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Eye, X } from 'lucide-react'

export function GhostBanner() {
  const [ghostSession, setGhostSession] = useState(null)

  useEffect(() => {
    // Check if current session is a ghost session
    const checkGhost = async () => {
      const ghostId = localStorage.getItem('ghost_session_id')
      if (!ghostId) return

      const { data } = await supabase
        .from('ghost_sessions')
        .select('*, admin:profiles!ghost_sessions_admin_id_fkey(full_name, email)')
        .eq('id', ghostId)
        .eq('is_active', true)
        .single()

      if (data) setGhostSession(data)
    }
    checkGhost()
  }, [])

  const exitGhostMode = async () => {
    localStorage.removeItem('ghost_session_id')
    // Sign out of customer session and redirect to admin
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!ghostSession) return null

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-3 sticky top-0 z-50">
      <Eye className="h-4 w-4" />
      <span>Müşteri görünümündesiniz (Ghost Mode)</span>
      <Button size="sm" variant="secondary" className="h-6 text-xs gap-1" onClick={exitGhostMode}>
        <X className="h-3 w-3" /> Çıkış
      </Button>
    </div>
  )
}
