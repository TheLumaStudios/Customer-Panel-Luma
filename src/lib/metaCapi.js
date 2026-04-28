// Meta Conversions API - Frontend client
// Edge function üzerinden sunucu tarafında event gönderir
// Browser pixel ile event_id üzerinden deduplicate edilir

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const CAPI_URL = SUPABASE_URL.includes('/rest/v1')
  ? SUPABASE_URL.replace('/rest/v1', '/functions/v1/meta-capi')
  : `${SUPABASE_URL}/functions/v1/meta-capi`

// _fbp ve _fbc cookie'lerini oku
function getFbCookies() {
  const cookies = document.cookie.split(';').reduce((acc, c) => {
    const [k, v] = c.trim().split('=')
    acc[k] = v
    return acc
  }, {})
  return {
    fbp: cookies['_fbp'] || undefined,
    fbc: cookies['_fbc'] || undefined,
  }
}

async function sendCapi(eventName, userData = {}, customData = {}, eventId = null) {
  try {
    const { fbp, fbc } = getFbCookies()
    await fetch(CAPI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId || crypto.randomUUID(),
        event_source_url: window.location.href,
        client_user_agent: navigator.userAgent,
        fbp,
        fbc,
        ...userData,
        custom_data: customData,
      }),
    })
  } catch (err) {
    console.warn('CAPI error (non-critical):', err)
  }
}

// Satın alma tamamlandı
export function capiPurchase({ orderId, value, currency = 'TRY', contentIds = [], email, phone, firstName, lastName }) {
  return sendCapi('Purchase',
    { email, phone, first_name: firstName, last_name: lastName },
    { order_id: orderId, value, currency, content_ids: contentIds, content_type: 'product' },
    orderId // invoice ID'si event_id olarak → pixel ile dedup
  )
}

// Kayıt tamamlandı
export function capiCompleteRegistration({ email, phone, firstName, lastName }) {
  return sendCapi('CompleteRegistration',
    { email, phone, first_name: firstName, last_name: lastName }
  )
}

// Sepete ekleme
export function capiAddToCart({ contentId, contentName, value, currency = 'TRY', email }) {
  return sendCapi('AddToCart',
    { email },
    { content_ids: [contentId], content_name: contentName, value, currency, content_type: 'product' }
  )
}

// Ödeme bilgileri eklendi (checkout'ta kart bilgisi girildiğinde)
export function capiAddPaymentInfo({ value, currency = 'TRY', contentIds = [], email, phone }) {
  return sendCapi('AddPaymentInfo',
    { email, phone },
    { value, currency, content_ids: contentIds }
  )
}

// Alışveriş başlatma
export function capiInitiateCheckout({ value, currency = 'TRY', contentIds = [], numItems, email }) {
  return sendCapi('InitiateCheckout',
    { email },
    { value, currency, content_ids: contentIds, num_items: numItems }
  )
}

// İçerik görüntüleme
export function capiViewContent({ contentId, contentName, value, currency = 'TRY' }) {
  return sendCapi('ViewContent',
    {},
    { content_ids: [contentId], content_name: contentName, value, currency, content_type: 'product' }
  )
}

// İletişim formu
export function capiContact({ email, firstName, lastName }) {
  return sendCapi('Contact',
    { email, first_name: firstName, last_name: lastName }
  )
}

// Arama (domain arama vs.)
export function capiSearch({ searchString }) {
  return sendCapi('Search',
    {},
    { search_string: searchString }
  )
}
