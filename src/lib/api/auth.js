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
 * Create auth account for customer and send password via SMS
 * Note: This creates a temporary account. Real implementation needs backend endpoint.
 * @param {Object} customer - Customer object with email, phone, full_name
 * @returns {Promise<Object>} Result with password
 */
export const createCustomerAuth = async (customer) => {
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

      console.log('Existing customer_auth records:', existing)

      if (existing && existing.length > 0) {
        // Use existing password
        password = existing[0].password
        isExisting = true
        console.log('Using existing password from database')
      } else {
        // Generate new random password
        password = generatePassword(12)

        // Create new
        console.log('Creating new customer_auth record...', {
          customer_id: customer.id,
          email: customer.email,
          password: password.substring(0, 3) + '***' // Only log first 3 chars
        })
        const response = await supabaseApi.post('/customer_auth', {
          customer_id: customer.id,
          email: customer.email,
          password: password,
        })
        console.log('Create response:', response.data)
      }
    } catch (dbError) {
      console.error('Database error details:', dbError)
      console.error('Error response:', dbError.response?.data)
      console.error('Error status:', dbError.response?.status)
      // Throw error instead of continuing - we need to know what's wrong
      throw new Error(`Database error: ${dbError.response?.data?.message || dbError.message}`)
    }

    // Send password via SMS
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

    await sendSMS(customer.phone, smsMessage)

    return {
      success: true,
      password: password,
      isExisting: isExisting,
      message: isExisting
        ? 'Mevcut panel şifresi SMS ile gönderildi'
        : 'Panel şifresi oluşturuldu ve SMS ile gönderildi'
    }
  } catch (error) {
    console.error('createCustomerAuth error:', error)
    throw new Error(error.message || 'Panel şifresi gönderilemedi')
  }
}

/**
 * Reset customer password and send new password via SMS
 * @param {Object} customer - Customer object
 * @returns {Promise<Object>} Result with new password
 */
export const resetCustomerPassword = async (customer) => {
  // For now, just call createCustomerAuth which updates if exists
  return await createCustomerAuth(customer)
}
