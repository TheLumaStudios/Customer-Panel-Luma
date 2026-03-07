import { supabase } from '@/lib/supabase'

// Construct functions URL - handle both /rest/v1 and base URLs
const baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_FUNCTIONS_URL = baseUrl.includes('/rest/v1')
  ? baseUrl.replace('/rest/v1', '/functions/v1')
  : `${baseUrl}/functions/v1`

/**
 * Check domain availability and pricing
 * @param {Array<string>} domains - Domain names to check (without extension)
 * @param {Array<string>} extensions - TLD extensions to check (e.g., ['com', 'net', 'org'])
 * @param {number} period - Registration period in years
 */
export const checkDomainAvailability = async (domains, extensions = ['com'], period = 1) => {
  try {
    // Use anon key for public domain checks
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/domain-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ domains, extensions, period }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Domain kontrolü başarısız oldu')
    }

    return result.results
  } catch (error) {
    console.error('checkDomainAvailability failed:', error)
    throw error
  }
}

/**
 * Get all available TLDs with pricing
 */
export const getDomainPricing = async () => {
  try {
    // Use anon key for public pricing
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/domain-pricing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ currency: 'USD' }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Fiyat listesi alınamadı')
    }

    return result.tlds
  } catch (error) {
    console.error('getDomainPricing failed:', error)
    throw error
  }
}

/**
 * Register domains (bulk registration)
 * @param {Array} domains - Array of domain objects with {sld, tld, period, contacts, nameservers}
 * @param {string} currency - Currency for payment (USD or TRY)
 * @param {string} payment_method - Payment method (e.g., 'Wallet', 'Credit Card')
 * @param {string} return_url - URL to return after successful payment
 * @param {string} cancel_url - URL to return if payment is cancelled
 */
export const registerDomains = async (
  domains,
  currency = 'USD',
  payment_method = 'Wallet',
  return_url = null,
  cancel_url = null
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Kullanıcı oturumu bulunamadı. Lütfen giriş yapın.')
    }

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/domain-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        domains,
        currency,
        payment_method,
        return_url,
        cancel_url,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Domain kaydı başarısız oldu')
    }

    return result
  } catch (error) {
    console.error('registerDomains failed:', error)
    throw error
  }
}

/**
 * Register a single domain (convenience wrapper)
 * @param {string} domainName - Full domain name (e.g., 'example.com')
 * @param {number} period - Registration period in years
 * @param {Object} contacts - Contact information for domain registration
 * @param {Array<string>} nameservers - Name servers
 */
export const registerDomain = async (
  domainName,
  period = 1,
  contacts,
  nameservers = ['ns1.thelumastudios.com', 'ns2.thelumastudios.com']
) => {
  const [sld, ...tldParts] = domainName.split('.')
  const tld = tldParts.join('.')

  return registerDomains([{
    sld,
    tld,
    period,
    contacts,
    nameservers,
  }])
}

/**
 * Popular TLD extensions with typical pricing (fallback if API fails)
 */
export const popularTLDs = [
  { extension: 'com', price: 10.99, currency: 'USD', popular: true },
  { extension: 'net', price: 12.99, currency: 'USD', popular: true },
  { extension: 'org', price: 12.99, currency: 'USD', popular: true },
  { extension: 'info', price: 14.99, currency: 'USD', popular: false },
  { extension: 'co', price: 24.99, currency: 'USD', popular: true },
  { extension: 'io', price: 39.99, currency: 'USD', popular: true },
  { extension: 'com.tr', price: 8.99, currency: 'USD', popular: true },
  { extension: 'net.tr', price: 8.99, currency: 'USD', popular: false },
  { extension: 'org.tr', price: 8.99, currency: 'USD', popular: false },
  { extension: 'app', price: 14.99, currency: 'USD', popular: false },
  { extension: 'dev', price: 12.99, currency: 'USD', popular: false },
  { extension: 'ai', price: 89.99, currency: 'USD', popular: true },
]
