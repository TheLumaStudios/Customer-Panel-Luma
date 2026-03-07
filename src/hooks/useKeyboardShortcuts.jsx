import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'

/**
 * Global keyboard shortcuts hook
 * Handles navigation shortcuts (G + key) and action shortcuts
 */
export function useKeyboardShortcuts({ onHelpOpen }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const handleKeyPress = useCallback((e) => {
    // Ignore if user is typing in input/textarea
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    ) {
      return
    }

    // Help dialog - ? key
    if (e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      onHelpOpen?.()
      return
    }

    // Escape key - close modals/dialogs
    if (e.key === 'Escape') {
      // Let this bubble up naturally to close dialogs
      return
    }

    // Handle "G then key" navigation shortcuts
    if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()

      // Set temporary flag for next key press
      window._gModeActive = true

      // Clear flag after 2 seconds
      setTimeout(() => {
        window._gModeActive = false
      }, 2000)

      return
    }

    // If G mode is active, handle navigation
    if (window._gModeActive) {
      window._gModeActive = false
      e.preventDefault()

      const key = e.key.toLowerCase()

      if (isAdmin) {
        // Admin navigation shortcuts
        switch (key) {
          case 'd':
            navigate('/admin/dashboard')
            break
          case 'c':
            navigate('/admin/customers')
            break
          case 'i':
            navigate('/admin/invoices')
            break
          case 'h':
            navigate('/admin/hosting')
            break
          case 'v':
            navigate('/admin/vds')
            break
          case 'm':
            navigate('/admin/domains')
            break
          case 't':
            navigate('/admin/tickets')
            break
          case 's':
            navigate('/admin/settings')
            break
          case 'p':
            navigate('/admin/hosting-packages')
            break
          case 'r':
            navigate('/admin/servers')
            break
        }
      } else {
        // Customer navigation shortcuts
        switch (key) {
          case 'd':
            navigate('/dashboard')
            break
          case 'm':
            navigate('/domains')
            break
          case 'h':
            navigate('/hosting')
            break
          case 'v':
            navigate('/vds')
            break
          case 'i':
            navigate('/invoices')
            break
          case 't':
            navigate('/tickets')
            break
          case 'p':
            navigate('/profile')
            break
        }
      }
    }
  }, [navigate, isAdmin, onHelpOpen])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window._gModeActive = false
    }
  }, [handleKeyPress])
}
