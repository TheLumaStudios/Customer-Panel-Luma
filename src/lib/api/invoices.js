import supabaseApi from '@/lib/axios'

export const getInvoices = async () => {
  try {
    // Fetch invoices
    const invoicesResponse = await supabaseApi.get('/invoices', {
      params: {
        select: '*,customer:customers(*)',
        order: 'invoice_date.desc'
      }
    })

    const invoices = invoicesResponse.data || []

    // Fetch invoice items for all invoices
    if (invoices.length > 0) {
      const invoiceIds = invoices.map(inv => inv.id).join(',')
      const itemsResponse = await supabaseApi.get('/invoice_items', {
        params: {
          select: '*',
          invoice_id: `in.(${invoiceIds})`
        }
      })

      const items = itemsResponse.data || []

      // Group items by invoice_id
      const itemsByInvoice = items.reduce((acc, item) => {
        if (!acc[item.invoice_id]) acc[item.invoice_id] = []
        acc[item.invoice_id].push(item)
        return acc
      }, {})

      // Attach items to invoices
      invoices.forEach(invoice => {
        invoice.invoice_items = itemsByInvoice[invoice.id] || []
      })
    }

    return invoices
  } catch (error) {
    console.error('getInvoices failed:', error)
    throw error
  }
}

export const getInvoice = async (id) => {
  try {
    // Fetch invoice
    const invoiceResponse = await supabaseApi.get('/invoices', {
      params: {
        select: '*,customer:customers(*)',
        id: `eq.${id}`
      }
    })

    const invoice = invoiceResponse.data?.[0]
    if (!invoice) return null

    // Fetch invoice items
    const itemsResponse = await supabaseApi.get('/invoice_items', {
      params: {
        select: '*',
        invoice_id: `eq.${id}`
      }
    })

    invoice.invoice_items = itemsResponse.data || []

    return invoice
  } catch (error) {
    console.error('getInvoice failed:', error)
    throw error
  }
}

export const createInvoice = async (invoiceData) => {
  const { invoice_items, ...invoiceFields } = invoiceData

  try {
    console.log('Creating invoice with fields:', JSON.stringify(invoiceFields, null, 2))

    // Create invoice
    const invoiceResponse = await supabaseApi.post('/invoices', invoiceFields)
    const invoice = invoiceResponse.data?.[0] || invoiceResponse.data

    console.log('Invoice created:', invoice)

    // Create invoice items if provided
    if (invoice_items && invoice_items.length > 0) {
      const itemsWithInvoiceId = invoice_items.map(item => ({
        ...item,
        invoice_id: invoice.id
      }))
      console.log('Creating invoice items:', itemsWithInvoiceId)
      await supabaseApi.post('/invoice_items', itemsWithInvoiceId)
    }

    return invoice
  } catch (error) {
    console.error('createInvoice failed:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    throw error
  }
}

export const updateInvoice = async (id, invoiceData) => {
  const { invoice_items, ...invoiceFields } = invoiceData

  try {
    // Update invoice
    const response = await supabaseApi.patch('/invoices', invoiceFields, {
      params: { id: `eq.${id}` }
    })

    // Update invoice items if provided
    if (invoice_items && invoice_items.length > 0) {
      // Delete existing items
      await supabaseApi.delete('/invoice_items', {
        params: { invoice_id: `eq.${id}` }
      })

      // Create new items
      const itemsWithInvoiceId = invoice_items.map(item => ({
        ...item,
        invoice_id: id
      }))
      await supabaseApi.post('/invoice_items', itemsWithInvoiceId)
    }

    return response.data?.[0] || response.data
  } catch (error) {
    console.error('updateInvoice failed:', error)
    console.error('Error response:', error.response?.data)
    throw error
  }
}

export const deleteInvoice = async (id) => {
  try {
    // Delete invoice items first
    await supabaseApi.delete('/invoice_items', {
      params: { invoice_id: `eq.${id}` }
    })

    // Delete invoice
    await supabaseApi.delete('/invoices', {
      params: { id: `eq.${id}` }
    })
  } catch (error) {
    console.error('deleteInvoice failed:', error)
    throw error
  }
}
