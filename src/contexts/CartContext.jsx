import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'customer_panel_cart'

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [currency, setCurrency] = useState('TRY')
  const [promoCode, setPromoCode] = useState('')

  // Persist cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // Ignore storage errors
    }
  }, [cart])

  const addToCart = (item) => {
    setCart(prev => {
      // Check if already in cart
      if (prev.some(i => i.domain === item.domain)) {
        return prev
      }
      return [...prev, item]
    })
  }

  const removeFromCart = (domain) => {
    setCart(prev => prev.filter(item => item.domain !== domain))
  }

  const clearCart = () => {
    setCart([])
  }

  const isInCart = (domain) => {
    return cart.some(item => item.domain === domain)
  }

  const applyPromoCode = (code) => {
    setPromoCode(code)
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)

  const cartCount = cart.length

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        currency,
        setCurrency,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        promoCode,
        applyPromoCode,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
