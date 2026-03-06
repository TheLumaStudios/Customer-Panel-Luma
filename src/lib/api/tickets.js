import supabaseApi from '@/lib/axios'

export const getTickets = async () => {
  try {
    const response = await supabaseApi.get('/support_tickets', {
      params: {
        select: '*',
        order: 'created_at.desc'
      }
    })
    return response.data || []
  } catch (error) {
    console.error('getTickets failed:', error)
    throw error
  }
}

export const getTicket = async (id) => {
  try {
    const response = await supabaseApi.get('/support_tickets', {
      params: {
        select: '*',
        id: `eq.${id}`
      }
    })
    return response.data?.[0] || null
  } catch (error) {
    console.error('getTicket failed:', error)
    throw error
  }
}

export const createTicket = async (ticketData) => {
  try {
    const response = await supabaseApi.post('/support_tickets', ticketData)
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('createTicket failed:', error)
    throw error
  }
}

export const updateTicket = async (id, ticketData) => {
  try {
    const response = await supabaseApi.patch('/support_tickets', ticketData, {
      params: { id: `eq.${id}` }
    })
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('updateTicket failed:', error)
    throw error
  }
}

export const deleteTicket = async (id) => {
  try {
    // Delete ticket replies first
    await supabaseApi.delete('/ticket_replies', {
      params: { ticket_id: `eq.${id}` }
    })

    // Delete ticket
    await supabaseApi.delete('/support_tickets', {
      params: { id: `eq.${id}` }
    })
  } catch (error) {
    console.error('deleteTicket failed:', error)
    throw error
  }
}

export const createTicketReply = async (replyData) => {
  try {
    const response = await supabaseApi.post('/ticket_replies', replyData)
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('createTicketReply failed:', error)
    throw error
  }
}
