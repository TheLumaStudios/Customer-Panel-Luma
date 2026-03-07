/**
 * TCMB (Türkiye Cumhuriyet Merkez Bankası) Currency API Integration
 * https://www.tcmb.gov.tr/kurlar/today.xml
 */

// Using exchangerate-api as a reliable free alternative
const CURRENCY_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD'

/**
 * Fetch current exchange rates (USD based)
 */
export const getExchangeRates = async () => {
  try {
    const response = await fetch(CURRENCY_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.rates) {
      throw new Error('Invalid response format')
    }

    return data.rates
  } catch (error) {
    console.error('getExchangeRates failed:', error)
    throw error
  }
}

/**
 * Get USD to TRY exchange rate
 */
export const getUsdToTryRate = async () => {
  try {
    const rates = await getExchangeRates()

    // Get TRY rate (rates are USD based, so TRY is already in correct format)
    const tryRate = rates.TRY

    if (!tryRate) {
      throw new Error('USD/TRY rate not found')
    }

    // exchangerate-api returns the rate directly, we'll use it for both buy/sell
    // Add small spread for buy/sell (0.5% difference)
    const midRate = parseFloat(tryRate)
    const spread = midRate * 0.005 // 0.5% spread

    return {
      buyRate: midRate - spread,
      sellRate: midRate + spread,
      averageRate: midRate,
      changeRatioDaily: 0, // API doesn't provide this, but we can keep it for UI
    }
  } catch (error) {
    console.error('getUsdToTryRate failed:', error)
    // Fallback to a default rate if API fails
    return {
      buyRate: 34.50,
      sellRate: 34.60,
      averageRate: 34.55,
      changeRatioDaily: 0,
    }
  }
}

/**
 * Convert USD price to TRY
 * @param {number} usdPrice - Price in USD
 * @param {number} sellRate - USD sell rate from bank
 */
export const convertUsdToTry = (usdPrice, sellRate) => {
  return (usdPrice * sellRate).toFixed(2)
}

/**
 * Convert TRY price to USD
 * @param {number} tryPrice - Price in TRY
 * @param {number} buyRate - USD buy rate from bank
 */
export const convertTryToUsd = (tryPrice, buyRate) => {
  return (tryPrice / buyRate).toFixed(2)
}
