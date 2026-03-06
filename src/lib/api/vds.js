import supabaseApi from '@/lib/axios'

export const getVDS = async () => {
  try {
    const response = await supabaseApi.get('/vds', {
      params: {
        select: '*,customer:customers(*),server:servers(*)',
        order: 'expiration_date.asc.nullslast'
      }
    })
    return response.data || []
  } catch (error) {
    console.error('getVDS failed:', error)
    throw error
  }
}

export const getVDSRecord = async (id) => {
  try {
    const response = await supabaseApi.get('/vds', {
      params: {
        select: '*,customer:customers(*),server:servers(*)',
        id: `eq.${id}`
      }
    })
    return response.data?.[0] || null
  } catch (error) {
    console.error('getVDSRecord failed:', error)
    throw error
  }
}

export const createVDS = async (vdsData) => {
  try {
    const response = await supabaseApi.post('/vds', vdsData)
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('createVDS failed:', error)
    throw error
  }
}

export const updateVDS = async (id, vdsData) => {
  try {
    const response = await supabaseApi.patch('/vds', vdsData, {
      params: { id: `eq.${id}` }
    })
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('updateVDS failed:', error)
    throw error
  }
}

export const deleteVDS = async (id) => {
  try {
    await supabaseApi.delete('/vds', {
      params: { id: `eq.${id}` }
    })
  } catch (error) {
    console.error('deleteVDS failed:', error)
    throw error
  }
}
