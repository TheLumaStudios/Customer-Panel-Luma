// Meta Pixel (Facebook Pixel) Event Helpers
// Pixel ID: VITE_META_PIXEL_ID env değişkeninden alınır
// Cookie consent kontrolü ile birlikte çalışır

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID

function fbq(...args) {
  if (typeof window.fbq !== 'function') return
  window.fbq(...args)
}

// Pixel'i başlat (cookie consent sonrası çağrılır)
export function initPixel() {
  if (!PIXEL_ID) return
  if (typeof window.fbq !== 'function') return
  fbq('init', PIXEL_ID)
  fbq('track', 'PageView')
}

// Sayfa görüntüleme
export function pageView() {
  if (!PIXEL_ID) return
  fbq('track', 'PageView')
}

// Ürün sayfası görüntüleme
// content_ids → ürün slug'ları (Meta katalogdaki retailer_id ile eşleşmeli)
export function viewContent({ contentId, contentName, contentType = 'product', value, currency = 'TRY' }) {
  if (!PIXEL_ID) return
  fbq('track', 'ViewContent', {
    content_ids: [contentId],
    content_name: contentName,
    content_type: contentType,
    value,
    currency,
  })
}

// Sepete ekleme
export function addToCart({ contentId, contentName, contentType = 'product', value, currency = 'TRY' }) {
  if (!PIXEL_ID) return
  fbq('track', 'AddToCart', {
    content_ids: [contentId],
    content_name: contentName,
    content_type: contentType,
    value,
    currency,
  })
}

// Ödeme başlatma
export function initiateCheckout({ contentIds = [], numItems, value, currency = 'TRY' }) {
  if (!PIXEL_ID) return
  fbq('track', 'InitiateCheckout', {
    content_ids: contentIds,
    num_items: numItems,
    value,
    currency,
  })
}

// Satın alma tamamlama
export function purchase({ orderId, value, currency = 'TRY', contentIds = [], contentType = 'product' }) {
  if (!PIXEL_ID) return
  fbq('track', 'Purchase', {
    order_id: orderId,
    value,
    currency,
    content_ids: contentIds,
    content_type: contentType,
  })
}

// Kayıt tamamlama
export function completeRegistration() {
  if (!PIXEL_ID) return
  fbq('track', 'CompleteRegistration')
}
