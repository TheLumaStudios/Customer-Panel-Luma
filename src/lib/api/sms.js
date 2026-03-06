import axios from 'axios'
import supabaseApi from '@/lib/axios'

// VatanSMS API configuration
const VATANSMS_API_URL = import.meta.env.VITE_VATANSMS_API_URL || 'https://api.vatansms.net/api/v1'
const VATANSMS_API_ID = import.meta.env.VITE_VATANSMS_API_ID
const VATANSMS_API_KEY = import.meta.env.VITE_VATANSMS_API_KEY
const VATANSMS_SENDER = import.meta.env.VITE_VATANSMS_SENDER || 'HOSTING'

/**
 * Send SMS via VatanSMS API
 * @param {string} phone - Phone number (e.g., "05XXXXXXXXX")
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} Response from VatanSMS API
 */
export const sendSMS = async (phone, message) => {
  try {
    // For development, if API credentials are not set, simulate success
    if (!VATANSMS_API_ID || !VATANSMS_API_KEY) {
      console.warn('VatanSMS credentials not configured. Simulating SMS send...')

      // Log the SMS to database
      await logSMS({
        phone,
        message,
        status: 'simulated',
        cost: calculateCost(message),
      })

      return {
        success: true,
        message: 'SMS simulated successfully (credentials not configured)',
        messageId: `sim_${Date.now()}`,
      }
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '')

    // VatanSMS API call
    const response = await axios.post(
      `${VATANSMS_API_URL}/1toN`,
      {
        api_id: VATANSMS_API_ID,
        api_key: VATANSMS_API_KEY,
        sender: VATANSMS_SENDER,
        message_type: 'turkce', // Support Turkish characters
        message: message,
        phones: [cleanPhone]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    // Log the SMS to database
    await logSMS({
      phone: cleanPhone,
      message,
      status: 'sent',
      cost: calculateCost(message),
    })

    return {
      success: true,
      message: 'SMS sent successfully',
      messageId: response.data?.id || `msg_${Date.now()}`,
      response: response.data
    }
  } catch (error) {
    console.error('sendSMS failed:', error)

    // Log failed SMS
    await logSMS({
      phone,
      message,
      status: 'failed',
      cost: 0,
      error: error.response?.data?.message || error.message,
    })

    throw new Error(error.response?.data?.message || error.message || 'SMS gönderilemedi')
  }
}

/**
 * Calculate SMS cost based on message length
 * @param {string} message - SMS message content
 * @returns {number} Cost in TRY
 */
export const calculateCost = (message) => {
  const smsCount = Math.ceil(message.length / 160) || 1
  const costPerSMS = 0.05 // 0.05 TRY per SMS
  return smsCount * costPerSMS
}

/**
 * Log SMS to database
 * @param {Object} smsData - SMS data to log
 * @returns {Promise<Object>} Logged SMS record
 */
export const logSMS = async (smsData) => {
  try {
    const response = await supabaseApi.post('/sms_logs', {
      phone: smsData.phone,
      message: smsData.message,
      status: smsData.status,
      cost: smsData.cost,
      error_message: smsData.error || null,
      sent_at: new Date().toISOString(),
    })

    return response.data?.[0] || response.data
  } catch (error) {
    console.error('logSMS failed:', error)
    // Don't throw error for logging failures
    return null
  }
}

/**
 * Get SMS logs for a customer
 * @param {string} customerId - Customer ID
 * @returns {Promise<Array>} SMS logs
 */
export const getCustomerSmsLogs = async (customerId) => {
  try {
    const response = await supabaseApi.get('/sms_logs', {
      params: {
        select: '*',
        customer_id: `eq.${customerId}`,
        order: 'sent_at.desc',
      }
    })

    return response.data || []
  } catch (error) {
    console.error('getCustomerSmsLogs failed:', error)
    throw error
  }
}

/**
 * Send bulk SMS to multiple recipients
 * @param {Array<{phone: string, message: string}>} recipients - Array of recipients
 * @returns {Promise<Object>} Bulk send result
 */
export const sendBulkSMS = async (recipients) => {
  try {
    const results = await Promise.allSettled(
      recipients.map(({ phone, message }) => sendSMS(phone, message))
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return {
      success: true,
      total: recipients.length,
      successful,
      failed,
      results,
    }
  } catch (error) {
    console.error('sendBulkSMS failed:', error)
    throw error
  }
}
