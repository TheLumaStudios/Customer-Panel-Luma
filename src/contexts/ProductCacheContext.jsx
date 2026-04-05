import { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

const CACHE_KEY = 'luma_product_packages'
const CACHE_TTL = 5 * 60 * 1000 // 5 dakika

const ProductCacheContext = createContext(null)

function getCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed
  } catch {
    return null
  }
}

function setCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      updatedAt: Date.now(),
    }))
  } catch {
    // localStorage full or unavailable
  }
}

export function ProductCacheProvider({ children }) {
  const [packages, setPackages] = useState(() => {
    const cached = getCachedData()
    return cached?.data || []
  })
  const [ready, setReady] = useState(() => {
    return getCachedData()?.data?.length > 0
  })
  const fetching = useRef(false)

  const fetchAll = useCallback(async () => {
    if (fetching.current) return
    fetching.current = true
    try {
      const { data, error } = await supabase
        .from('product_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (!error && data) {
        setPackages(data)
        setCachedData(data)
        setReady(true)
      }
    } catch {
      // silent fail - use cache
    } finally {
      fetching.current = false
    }
  }, [])

  // İlk açılışta fetch et
  useEffect(() => {
    const cached = getCachedData()
    const isStale = !cached || (Date.now() - (cached.updatedAt || 0)) > CACHE_TTL

    if (isStale) {
      fetchAll()
    } else if (cached?.data?.length > 0) {
      setPackages(cached.data)
      setReady(true)
      // Arka planda güncelle
      setTimeout(fetchAll, 1000)
    } else {
      fetchAll()
    }
  }, [fetchAll])

  // Her 5 dakikada bir arka planda güncelle
  useEffect(() => {
    const interval = setInterval(fetchAll, CACHE_TTL)
    return () => clearInterval(interval)
  }, [fetchAll])

  const getByType = useCallback((productType) => {
    return packages.filter(p => p.product_type === productType)
  }, [packages])

  const getById = useCallback((id) => {
    return packages.find(p => p.id === id)
  }, [packages])

  const getBySlug = useCallback((slug) => {
    return packages.find(p => p.slug === slug)
  }, [packages])

  // Sipariş öncesi fiyat doğrulama - DB'den taze veri çeker
  const verifyPrice = useCallback(async (packageId) => {
    const { data, error } = await supabase
      .from('product_packages')
      .select('id, name, price_monthly, price_original, is_active')
      .eq('id', packageId)
      .single()
    if (error || !data) return { valid: false, error: 'Paket bulunamadı' }
    if (!data.is_active) return { valid: false, error: 'Bu paket artık mevcut değil' }
    return { valid: true, package: data }
  }, [])

  const refresh = useCallback(() => fetchAll(), [fetchAll])

  return (
    <ProductCacheContext.Provider value={{ packages, ready, getByType, getById, getBySlug, verifyPrice, refresh }}>
      {children}
    </ProductCacheContext.Provider>
  )
}

export function useProductCache(productType) {
  const ctx = useContext(ProductCacheContext)
  if (!ctx) {
    throw new Error('useProductCache must be used within ProductCacheProvider')
  }
  if (productType) {
    return { ...ctx, packages: ctx.getByType(productType) }
  }
  return ctx
}
