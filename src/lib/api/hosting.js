import supabaseApi from '@/lib/axios'

// This file is for customer hosting records (hosting table)
// For hosting packages definitions, use hostingPackages.js

export const getHosting = async () => {
  try {
    const response = await supabaseApi.get('/hosting', {
      params: {
        select: '*,customer:customers(*)',
        order: 'expiration_date.asc.nullslast'
      }
    })
    return response.data || []
  } catch (error) {
    console.error('getHosting failed:', error)
    throw error
  }
}

export const getHostingRecord = async (id) => {
  try {
    const response = await supabaseApi.get('/hosting', {
      params: {
        select: '*,customer:customers(*)',
        id: `eq.${id}`
      }
    })
    return response.data?.[0] || null
  } catch (error) {
    console.error('getHostingRecord failed:', error)
    throw error
  }
}

export const createHosting = async (hostingData) => {
  try {
    const response = await supabaseApi.post('/hosting', hostingData)
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('createHosting failed:', error)
    throw error
  }
}

export const updateHosting = async (id, hostingData) => {
  try {
    const response = await supabaseApi.patch('/hosting', hostingData, {
      params: { id: `eq.${id}` }
    })
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('updateHosting failed:', error)
    throw error
  }
}

export const deleteHosting = async (id) => {
  try {
    await supabaseApi.delete('/hosting', {
      params: { id: `eq.${id}` }
    })
  } catch (error) {
    console.error('deleteHosting failed:', error)
    throw error
  }
}

/**
 * Provision hosting account on cPanel server
 * Creates cPanel account based on hosting record and updates hosting with credentials
 */
export const provisionHosting = async (hostingId) => {
  try {
    // Get hosting record with all relations
    const hosting = await getHostingRecord(hostingId)
    if (!hosting) {
      throw new Error('Hosting kaydı bulunamadı')
    }

    if (!hosting.server_id) {
      throw new Error('Hosting kaydında sunucu seçilmemiş')
    }

    // Get server details
    const serverResponse = await supabaseApi.get('/servers', {
      params: {
        select: '*',
        id: `eq.${hosting.server_id}`
      }
    })
    const server = serverResponse.data?.[0]

    if (!server) {
      throw new Error('Sunucu bulunamadı')
    }

    if (!server.is_active) {
      throw new Error('Sunucu aktif değil')
    }

    // Get customer details
    const customerResponse = await supabaseApi.get('/customers', {
      params: {
        select: '*',
        id: `eq.${hosting.customer_id}`
      }
    })
    const customer = customerResponse.data?.[0]

    if (!customer) {
      throw new Error('Müşteri bulunamadı')
    }

    // Get hosting package details
    let packageDetails = null
    if (hosting.package_id) {
      const packageResponse = await supabaseApi.get('/hosting_packages', {
        params: {
          select: '*',
          id: `eq.${hosting.package_id}`
        }
      })
      packageDetails = packageResponse.data?.[0]
    }

    // Generate username and password if not set
    const username = hosting.username || generateCPanelUsername(hosting.domain || customer.profile?.full_name)
    const password = hosting.password || generateRandomPassword()

    // Create cPanel API instance
    const { createCPanelAPI } = await import('./cpanel')
    const cpanel = createCPanelAPI(server)

    // Prepare account data
    const accountData = {
      username: username,
      domain: hosting.domain || `${username}.${server.hostname}`,
      password: password,
      contactemail: customer.profile?.email,
      quota: hosting.disk_space_gb * 1024, // Convert GB to MB
      maxftp: packageDetails?.ftp_accounts || 'unlimited',
      maxsql: packageDetails?.databases || 'unlimited',
      maxpop: packageDetails?.email_accounts || 'unlimited',
      maxsub: 'unlimited',
      maxpark: 'unlimited',
      maxaddon: 'unlimited',
      cgi: true,
      hasshell: false,
    }

    // Create account on cPanel
    const result = await cpanel.createAccount(accountData)

    if (!result.success) {
      throw new Error(result.message)
    }

    // Update hosting record with credentials
    await updateHosting(hostingId, {
      username: username,
      password: password,
      domain: accountData.domain,
      status: 'active',
      notes: `cPanel hesabı oluşturuldu: ${new Date().toLocaleString('tr-TR')}\n${hosting.notes || ''}`
    })

    return {
      success: true,
      message: 'Hosting hesabı başarıyla oluşturuldu',
      username: username,
      domain: accountData.domain,
      server: server.server_name
    }
  } catch (error) {
    console.error('provisionHosting failed:', error)
    throw error
  }
}

/**
 * Suspend hosting account on cPanel server
 */
