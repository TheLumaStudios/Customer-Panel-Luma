import supabaseApi from '@/lib/axios'

export const getVdsOrders = async (status) => {
  try {
    const params = {
      select: '*,customer:customers(id,customer_code,full_name,email,phone),invoice:invoices(id,invoice_number,total_amount,status)',
      order: 'created_at.desc',
    }
    if (status) {
      params.order_status = `eq.${status}`
    }
    const response = await supabaseApi.get('/vds_orders', { params })
    return response.data || []
  } catch (error) {
    console.error('getVdsOrders failed:', error)
    throw error
  }
}

export const getVdsOrder = async (id) => {
  try {
    const response = await supabaseApi.get('/vds_orders', {
      params: {
        select: '*,customer:customers(*),invoice:invoices(*)',
        id: `eq.${id}`,
      }
    })
    return response.data?.[0] || null
  } catch (error) {
    console.error('getVdsOrder failed:', error)
    throw error
  }
}

export const updateVdsOrder = async (id, data) => {
  try {
    const response = await supabaseApi.patch('/vds_orders', {
      ...data,
      updated_at: new Date().toISOString(),
    }, {
      params: { id: `eq.${id}` }
    })
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('updateVdsOrder failed:', error)
    throw error
  }
}
