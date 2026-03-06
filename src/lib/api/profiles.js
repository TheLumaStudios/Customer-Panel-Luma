import supabaseApi from '@/lib/axios'

export const updateProfile = async (id, profileData) => {
  try {
    const response = await supabaseApi.patch('/profiles', profileData, {
      params: { id: `eq.${id}` }
    })
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('updateProfile failed:', error)
    throw error
  }
}

export const getProfile = async (id) => {
  try {
    const response = await supabaseApi.get('/profiles', {
      params: {
        select: '*',
        id: `eq.${id}`
      }
    })
    return response.data?.[0] || null
  } catch (error) {
    console.error('getProfile failed:', error)
    throw error
  }
}
