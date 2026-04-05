import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCheckoutStore = create(
  persist(
    (set, get) => ({
      // Steps: 'cart' -> 'config' -> 'review' -> 'payment'
      step: 'cart',

      // Cart items
      items: [],

      // Configuration per item
      configurations: {}, // { itemId: { os: 'ubuntu', panel: 'cpanel', ... } }

      // Customer info (for non-logged-in checkout)
      customerInfo: null,

      // Promo code
      promoCode: '',
      promoDiscount: 0,

      // Billing period
      billingPeriod: 'monthly', // monthly, quarterly, semi_annual, annual

      // Actions
      setStep: (step) => set({ step }),

      addItem: (item) => set((state) => {
        if (state.items.find(i => i.id === item.id)) return state
        return { items: [...state.items, item] }
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id),
        configurations: Object.fromEntries(
          Object.entries(state.configurations).filter(([k]) => k !== id)
        ),
      })),

      updateItemConfig: (id, config) => set((state) => ({
        configurations: { ...state.configurations, [id]: { ...state.configurations[id], ...config } },
      })),

      setPromoCode: (code, discount = 0) => set({ promoCode: code, promoDiscount: discount }),

      setBillingPeriod: (period) => set({ billingPeriod: period }),

      setCustomerInfo: (info) => set({ customerInfo: info }),

      // Computed
      getSubtotal: () => {
        const { items, billingPeriod } = get()
        return items.reduce((sum, item) => {
          const price = billingPeriod === 'annual' ? (item.price_annual || item.price_monthly * 12) :
                        billingPeriod === 'semi_annual' ? (item.price_semi_annual || item.price_monthly * 6) :
                        billingPeriod === 'quarterly' ? (item.price_quarterly || item.price_monthly * 3) :
                        item.price_monthly
          return sum + (price || 0)
        }, 0)
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        return subtotal - (subtotal * get().promoDiscount / 100)
      },

      // Reset
      clearCheckout: () => set({
        step: 'cart',
        items: [],
        configurations: {},
        promoCode: '',
        promoDiscount: 0,
        billingPeriod: 'monthly',
      }),
    }),
    {
      name: 'luma-checkout',
      partialize: (state) => ({
        items: state.items,
        configurations: state.configurations,
        billingPeriod: state.billingPeriod,
        promoCode: state.promoCode,
        step: state.step,
      }),
    }
  )
)
