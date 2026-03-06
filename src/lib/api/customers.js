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
    return response.data?.[0] || response.data
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
