import { supabase } from '@/lib/supabase'

// Construct functions URL
const baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_FUNCTIONS_URL = baseUrl.includes('/rest/v1')
  ? baseUrl.replace('/rest/v1', '/functions/v1')
  : `${baseUrl}/functions/v1`

/**
 * Get invoices list
 * @param {Object} params - Query parameters
 * @param {string} params.customer_id - Filter by customer ID (admin only)
 * @param {string} params.status - Filter by status
 * @param {number} params.limit - Limit results
 * @param {number} params.offset - Offset for pagination
 */
export const getInvoices = async (params = {}) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const queryParams = new URLSearchParams()
    if (params.customer_id) queryParams.append('customer_id', params.customer_id)
    if (params.status) queryParams.append('status', params.status)
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())

    const response = await fetch(
      `${SUPABASE_FUNCTIONS_URL}/invoice-list?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      }
    )

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch invoices')
    }

    return {
      invoices: result.invoices,
      total: result.total,
    }
  } catch (error) {
    console.error('getInvoices failed:', error)
    throw error
  }
}

/**
 * Get single invoice by ID
 * @param {string} id - Invoice ID
 */
export const getInvoice = async (id) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:profiles(id, full_name, email),
        items:invoice_items(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('getInvoice failed:', error)
    throw error
  }
}

/**
 * Create a new invoice
 * @param {Object} invoiceData - Invoice data
 * @param {string} invoiceData.customer_id - Customer ID
 * @param {Array} invoiceData.items - Invoice items
 * @param {string} invoiceData.due_date - Due date
 * @param {string} invoiceData.currency - Currency (USD/TRY)
 * @param {number} invoiceData.tax_rate - Tax percentage
 * @param {string} invoiceData.notes - Notes
 */
export const createInvoice = async (invoiceData) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/invoice-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(invoiceData),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to create invoice')
    }

    return result.invoice
  } catch (error) {
    console.error('createInvoice failed:', error)
    throw error
  }
}

/**
 * Pay an invoice
 * @param {Object} paymentData - Payment data
 * @param {string} paymentData.invoice_id - Invoice ID
 * @param {string} paymentData.payment_method - Payment method (wallet, iyzico, paytr, etc.)
 * @param {string} paymentData.transaction_id - Transaction ID from gateway
 * @param {string} paymentData.gateway_response - Response from gateway
 * @param {string} paymentData.notes - Payment notes
 */
export const payInvoice = async (paymentData) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/invoice-pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(paymentData),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to pay invoice')
    }

    return {
      invoice: result.invoice,
      payment: result.payment,
    }
  } catch (error) {
    console.error('payInvoice failed:', error)
    throw error
  }
}

/**
 * Get customer credit balance
 * @param {string} customer_id - Customer ID
 */
export const getCustomerCredit = async (customer_id) => {
  try {
    const { data, error } = await supabase
      .from('customer_credit')
      .select('*')
      .eq('customer_id', customer_id)
      .maybeSingle() // Use maybeSingle instead of single to avoid 406 error

    if (error) {
      console.error('getCustomerCredit error:', error)
      throw error
    }

    // Return default if no record exists
    return data || { balance: 0, currency: 'USD', customer_id }
  } catch (error) {
    console.error('getCustomerCredit failed:', error)
    // Return default on error to prevent UI crashes
    return { balance: 0, currency: 'USD', customer_id }
  }
}

/**
 * Add credit to customer wallet
 * @param {string} customer_id - Customer ID
 * @param {number} amount - Amount to add
 * @param {string} currency - Currency
 * @param {string} description - Description
 */
export const addCustomerCredit = async (customer_id, amount, currency = 'USD', description = '') => {
  try {
    // Get current balance
    const currentCredit = await getCustomerCredit(customer_id)
    const newBalance = (currentCredit?.balance || 0) + amount

    // Upsert credit
    const { error: creditError } = await supabase
      .from('customer_credit')
      .upsert({
        customer_id,
        balance: newBalance,
        currency,
      })

    if (creditError) throw creditError

    // Record transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        customer_id,
        type: 'credit',
        amount,
        currency,
        description: description || 'Credit added',
        balance_after: newBalance,
      })

    if (transactionError) throw transactionError

    return { balance: newBalance, currency }
  } catch (error) {
    console.error('addCustomerCredit failed:', error)
    throw error
  }
}

/**
 * Initialize iyzico payment
 * @param {string} invoice_id - Invoice ID
 * @param {string} return_url - URL to return after payment
 */
export const initializeIyzicoPayment = async (invoice_id, return_url = null) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/payment-iyzico-init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        invoice_id,
        return_url: return_url || `${window.location.origin}/payment-callback`,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to initialize iyzico payment')
    }

    return result
  } catch (error) {
    console.error('initializeIyzicoPayment failed:', error)
    throw error
  }
}
