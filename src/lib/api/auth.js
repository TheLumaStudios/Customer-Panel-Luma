import { supabase } from '@/lib/supabase'
import { sendSMS } from './sms'
import supabaseApi from '@/lib/axios'

/**
 * Generate random password
 * @param {number} length - Password length
 * @returns {string} Random password
 */
export const generatePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Prepare customer auth (get or create password)
 * @param {Object} customer - Customer object with email, phone, full_name
 * @returns {Promise<Object>} Password and message preview
 */
export const prepareCustomerAuth = async (customer) => {
  try {
    if (!customer.email) {
      throw new Error('Müşterinin e-posta adresi bulunamadı')
    }

    if (!customer.phone) {
      throw new Error('Müşterinin telefon numarası bulunamadı')
    }

    let password
    let isExisting = false

    // TEMPORARY: Store password in customer_auth table
    // In production, use backend endpoint with service_role key
    try {
      // Check if auth record exists
      const { data: existing } = await supabaseApi.get('/customer_auth', {
        params: {
          select: '*',
          customer_id: `eq.${customer.id}`,
          limit: 1
        }
      })

      if (existing && existing.length > 0) {
        // Use existing password
        password = existing[0].password
        isExisting = true
      } else {
        // Generate new random password
        password = generatePassword(12)

        // Create new
        const response = await supabaseApi.post('/customer_auth', {
          customer_id: customer.id,
          email: customer.email,
          password: password,
        })
      }
    } catch (dbError) {
      console.error('Database error details:', dbError)
      console.error('Error response:', dbError.response?.data)
      console.error('Error status:', dbError.response?.status)
      // Throw error instead of continuing - we need to know what's wrong
      throw new Error(`Database error: ${dbError.response?.data?.message || dbError.message}`)
    }

    // Prepare SMS message
    const smsMessage = isExisting
      ? `Merhaba ${customer.full_name},

Panel giriş bilgileriniz:

      Web: ${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}
      E-posta: ${customer.email}
      Şifre: ${password}

Şifrenizi unutmayın!`
      : `Merhaba ${customer.full_name},

Müşteri paneliniz hazır!

      Web: ${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}
      E-posta: ${customer.email}
      Şifre: ${password}

İlk girişte şifrenizi değiştirmenizi öneririz.`

    return {
      success: true,
      password: password,
      isExisting: isExisting,
      smsMessage: smsMessage,
      message: isExisting
        ? 'Mevcut panel şifresi hazırlandı'
        : 'Panel şifresi oluşturuldu'
    }
  } catch (error) {
    console.error('prepareCustomerAuth error:', error)
    throw new Error(error.message || 'Panel şifresi hazırlanamadı')
  }
}

/**
 * Send password SMS (after confirmation)
 * @param {Object} customer - Customer object
 * @param {string} message - SMS message to send
 * @returns {Promise<Object>} Result
 */
export const sendPasswordSMS = async (customer, message) => {
  try {
    await sendSMS(customer.phone, message)

    return {
      success: true,
      message: 'Panel şifresi SMS ile gönderildi'
    }
  } catch (error) {
    console.error('sendPasswordSMS error:', error)
    throw new Error(error.message || 'SMS gönderilemedi')
  }
}

/**
 * Reset customer password and send new password via SMS
 * @param {Object} customer - Customer object
 * @returns {Promise<Object>} Result with new password
 */
export const resetCustomerPassword = async (customer) => {
  // For now, just call prepareCustomerAuth which updates if exists
  return await prepareCustomerAuth(customer)
}
