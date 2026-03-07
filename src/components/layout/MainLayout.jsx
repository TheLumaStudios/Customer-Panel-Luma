import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import CommandPalette from './CommandPalette'
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function MainLayout() {
  const [helpOpen, setHelpOpen] = useState(false)

  // Enable global keyboard shortcuts
  useKeyboardShortcuts({
    onHelpOpen: () => setHelpOpen(true)
  })

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <KeyboardShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  )
}
