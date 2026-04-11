import supabaseApi from '@/lib/axios'

export const getCustomers = async () => {
  try {
    const response = await supabaseApi.get('/customers', {
      params: {
        select: '*',
        order: 'created_at.desc'
      }
    })

    const customers = response.data || []

    // Fetch profiles for all customers
    if (customers.length > 0) {
      const profileIds = customers
        .filter(c => c.profile_id)
        .map(c => c.profile_id)

      if (profileIds.length > 0) {
        try {
          const profilesResponse = await supabaseApi.get('/profiles', {
            params: {
              select: '*',
              id: `in.(${profileIds.join(',')})`
            }
          })

          const profiles = profilesResponse.data || []

          // Map profiles to customers
          customers.forEach(customer => {
            if (customer.profile_id) {
              customer.profile = profiles.find(p => p.id === customer.profile_id) || null
            }
          })
        } catch (profileError) {
          console.error('Failed to fetch profiles:', profileError)
        }
      }
    }

    return customers
  } catch (error) {
    console.error('getCustomers failed:', error)
    throw error
  }
}

export const getCustomer = async (id) => {
  try {
    // Get customer data
    const customerResponse = await supabaseApi.get('/customers', {
      params: {
        select: '*',
        id: `eq.${id}`
      }
    })

    const customer = customerResponse.data?.[0]

    if (!customer) return null

    // Get profile data if profile_id exists
    if (customer.profile_id) {
      try {
        const profileResponse = await supabaseApi.get('/profiles', {
          params: {
            select: '*',
            id: `eq.${customer.profile_id}`
          }
        })

        customer.profile = profileResponse.data?.[0]
      } catch (profileError) {
        console.error('Failed to fetch profile:', profileError)
        customer.profile = null
      }
    }

    return customer
  } catch (error) {
    console.error('getCustomer failed:', error)
    throw error
  }
}

export const createCustomer = async (customerData) => {
  try {
    const response = await supabaseApi.post('/customers', customerData)
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('createCustomer failed:', error)
    throw error
  }
}

export const updateCustomer = async (id, customerData) => {
  try {
    const response = await supabaseApi.patch('/customers', customerData, {
      params: { id: `eq.${id}` }
    })
    const updated = response.data?.[0] || response.data

    // Keep the linked profile row in sync so the dashboard welcome banner
    // (and anything else that reads from `profiles`) shows fresh data
    // immediately after an admin edit.
    try {
      // We may not have profile_id in the PATCH payload; fetch the customer
      // row to discover which profile (if any) is linked.
      const customerRow =
        Array.isArray(updated) ? updated[0] : updated ||
        (await supabaseApi.get('/customers', {
          params: { id: `eq.${id}`, select: 'profile_id' }
        })).data?.[0]

      const profileId = customerRow?.profile_id
      if (profileId) {
        const profilePatch = {}
        if (Object.prototype.hasOwnProperty.call(customerData, 'full_name'))
          profilePatch.full_name = customerData.full_name
        if (Object.prototype.hasOwnProperty.call(customerData, 'phone'))
          profilePatch.phone = customerData.phone
        if (Object.prototype.hasOwnProperty.call(customerData, 'company_name'))
          profilePatch.company_name = customerData.company_name
        if (Object.prototype.hasOwnProperty.call(customerData, 'email'))
          profilePatch.email = customerData.email

        if (Object.keys(profilePatch).length > 0) {
          await supabaseApi.patch('/profiles', profilePatch, {
            params: { id: `eq.${profileId}` }
          })
        }
      }
    } catch (syncError) {
      // Non-fatal: customer row is authoritative for business data.
      console.warn('Profile sync after updateCustomer failed:', syncError)
    }

    return updated
  } catch (error) {
    console.error('updateCustomer failed:', error)
    throw error
  }
}

export const deleteCustomer = async (id) => {
  try {
    await supabaseApi.delete('/customers', {
      params: { id: `eq.${id}` }
    })
  } catch (error) {
    console.error('deleteCustomer failed:', error)
    throw error
  }
}
