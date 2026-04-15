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
      promoValidated: false,
      promoLoading: false,
      promoError: '',
      promoDetails: null, // { discount_type, discount_value, calculated_discount, is_first_month_free, promo_code_id }

      // Billing period
      billingPeriod: 'monthly', // monthly, quarterly, semi_annual, annual

// Outstanding unpaid invoice ID (for retry/reuse across the iyzico
// payment dialog). Cleared whenever cart contents change or on
// successful payment.
      currentInvoiceId: null,

      // Actions
      setStep: (step) => set({ step }),

      addItem: (item) => set((state) => {
        if (state.items.find(i => i.id === item.id)) return state
// Any cart change invalidates a cached draft invoice
        return { items: [...state.items, item], currentInvoiceId: null }
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id),
        configurations: Object.fromEntries(
          Object.entries(state.configurations).filter(([k]) => k !== id)
        ),
        currentInvoiceId: null,
      })),

      updateItemConfig: (id, config) => set((state) => ({
        configurations: { ...state.configurations, [id]: { ...state.configurations[id], ...config } },
        currentInvoiceId: null,
      })),

      setPromoCode: (code, discount = 0) => set({ promoCode: code, promoDiscount: discount }),

      validatePromoCode: async (code) => {
        set({ promoLoading: true, promoError: '', promoValidated: false, promoDetails: null })
        try {
          const baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
          const functionsUrl = baseUrl.includes('/rest/v1')
            ? baseUrl.replace('/rest/v1', '/functions/v1')
            : `${baseUrl}/functions/v1`
          const subtotal = get().getSubtotal()
          const res = await fetch(`${functionsUrl}/promo-validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '' },
            body: JSON.stringify({ code, subtotal }),
          })
          const data = await res.json()
          if (data.valid) {
            const discount = data.discount_type === 'percentage' ? data.discount_value : 0
            set({
              promoValidated: true,
              promoLoading: false,
              promoCode: code.toUpperCase(),
              promoDiscount: discount,
              promoDetails: data,
              currentInvoiceId: null,
            })
            return data
          } else {
            set({ promoLoading: false, promoError: data.error || 'Geçersiz kod' })
            return null
          }
        } catch {
          set({ promoLoading: false, promoError: 'Doğrulama başarısız' })
          return null
        }
      },

      clearPromo: () => set({
        promoCode: '',
        promoDiscount: 0,
        promoValidated: false,
        promoLoading: false,
        promoError: '',
        promoDetails: null,
        currentInvoiceId: null,
      }),

      setBillingPeriod: (period) => set({ billingPeriod: period, currentInvoiceId: null }),

      setCurrentInvoiceId: (id) => set({ currentInvoiceId: id }),

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
        promoValidated: false,
        promoLoading: false,
        promoError: '',
        promoDetails: null,
        billingPeriod: 'monthly',
        currentInvoiceId: null,
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
        currentInvoiceId: state.currentInvoiceId,
      }),
    }
  )
)
