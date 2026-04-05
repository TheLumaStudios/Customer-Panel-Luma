import { createContext, useContext, useState, useCallback } from 'react'

const CustomerViewContext = createContext(null)

const STORAGE_KEY = 'luma_customer_view'

export function CustomerViewProvider({ children }) {
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'all' // 'all' | 'software' | 'host'
  })

  const changeView = useCallback((mode) => {
    setViewMode(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }, [])

  // Filter helper - sayfalar bunu kullanarak müşteri listesini filtreleyebilir
  const filterByType = useCallback((items, customerTypeField = 'customer_type') => {
    if (viewMode === 'all') return items
    return (items || []).filter(item => item[customerTypeField] === viewMode)
  }, [viewMode])

  return (
    <CustomerViewContext.Provider value={{ viewMode, changeView, filterByType }}>
      {children}
    </CustomerViewContext.Provider>
  )
}

export function useCustomerView() {
  const ctx = useContext(CustomerViewContext)
  if (!ctx) {
    throw new Error('useCustomerView must be used within CustomerViewProvider')
  }
  return ctx
}
