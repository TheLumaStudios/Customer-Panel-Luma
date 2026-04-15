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
    // Use direct Supabase query with RLS policies instead of Edge Function
    // This avoids JWT validation issues
    let query = supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `, { count: 'exact' })

    // Filter by customer if specified
    if (params.customer_id) {
      query = query.eq('customer_id', params.customer_id)
    }

    // Filter by status
    if (params.status) {
      query = query.eq('status', params.status)
    }

    // Apply pagination
    const limit = params.limit || 50
    const offset = params.offset || 0
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: invoices, error, count } = await query

    if (error) {
      console.error('Invoice query error:', error)
      throw error
    }

    // Fetch customer details for each invoice
    const customerIds = [...new Set(invoices?.map(inv => inv.customer_id) || [])]
    const { data: customers } = await supabase
      .from('customers')
      .select('id, full_name, email, customer_code')
      .in('id', customerIds)

    // Map customers to invoices
    const invoicesWithCustomers = invoices?.map(invoice => ({
      ...invoice,
      items: invoice.invoice_items,
      customer: customers?.find(c => c.id === invoice.customer_id) || null
    })) || []

    return {
      invoices: invoicesWithCustomers,
      total: count || 0,
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
    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    if (invoiceError) throw invoiceError
    if (!invoice) throw new Error('Invoice not found')

    // Get invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)

    if (itemsError) throw itemsError

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, full_name, email, customer_code')
      .eq('id', invoice.customer_id)
      .single()

    if (customerError) {
      console.warn('Failed to fetch customer:', customerError)
    }

    return {
      ...invoice,
      items: items || [],
      customer: customer || null
    }
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }))
      console.error('❌ Error response:', errorData)
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to create invoice')
    }

    return result.invoice
  } catch (error) {
    console.error('❌ createInvoice failed:', error)
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
    // Refresh session if needed
    let { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      const { data: refreshed } = await supabase.auth.refreshSession()
      session = refreshed?.session
    }
    if (!session?.access_token) {
      throw new Error('Oturum bulunamadı. Lütfen yeniden giriş yapın.')
    }

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/invoice-pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

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
    return data || { balance: 0, currency: 'TRY', customer_id }
  } catch (error) {
    console.error('getCustomerCredit failed:', error)
    // Return default on error to prevent UI crashes
    return { balance: 0, currency: 'TRY', customer_id }
  }
}

/**
 * Add credit to customer wallet
 * @param {string} customer_id - Customer ID
 * @param {number} amount - Amount to add
 * @param {string} currency - Currency
 * @param {string} description - Description
 */
export const addCustomerCredit = async (customer_id, amount, currency = 'TRY', description = '') => {
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
 * Upload official invoice file
 * @param {string} invoice_id - Invoice ID
 * @param {File} file - File to upload
 */
export const uploadInvoiceFile = async (invoice_id, file) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${invoice_id}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(filePath)

    // Update invoice with file URL
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ official_invoice_url: publicUrl })
      .eq('id', invoice_id)

    if (updateError) throw updateError

    return { url: publicUrl, path: filePath }
  } catch (error) {
    console.error('uploadInvoiceFile failed:', error)
    throw error
  }
}

/**
 * Delete invoice file
 * @param {string} invoice_id - Invoice ID
 * @param {string} filePath - File path in storage
 */
export const deleteInvoiceFile = async (invoice_id, filePath) => {
  try {
    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('invoices')
      .remove([filePath])

    if (deleteError) throw deleteError

    // Update invoice to remove file URL
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ official_invoice_url: null })
      .eq('id', invoice_id)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error('deleteInvoiceFile failed:', error)
    throw error
  }
}

/**
 * Upload tax receipt file
 * @param {string} invoice_id - Invoice ID
 * @param {File} file - File to upload
 */
export const uploadTaxReceipt = async (invoice_id, file) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `tax-${invoice_id}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(filePath)

    // Update invoice with file URL
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ tax_receipt_url: publicUrl })
      .eq('id', invoice_id)

    if (updateError) throw updateError

    return { url: publicUrl, path: filePath }
  } catch (error) {
    console.error('uploadTaxReceipt failed:', error)
    throw error
  }
}

/**
 * Delete tax receipt file
 * @param {string} invoice_id - Invoice ID
 * @param {string} filePath - File path in storage
 */
export const deleteTaxReceipt = async (invoice_id, filePath) => {
  try {
    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('invoices')
      .remove([filePath])

    if (deleteError) throw deleteError

    // Update invoice to remove file URL
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ tax_receipt_url: null })
      .eq('id', invoice_id)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error('deleteTaxReceipt failed:', error)
    throw error
  }
}

