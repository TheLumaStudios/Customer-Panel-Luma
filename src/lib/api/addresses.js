import { supabase } from '@/lib/supabase'

/**
 * Get customer addresses
 * @param {string} customer_id - Customer ID (optional, defaults to current user)
 */
export const getAddresses = async (customer_id = null) => {
  try {
    let query = supabase
      .from('customer_addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (customer_id) {
      query = query.eq('customer_id', customer_id)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('getAddresses failed:', error)
    throw error
  }
}

/**
 * Get single address by ID
 * @param {string} id - Address ID
 */
export const getAddress = async (id) => {
  try {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('getAddress failed:', error)
    throw error
  }
}

/**
 * Create a new address
 * @param {Object} addressData - Address data
 */
export const createAddress = async (addressData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('customer_addresses')
      .insert({
        customer_id: user.id,
        ...addressData,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('createAddress failed:', error)
    throw error
  }
}

/**
 * Update an address
 * @param {string} id - Address ID
 * @param {Object} addressData - Address data to update
 */
export const updateAddress = async (id, addressData) => {
  try {
    const { data, error } = await supabase
      .from('customer_addresses')
      .update(addressData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('updateAddress failed:', error)
    throw error
  }
}

/**
 * Delete an address
 * @param {string} id - Address ID
 */
export const deleteAddress = async (id) => {
  try {
    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('deleteAddress failed:', error)
    throw error
  }
}

/**
 * Set an address as default
 * @param {string} id - Address ID
 * @param {string} type - Address type (billing, shipping, other)
 */
export const setDefaultAddress = async (id, type) => {
  try {
    const { data, error } = await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('setDefaultAddress failed:', error)
    throw error
  }
}

/**
 * Get default address by type
 * @param {string} customer_id - Customer ID
 * @param {string} type - Address type (billing, shipping, other)
 */
export const getDefaultAddress = async (customer_id, type = 'billing') => {
  try {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('type', type)
      .eq('is_default', true)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is OK
      throw error
    }

    return data || null
  } catch (error) {
    console.error('getDefaultAddress failed:', error)
    throw error
  }
}