export const suspendHosting = async (hostingId, reason = 'Suspended by admin') => {
  try {
    const hosting = await getHostingRecord(hostingId)
    if (!hosting || !hosting.server_id || !hosting.username) {
      throw new Error('Hosting kaydı veya sunucu bilgileri eksik')
    }

    const serverResponse = await supabaseApi.get('/servers', {
      params: { select: '*', id: `eq.${hosting.server_id}` }
    })
    const server = serverResponse.data?.[0]

    const { createCPanelAPI } = await import('./cpanel')
    const cpanel = createCPanelAPI(server)

    const result = await cpanel.suspendAccount(hosting.username, reason)

    if (result.success) {
      await updateHosting(hostingId, {
        status: 'suspended',
        notes: `Askıya alındı: ${new Date().toLocaleString('tr-TR')}\nSebep: ${reason}\n${hosting.notes || ''}`
      })
    }

    return result
  } catch (error) {
    console.error('suspendHosting failed:', error)
    throw error
  }
}

/**
 * Unsuspend hosting account on cPanel server
 */
export const unsuspendHosting = async (hostingId) => {
  try {
    const hosting = await getHostingRecord(hostingId)
    if (!hosting || !hosting.server_id || !hosting.username) {
      throw new Error('Hosting kaydı veya sunucu bilgileri eksik')
    }

    const serverResponse = await supabaseApi.get('/servers', {
      params: { select: '*', id: `eq.${hosting.server_id}` }
    })
    const server = serverResponse.data?.[0]

    const { createCPanelAPI } = await import('./cpanel')
    const cpanel = createCPanelAPI(server)

    const result = await cpanel.unsuspendAccount(hosting.username)

    if (result.success) {
      await updateHosting(hostingId, {
        status: 'active',
        notes: `Aktif edildi: ${new Date().toLocaleString('tr-TR')}\n${hosting.notes || ''}`
      })
    }

    return result
  } catch (error) {
    console.error('unsuspendHosting failed:', error)
    throw error
  }
}

/**
 * Terminate hosting account on cPanel server
 */
export const terminateHosting = async (hostingId, keepDns = false) => {
  try {
    const hosting = await getHostingRecord(hostingId)
    if (!hosting || !hosting.server_id || !hosting.username) {
      throw new Error('Hosting kaydı veya sunucu bilgileri eksik')
    }

    const serverResponse = await supabaseApi.get('/servers', {
      params: { select: '*', id: `eq.${hosting.server_id}` }
    })
    const server = serverResponse.data?.[0]

    const { createCPanelAPI } = await import('./cpanel')
    const cpanel = createCPanelAPI(server)

    const result = await cpanel.terminateAccount(hosting.username, keepDns)

    if (result.success) {
      await updateHosting(hostingId, {
        status: 'expired',
        notes: `Sonlandırıldı: ${new Date().toLocaleString('tr-TR')}\n${hosting.notes || ''}`
      })
    }

    return result
  } catch (error) {
    console.error('terminateHosting failed:', error)
    throw error
  }
}

/**
 * Generate cPanel username from domain or name
 */
function generateCPanelUsername(input) {
  if (!input) {
    return 'user' + Math.random().toString(36).substr(2, 8)
  }

  // Remove domain extension and special characters
  let username = input
    .toLowerCase()
    .replace(/\.(com|net|org|tr|io|co|app)$/, '')
    .replace(/[^a-z0-9]/g, '')
    .substr(0, 16) // cPanel username max 16 chars

  // Add random suffix if too short
  if (username.length < 4) {
    username += Math.random().toString(36).substr(2, 4)
  }

  return username
}

/**
 * Generate random password
 */
function generateRandomPassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Sync accounts from cPanel server to database
 * Fetches all accounts from cPanel and creates/updates hosting records
 */