/**
 * Update invoice
 * @param {string} id - Invoice ID
 * @param {Object} updateData - Data to update
 */
export const updateInvoice = async (id, updateData) => {
  try {
    // Extract items from updateData
    const { items, ...invoiceData } = updateData

    // Update invoice (without items)
    const { data, error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // If items are provided, update them
    if (items) {
      // Delete existing items
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id)

      // Insert new items
      const invoiceItems = items.map(item => {
        const totalPrice = (item.quantity || 1) * item.unit_price
        return {
          invoice_id: id,
          type: item.type || 'service',
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unit_price,
          amount: totalPrice,
          total_price: totalPrice,
          total: totalPrice,
          service_id: item.service_id,
          service_type: item.service_type,
        }
      })

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)

      if (itemsError) throw itemsError
    }

    return data
  } catch (error) {
    console.error('updateInvoice failed:', error)
    throw error
  }
}

/**
 * Delete invoice
 * @param {string} id - Invoice ID
 */
export const deleteInvoice = async (id) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('deleteInvoice failed:', error)
    throw error
  }
}

/**
* Create a self-service invoice (customer-scoped).
* The server forces customer_id = auth user, currency = TRY, re-prices
* hosting/vds items from product_packages, and applies tax server-side.
*
* @param {Object} payload
* @param {Array}  payload.items       - [{ type, package_id?, billing_period?, quantity?, unit_price?, description? }]
* @param {string} payload.promo_code  - Optional promo/coupon code
* @param {Object} payload.notes_json  - Optional { contacts, nameservers, domains } (domain flow only)
*/
export const createSelfInvoice = async (payload) => {
  try {
// Proactively refresh — avoids stale/expired access tokens hitting the
// Supabase gateway and returning {"code":401,"message":"Invalid JWT"}.
    let { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      const { data: refreshed } = await supabase.auth.refreshSession()
      session = refreshed?.session || null
    }
    if (!session?.access_token) {
      throw new Error('Oturumunuz sona ermiş görünüyor. Lütfen çıkış yapıp tekrar giriş yapın.')
    }

    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/invoice-create-self`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey,
      },
      body: JSON.stringify(payload),
    })

// Gateway rejected JWT → try one silent refresh + retry before failing
    if (response.status === 401) {
      const bodyText = await response.clone().text().catch(() => '')
      if (bodyText.includes('Invalid JWT') || bodyText.includes('JWT')) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        if (refreshed?.session?.access_token) {
          const retry = await fetch(`${SUPABASE_FUNCTIONS_URL}/invoice-create-self`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshed.session.access_token}`,
              'apikey': anonKey,
            },
            body: JSON.stringify(payload),
          })
          if (retry.ok) {
            const result = await retry.json()
            if (!result.success) throw new Error(result.error || 'Failed to create self invoice')
            return result.invoice
          }
        }
        throw new Error('Oturumunuz sona ermiş. Lütfen çıkış yapıp tekrar giriş yapın.')
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to create self invoice')
    }
    return result.invoice
  } catch (error) {
    console.error('createSelfInvoice failed:', error)
    throw error
  }
}

/**
 * Initialize iyzico payment
 * @param {string} invoice_id - Invoice ID
 * @param {string} return_url - URL to return after payment
 */
export const initializeIyzicoPayment = async (invoice_id, return_url = null) => {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

  const callInit = async (accessToken) => {
    return fetch(`${SUPABASE_FUNCTIONS_URL}/payment-iyzico-init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({
        invoice_id,
        return_url: return_url || `${window.location.origin}/payment-callback`,
      }),
    })
  }

  try {
    let { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      const { data: refreshed } = await supabase.auth.refreshSession()
      session = refreshed?.session || null
    }
    if (!session?.access_token) {
      throw new Error('Oturumunuz sona ermiş görünüyor. Lütfen çıkış yapıp tekrar giriş yapın.')
    }

    let response = await callInit(session.access_token)

// Gateway rejected JWT → refresh once and retry
    if (response.status === 401) {
      const bodyText = await response.clone().text().catch(() => '')
      if (bodyText.includes('JWT')) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        if (refreshed?.session?.access_token) {
          response = await callInit(refreshed.session.access_token)
        } else {
          throw new Error('Oturumunuz sona ermiş. Lütfen çıkış yapıp tekrar giriş yapın.')
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

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
