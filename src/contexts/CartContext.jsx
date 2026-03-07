import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [currency, setCurrency] = useState('TRY')

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
