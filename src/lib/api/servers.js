import supabaseApi from '@/lib/axios'

export const getServers = async () => {
  try {
    const response = await supabaseApi.get('/servers', {
      params: {
        select: '*',
        order: 'server_name.asc'
      }
    })
    return response.data || []
  } catch (error) {
    console.error('getServers failed:', error)
    throw error
  }
}

export const getServer = async (id) => {
  try {
    const response = await supabaseApi.get('/servers', {
      params: {
        select: '*',
        id: `eq.${id}`
      }
    })
    return response.data?.[0]
  } catch (error) {
    console.error('getServer failed:', error)
    throw error
  }
}

export const createServer = async (serverData) => {
  try {
    const response = await supabaseApi.post('/servers', serverData)
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('createServer failed:', error)
    throw error
  }
}

export const updateServer = async (id, serverData) => {
  try {
    const response = await supabaseApi.patch('/servers', {
      ...serverData,
      updated_at: new Date().toISOString()
    }, {
      params: { id: `eq.${id}` }
    })
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('updateServer failed:', error)
    throw error
  }
}

export const deleteServer = async (id) => {
  try {
    await supabaseApi.delete('/servers', {
      params: { id: `eq.${id}` }
    })
  } catch (error) {
    console.error('deleteServer failed:', error)
    throw error
  }
}

export const testServerConnection = async (id) => {
  try {
    // Get server details
    const response = await supabaseApi.get('/servers', {
      params: {
        select: '*',
        id: `eq.${id}`
      }
    })

    const server = response.data?.[0]
    if (!server) {
      throw new Error('Server not found')
    }

    // Test connection based on server type
    if (server.server_type === 'cpanel') {
      // Import cPanel API dynamically
      const { testServerConnection: testCPanel } = await import('./cpanel')
      const result = await testCPanel(server)

      // Update server last_checked and status_message
      await supabaseApi.patch('/servers', {
        last_checked: new Date().toISOString(),
        status_message: result.message,
        updated_at: new Date().toISOString()
      }, {
        params: { id: `eq.${id}` }
      })

      return result
    } else {
      // For other server types, return a placeholder
      return {
        success: true,
        message: `${server.server_type} sunucu tipi için test henüz uygulanmadı`,
        type: server.server_type
      }
    }
  } catch (error) {
    console.error('testServerConnection failed:', error)

    // Update server with error status
    try {
      await supabaseApi.patch('/servers', {
        last_checked: new Date().toISOString(),
        status_message: error.message,
        updated_at: new Date().toISOString()
      }, {
        params: { id: `eq.${id}` }
      })
    } catch (updateError) {
      console.error('Failed to update server status:', updateError)
    }

    throw error
  }
}
