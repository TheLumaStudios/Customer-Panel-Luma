import supabaseApi from '@/lib/axios'

export const getHostingPackages = async () => {
  try {
    const response = await supabaseApi.get('/hosting_packages', {
      params: {
        select: '*',
        order: 'display_order.asc'
      }
    })
    return response.data || []
  } catch (error) {
    console.error('getHostingPackages failed:', error)
    throw error
  }
}

export const getHostingPackage = async (id) => {
  try {
    const response = await supabaseApi.get('/hosting_packages', {
      params: {
        select: '*',
        id: `eq.${id}`
      }
    })
    return response.data?.[0]
  } catch (error) {
    console.error('getHostingPackage failed:', error)
    throw error
  }
}

export const createHostingPackage = async (packageData) => {
  try {
    const response = await supabaseApi.post('/hosting_packages', packageData)
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('createHostingPackage failed:', error)
    throw error
  }
}

export const updateHostingPackage = async (id, packageData) => {
  try {
    const response = await supabaseApi.patch('/hosting_packages', {
      ...packageData,
      updated_at: new Date().toISOString()
    }, {
      params: { id: `eq.${id}` }
    })
    return response.data?.[0] || response.data
  } catch (error) {
    console.error('updateHostingPackage failed:', error)
    throw error
  }
}

export const deleteHostingPackage = async (id) => {
  try {
    await supabaseApi.delete('/hosting_packages', {
      params: { id: `eq.${id}` }
    })
  } catch (error) {
    console.error('deleteHostingPackage failed:', error)
    throw error
  }
}

/**
 * Sync hosting packages from cPanel server
 * Fetches all packages/plans from cPanel and creates hosting_packages records
 */
export const syncPackagesFromServer = async (serverId) => {
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

    // Get all packages from cPanel
    const packagesResult = await cpanel.listPackages()

    if (!packagesResult.success) {
      throw new Error('cPanel paketleri listelenemedi')
    }

    const packages = packagesResult.packages

    if (!packages || packages.length === 0) {
      return {
        success: true,
        message: 'Sunucuda paket bulunamadı',
        total: 0,
        synced: 0,
        created: 0,
        updated: 0
      }
    }

    // Get existing packages
    const existingPackagesResponse = await supabaseApi.get('/hosting_packages', {
      params: { select: '*' }
    })
    const existingPackages = existingPackagesResponse.data || []

    let created = 0
    let updated = 0

    // Process each package
    for (const pkg of packages) {
      try {
        // Check if package already exists (by package_code)
        const packageCode = pkg.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')
        const existingPackage = existingPackages.find(p =>
          p.package_code === packageCode
        )

        const packageData = {
          package_name: pkg.name,
          package_code: packageCode,
          disk_space_gb: pkg.QUOTA === 'unlimited' ? 0 : Math.ceil(parseInt(pkg.QUOTA) / 1024) || 10,
          bandwidth_gb: pkg.BWLIMIT === 'unlimited' ? -1 : Math.ceil(parseInt(pkg.BWLIMIT) / 1024) || -1,
          email_accounts: pkg.MAXPOP === 'unlimited' ? -1 : parseInt(pkg.MAXPOP) || -1,
          databases: pkg.MAXSQL === 'unlimited' ? -1 : parseInt(pkg.MAXSQL) || -1,
          ftp_accounts: pkg.MAXFTP === 'unlimited' ? -1 : parseInt(pkg.MAXFTP) || -1,
          ssl_certificate: true, // Assume SSL is available
          backup_frequency: 'weekly',
          monthly_price: 0, // Will need to be set manually
          yearly_price: 0,
          description: `cPanel'den senkronize edildi: ${server.server_name}`,
          is_active: true,
          display_order: created + updated
        }

        if (existingPackage) {
          // Update existing package
          await supabaseApi.patch('/hosting_packages', {
            ...packageData,
            updated_at: new Date().toISOString()
          }, {
            params: { id: `eq.${existingPackage.id}` }
          })
          updated++
        } else {
          // Create new package
          await supabaseApi.post('/hosting_packages', packageData)
          created++
        }
      } catch (packageError) {
        console.error(`Error processing package ${pkg.name}:`, packageError)
      }
    }

    return {
      success: true,
      message: `${packages.length} paket senkronize edildi`,
      total: packages.length,
      created,
      updated
    }
  } catch (error) {
    console.error('syncPackagesFromServer failed:', error)
    throw error
  }
}
