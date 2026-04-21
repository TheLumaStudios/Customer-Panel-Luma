import { supabase } from '@/lib/supabase'
import supabaseApi from '@/lib/axios'

/**
 * Send SMS via edge function (API keys are server-side only)
 * @param {string} phone - Phone number (e.g., "05XXXXXXXXX")
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} Response from edge function
 */
export const sendSMS = async (phone, message) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { phone, message },
    })

    if (error) {
      throw new Error(error.message || 'SMS gönderilemedi')
    }

    if (!data?.success) {
      throw new Error(data?.error || 'SMS gönderilemedi')
    }

    return {
      success: true,
      message: 'SMS sent successfully',
      messageId: data.messageId,
    }
  } catch (error) {
    console.error('sendSMS failed:', error)
    throw new Error(error.message || 'SMS gönderilemedi')
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
