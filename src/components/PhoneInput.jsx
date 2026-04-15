import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

export default function PhoneInput({ value, onChange, className = '' }) {
  const inputRef = useRef(null)
  const itiRef = useRef(null)
  const [loaded, setLoaded] = useState(!!window.intlTelInput)

  useEffect(() => {
    if (window.intlTelInput) {
      setLoaded(true)
      return
    }

    // Load CSS
    if (!document.querySelector('link[href*="intlTelInput"]')) {
      const css = document.createElement('link')
      css.rel = 'stylesheet'
      css.href = 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/css/intlTelInput.css'
      document.head.appendChild(css)
    }

    // Load JS
    if (!document.querySelector('script[src*="intlTelInput"]')) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/intlTelInput.min.js'
      script.onload = () => setLoaded(true)
      document.head.appendChild(script)
    }
  }, [])

  useEffect(() => {
    if (!loaded || !inputRef.current || itiRef.current) return

    try {
      const iti = window.intlTelInput(inputRef.current, {
        initialCountry: 'tr',
        preferredCountries: ['tr', 'us', 'gb', 'de'],
        separateDialCode: true,
        utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js',
      })

      itiRef.current = iti

      const handleChange = () => {
        const number = iti.getNumber()
        onChange?.(number || inputRef.current.value)
      }

      inputRef.current.addEventListener('input', handleChange)
      inputRef.current.addEventListener('countrychange', handleChange)

      return () => {
        if (inputRef.current) {
          inputRef.current.removeEventListener('input', handleChange)
          inputRef.current.removeEventListener('countrychange', handleChange)
        }
        iti.destroy()
        itiRef.current = null
      }
    } catch {
      // fallback - just use plain input
    }
  }, [loaded])

  // Fallback: plain input until CDN loads
  if (!loaded) {
    return (
      <Input
        type="tel"
        placeholder="05XX XXX XX XX"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 ${className}`}
      />
    )
  }

  return (
    <div className={`iti-dark ${className}`}>
      <input
        ref={inputRef}
        type="tel"
        defaultValue={value}
        className="w-full h-9 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30"
        placeholder="5XX XXX XX XX"
      />
      <style>{`
        .iti-dark .iti { width: 100%; }
        .iti-dark .iti__country-list { background: #0f172a; border-color: #334155; color: #e2e8f0; max-height: 200px; z-index: 100; }
        .iti-dark .iti__country:hover, .iti-dark .iti__country--highlight { background: #1e293b; }
        .iti-dark .iti__selected-country { background: transparent; }
        .iti-dark .iti__selected-dial-code { color: #94a3b8; }
        .iti-dark .iti__arrow { border-top-color: #64748b; }
        .iti-dark .iti__arrow--up { border-bottom-color: #64748b; }
        .iti-dark .iti__search-input { background: #1e293b; border-color: #334155; color: #e2e8f0; }
        .iti-dark .iti__divider { border-bottom-color: #334155; }
      `}</style>
    </div>
  )
}
