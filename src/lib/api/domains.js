import supabaseApi from '@/lib/axios'

export const getDomains = async () => {
  console.log('getDomains API called with axios')

  try {
    // Fetch domains only (without nested data to avoid ambiguity)
    const response = await supabaseApi.get('/domains', {
      params: {
        select: '*',
        order: 'expiration_date.asc'
      }
    })

    console.log('getDomains success:', response.data)
    return response.data || []
  } catch (error) {
    console.error('getDomains failed:', error)
    throw error
  }
}

export const getDomain = async (id) => {
  try {
    const response = await supabaseApi.get('/domains', {
      params: {
        select: '*',
        id: `eq.${id}`
      }
    })
    return response.data?.[0] || null
  } catch (error) {
    console.error('getDomain failed:', error)
    throw error
  }
}

export const createDomain = async (domainData) => {
  try {
    const response = await supabaseApi.post('/domains', domainData)
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('createDomain failed:', error)
    throw error
  }
}

export const updateDomain = async (id, domainData) => {
  try {
    const response = await supabaseApi.patch('/domains', domainData, {
      params: { id: `eq.${id}` }
    })
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('updateDomain failed:', error)
    throw error
  }
}

export const deleteDomain = async (id) => {
  try {
    await supabaseApi.delete('/domains', {
      params: { id: `eq.${id}` }
    })
  } catch (error) {
    console.error('deleteDomain failed:', error)
    throw error
  }
}
