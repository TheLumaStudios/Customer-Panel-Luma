import { useEffect, useRef, useCallback } from 'react'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAC-G4EIfh7sX5Q6j'

export default function Turnstile({ onVerify, onExpire, onError, theme = 'auto', className = '' }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return
    // Clean up previous widget
    if (widgetIdRef.current !== null) {
      try { window.turnstile.remove(widgetIdRef.current) } catch {}
      widgetIdRef.current = null
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token) => onVerify?.(token),
      'expired-callback': () => {
        onExpire?.()
        onVerify?.('')
      },
      'error-callback': () => {
        onError?.()
        onVerify?.('')
      },
      theme,
      language: 'tr',
    })
  }, [onVerify, onExpire, onError, theme])

  useEffect(() => {
    // If turnstile script is already loaded
    if (window.turnstile) {
      renderWidget()
      return
    }

    // Load script
    const existingScript = document.querySelector('script[src*="turnstile"]')
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.onload = () => renderWidget()
      document.head.appendChild(script)
    } else {
      // Script exists but may still be loading
      existingScript.addEventListener('load', renderWidget)
    }

    return () => {
      if (widgetIdRef.current !== null) {
        try { window.turnstile?.remove(widgetIdRef.current) } catch {}
        widgetIdRef.current = null
      }
    }
  }, [renderWidget])

  return <div ref={containerRef} className={className} />
}

// Helper to reset the widget (useful after form submission errors)
export function resetTurnstile() {
  if (window.turnstile) {
    try { window.turnstile.reset() } catch {}
  }
}
