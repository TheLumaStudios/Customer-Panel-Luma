// Google Ads conversion tracking utility
// Replace AW-5729305733 with your actual Google Ads conversion ID

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'AW-5729305733'

export const pageview = (url) => {
  if (typeof window.gtag !== 'function') return
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url })
}

export const event = (action, params = {}) => {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', action, params)
}

// Track purchase/payment completion
export const trackPurchase = (invoiceId, amount, currency = 'TRY') => {
  event('purchase', {
    transaction_id: invoiceId,
    value: amount,
    currency,
  })
  // Google Ads conversion (replace with actual conversion label)
  event('conversion', {
    send_to: `${GA_MEASUREMENT_ID}/purchase`,
    value: amount,
    currency,
    transaction_id: invoiceId,
  })
}

// Track sign-up
export const trackSignUp = (method = 'email') => {
  event('sign_up', { method })
  event('conversion', {
    send_to: `${GA_MEASUREMENT_ID}/signup`,
  })
}

// Track wallet top-up
export const trackWalletTopUp = (amount) => {
  event('add_to_wallet', { value: amount, currency: 'TRY' })
}

// Track promo code applied
export const trackPromoApplied = (code) => {
  event('promo_applied', { coupon: code })
}