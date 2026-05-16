/**
 * ResellerContext
 *
 * Sayfa yüklendiğinde window.location.hostname'i okur.
 * Eğer bu hostname resellers tablosundaki bir domain ile eşleşiyorsa
 * o bayinin marka ayarlarını çekip tüm uygulamaya sağlar.
 *
 * Bayi domain'i yoksa (yani luma'nın kendi domain'i) context null döner.
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const ResellerContext = createContext(null)

// Luma'nın kendi domain'leri — bunlar reseller kontrolünden muaf
const LUMA_DOMAINS = ['localhost', '127.0.0.1', 'luma.com.tr', 'www.luma.com.tr', 'panel.luma.com.tr']

export function ResellerProvider({ children }) {
  const [reseller, setReseller] = useState(null)   // null = Luma kendi paneli
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hostname = window.location.hostname

    // Luma'nın kendi domain'iyse reseller kontrolü yapma
    if (LUMA_DOMAINS.includes(hostname)) {
      setLoading(false)
      return
    }

    // Domain'e göre bayi sorgula (anon erişim — public RLS politikası gerekiyor)
    supabase
      .from('resellers')
      .select('id, company_name, brand_name, brand_logo_url, brand_primary_color, brand_secondary_color, brand_footer_text, brand_favicon_url, status')
      .eq('domain', hostname)
      .eq('status', 'active')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setReseller(data)
        setLoading(false)
      })
  }, [])

  // Bayi renkleri CSS değişkeni olarak enjekte et
  useEffect(() => {
    if (!reseller) return

    const root = document.documentElement

    // Hex → HSL dönüşümü (Tailwind CSS variable formatı)
    const hexToHsl = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      let h, s, l = (max + min) / 2
      if (max === min) { h = s = 0 }
      else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
    }

    if (reseller.brand_primary_color?.startsWith('#')) {
      root.style.setProperty('--primary', hexToHsl(reseller.brand_primary_color))
    }
    if (reseller.brand_secondary_color?.startsWith('#')) {
      root.style.setProperty('--secondary', hexToHsl(reseller.brand_secondary_color))
    }

    // Favicon değiştir
    if (reseller.brand_favicon_url) {
      const link = document.querySelector("link[rel~='icon']") || document.createElement('link')
      link.rel = 'icon'
      link.href = reseller.brand_favicon_url
      document.head.appendChild(link)
    }

    // Sayfa başlığı
    if (reseller.brand_name || reseller.company_name) {
      document.title = reseller.brand_name || reseller.company_name
    }

    // Cleanup: sayfa kapanınca Luma'nın renklerini geri yükle
    return () => {
      root.style.removeProperty('--primary')
      root.style.removeProperty('--secondary')
      document.title = 'Luma Panel'
    }
  }, [reseller])

  return (
    <ResellerContext.Provider value={{ reseller, isReseller: !!reseller, loading }}>
      {children}
    </ResellerContext.Provider>
  )
}

export function useReseller() {
  return useContext(ResellerContext)
}
