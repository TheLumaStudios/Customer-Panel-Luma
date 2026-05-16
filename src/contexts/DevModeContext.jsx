import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const DevModeContext = createContext(null)

export function DevModeProvider({ children }) {
  const [devMode, setDevMode] = useState(() => {
    try { return localStorage.getItem('luma_dev_mode') === 'true' } catch { return false }
  })

  const toggle = useCallback(() => {
    setDevMode(prev => {
      const next = !prev
      try { localStorage.setItem('luma_dev_mode', String(next)) } catch {}
      return next
    })
  }, [])

  // Klavye kısayolu: Ctrl+Shift+D
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') { e.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle])

  return (
    <DevModeContext.Provider value={{ devMode, toggle }}>
      {children}
    </DevModeContext.Provider>
  )
}

export function useDevMode() {
  const ctx = useContext(DevModeContext)
  if (!ctx) throw new Error('useDevMode must be used within DevModeProvider')
  return ctx
}
