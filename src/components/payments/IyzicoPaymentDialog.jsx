import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ShieldCheck, Lock, Loader2, X } from 'lucide-react'

/**
 * Reusable iyzico payment dialog.
 *
 * Two rendering modes:
 *  1. `paymentPageUrl` (iframe, cross-origin hosted by iyzico)
 *  2. `htmlContent` — the raw snippet iyzico returns; we parse it and
 *     re-create <script> elements so they actually execute (React's
 *     dangerouslySetInnerHTML does NOT run scripts).
 */
export default function IyzicoPaymentDialog({
  open,
  onOpenChange,
  paymentPageUrl,
  htmlContent,
  title = 'Güvenli Ödeme',
  description = 'Kart bilgileriniz iyzico altyapısı üzerinden SSL ile şifrelenir',
}) {
  const hostRef = useRef(null)
  const [scriptReady, setScriptReady] = useState(false)

  useEffect(() => {
    if (!open) {
      setScriptReady(false)
      return
    }
    if (paymentPageUrl) return
    if (!htmlContent || !hostRef.current) return

    setScriptReady(false)
    const host = hostRef.current
    host.innerHTML = ''

    const template = document.createElement('template')
    template.innerHTML = htmlContent

    // Move non-script nodes into host
    Array.from(template.content.childNodes).forEach(n => {
      if (n.nodeType === 1 && n.tagName === 'SCRIPT') return
      host.appendChild(n.cloneNode(true))
    })

    // Re-execute scripts
    let pending = 0
    const markReady = () => {
      pending -= 1
      if (pending <= 0) setScriptReady(true)
    }
    const scripts = Array.from(template.content.querySelectorAll('script'))
    if (scripts.length === 0) setScriptReady(true)

    scripts.forEach(src => {
      const s = document.createElement('script')
      for (const attr of src.attributes) s.setAttribute(attr.name, attr.value)
      if (src.src) {
        pending += 1
        s.onload = markReady
        s.onerror = markReady
      }
      s.text = src.textContent || ''
      host.appendChild(s)
    })

    // Also consider inline scripts "ready" immediately so the spinner
    // doesn't linger when iyzico only injects an inline bootstrapper.
    if (pending === 0) setScriptReady(true)

    return () => {
      host.innerHTML = ''
    }
  }, [open, htmlContent, paymentPageUrl])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden border-0 bg-background w-[95vw] max-w-[560px] max-h-[92vh] rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="relative px-6 pt-5 pb-4 border-b bg-gradient-to-r from-primary/5 via-background to-background">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold leading-tight">
                {title}
              </DialogTitle>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {description}
              </p>
            </div>
            <button
              type="button"
              aria-label="Kapat"
              onClick={() => onOpenChange(false)}
              className="shrink-0 w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" /> SSL Şifreli
            </span>
            <span className="h-3 w-px bg-border" />
            <span>3D Secure</span>
            <span className="h-3 w-px bg-border" />
            <span>PCI-DSS</span>
          </div>
        </div>

        {/* Body */}
        <div className="relative bg-white dark:bg-zinc-950 h-[640px]">
          {/* Loading overlay */}
          {!paymentPageUrl && !scriptReady && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Güvenli ödeme formu yükleniyor...
              </p>
            </div>
          )}

          {paymentPageUrl ? (
            <iframe
              src={paymentPageUrl}
              title="iyzico Checkout"
              className="w-full h-full border-0"
              allow="payment *"
            />
          ) : (
            <div
              ref={hostRef}
              className="w-full h-full overflow-y-auto px-4 py-4 [&_iframe]:w-full [&_iframe]:min-h-[620px] [&_iframe]:border-0"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Ödeme altyapısı: <b className="text-foreground">iyzico</b></span>
          <span>Vazgeçmek için dialog'u kapatabilirsiniz</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
