import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Cookie, X } from 'lucide-react'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slide-up">
      <div className="container max-w-5xl mx-auto">
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Icon & Text */}
          <div className="flex items-start gap-3 flex-1">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Cookie className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Web sitemizde deneyiminizi iyileştirmek, trafik analizi yapmak ve hizmetlerimizi geliştirmek amacıyla çerezler kullanmaktayız.
                {' '}<Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">Gizlilik Politikası</Link> ve
                {' '}<Link to="/kvkk" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">KVKK Aydınlatma Metni</Link>'ni
                {' '}inceleyebilirsiniz.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReject}
              className="text-slate-400 hover:text-white hover:bg-slate-800 flex-1 md:flex-initial"
            >
              Reddet
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="bg-indigo-600 hover:bg-indigo-500 flex-1 md:flex-initial px-6"
            >
              Kabul Et
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