export const syncAccountsFromServer = async (serverId) => {
  try {
    // Get server details
    const serverResponse = await supabaseApi.get('/servers', {
      params: {
        select: '*',
        id: `eq.${serverId}`
      }
    })
    const server = serverResponse.data?.[0]

    if (!server) {
      throw new Error('Sunucu bulunamadı')
    }

    if (!server.is_active) {
      throw new Error('Sunucu aktif değil')
    }

    // Create cPanel API instance
    const { createCPanelAPI } = await import('./cpanel')
    const cpanel = createCPanelAPI(server)

    // Get all accounts from cPanel
    const accountsResult = await cpanel.listAccounts()
    if (!accountsResult.success) {
      throw new Error('cPanel hesapları listelenemedi')
    }

    const accounts = accountsResult.accounts
    if (!accounts || accounts.length === 0) {
      return {
        success: true,
        message: 'Sunucuda hesap bulunamadı',
        synced: 0,
        created: 0,
        updated: 0,
        errors: []
      }
    }

    // Get all customers
    const customersResponse = await supabaseApi.get('/customers', {
      params: { select: '*' }
    })
    const customers = customersResponse.data || []

    // Get existing hosting records for this server
    const existingHostingResponse = await supabaseApi.get('/hosting', {
      params: {
        select: '*',
        server_id: `eq.${serverId}`
      }
    })
    const existingHosting = existingHostingResponse.data || []

    let created = 0
    let updated = 0
    let skipped = 0
    const errors = []

    // Process each account
    for (const account of accounts) {
      try {
        // Try to find matching customer by domain or email
        let customer = customers.find(c =>
          c.profile?.email?.toLowerCase() === account.email?.toLowerCase() ||
          c.profile?.email?.toLowerCase().includes(account.domain?.toLowerCase())
        )

        // If no customer found, create a new one
        if (!customer) {
          try {
            // First, create customer without profile
            const newCustomerResponse = await supabaseApi.post('/customers', {
              customer_code: `AUTO-${account.user}`.toUpperCase(),
              notes: `cPanel'den otomatik oluşturuldu: ${new Date().toLocaleString('tr-TR')}`
            })

            const newCustomerId = newCustomerResponse.data?.[0]?.id || newCustomerResponse.data?.id

            if (!newCustomerId) {
              errors.push(`${account.domain}: Customer ID alınamadı`)
              skipped++
              continue
            }

            // Check if profile already exists
            const existingProfileResponse = await supabaseApi.get('/profiles', {
              params: {
                select: 'id',
                id: `eq.${newCustomerId}`
              }
            })

            const profileExists = existingProfileResponse.data && existingProfileResponse.data.length > 0

            if (!profileExists) {
              // Create new profile
              try {
                await supabaseApi.post('/profiles', {
                  id: newCustomerId,
                  full_name: account.owner || account.user,
                  email: account.email || `${account.user}@${account.domain}`,
                  role: 'customer'
                })
              } catch (profileError) {
                console.warn(`Profile creation failed for ${newCustomerId}:`, profileError)
                // Continue anyway, customer was created
              }
            } else {
              // Update existing profile
              try {
                await supabaseApi.patch('/profiles', {
                  full_name: account.owner || account.user,
                  email: account.email || `${account.user}@${account.domain}`,
                  role: 'customer'
                }, {
                  params: { id: `eq.${newCustomerId}` }
                })
              } catch (updateError) {
                console.warn(`Profile update failed for ${newCustomerId}:`, updateError)
                // Continue anyway
              }
            }

            // Refetch to get complete customer data
            const refetchResponse = await supabaseApi.get('/customers', {
              params: {
                select: '*',
                id: `eq.${newCustomerId}`
              }
            })
            customer = refetchResponse.data?.[0]

            if (!customer) {
              errors.push(`${account.domain}: Müşteri oluşturulamadı`)
              skipped++
              continue
            }
          } catch (createError) {
            errors.push(`${account.domain}: Müşteri oluşturma hatası - ${createError.message}`)
            skipped++
            continue
          }
        }

        // Check if hosting record already exists
        const existingRecord = existingHosting.find(h =>
          h.username?.toLowerCase() === account.user?.toLowerCase() ||
          h.domain?.toLowerCase() === account.domain?.toLowerCase()
        )

        const hostingData = {
          customer_id: customer.id,
          server_id: serverId,
          package_name: account.plan || 'Default',
          username: account.user,
          domain: account.domain,
          disk_space_gb: account.disklimit === 'unlimited' ? 0 : Math.ceil(parseInt(account.disklimit) / 1024) || 10,
          bandwidth_gb: -1, // unlimited
          start_date: account.startdate || new Date().toISOString().split('T')[0],
          expiration_date: calculateExpirationDate(account.startdate),
          status: account.suspended === '1' || account.suspended === 1 ? 'suspended' : 'active',
          notes: `cPanel'den senkronize edildi: ${new Date().toLocaleString('tr-TR')}\nIP: ${account.ip || 'N/A'}\nPlan: ${account.plan || 'N/A'}`
        }

        if (existingRecord) {
          // Update existing record
          await supabaseApi.patch('/hosting', {
            ...hostingData,
            updated_at: new Date().toISOString()
          }, {
            params: { id: `eq.${existingRecord.id}` }
          })
          updated++
        } else {
          // Create new record
          await supabaseApi.post('/hosting', hostingData)
          created++
        }
      } catch (accountError) {
        errors.push(`${account.domain}: ${accountError.message}`)
        skipped++
      }
    }

    // Update server last sync time
    await supabaseApi.patch('/servers', {
      last_checked: new Date().toISOString(),
      status_message: `${accounts.length} hesap senkronize edildi (${created} yeni, ${updated} güncellendi)`,
      updated_at: new Date().toISOString()
    }, {
      params: { id: `eq.${serverId}` }
    })

    return {
      success: true,
      message: `Senkronizasyon tamamlandı`,
      total: accounts.length,
      created,
      updated,
      skipped,
      errors
    }
  } catch (error) {
    console.error('syncAccountsFromServer failed:', error)
    throw error
  }
}

/**
 * Calculate expiration date (1 year from start date)
 */
function calculateExpirationDate(startDate) {
  try {
    const date = startDate ? new Date(startDate) : new Date()
    date.setFullYear(date.getFullYear() + 1)
    return date.toISOString().split('T')[0]
  } catch {
    const date = new Date()
    date.setFullYear(date.getFullYear() + 1)
    return date.toISOString().split('T')[0]
  }
}
