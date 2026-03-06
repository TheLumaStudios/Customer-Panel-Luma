import supabaseApi from '@/lib/axios'

export const getSettings = async () => {
  try {
    const response = await supabaseApi.get('/settings', {
      params: {
        select: '*',
        id: 'eq.00000000-0000-0000-0000-000000000001'
      }
    })
    return response.data?.[0] || null
  } catch (error) {
    console.error('getSettings failed:', error)
    throw error
  }
}

export const updateSettings = async (data) => {
  try {
    const response = await supabaseApi.patch('/settings', data, {
      params: {
        id: 'eq.00000000-0000-0000-0000-000000000001'
      }
    })
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('updateSettings failed:', error)
    throw error
  }
}
