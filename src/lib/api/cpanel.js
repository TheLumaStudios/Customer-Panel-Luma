import { supabase } from '@/lib/supabase'

// Construct functions URL
const baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_FUNCTIONS_URL = baseUrl.includes('/rest/v1')
  ? baseUrl.replace('/rest/v1', '/functions/v1')
  : `${baseUrl}/functions/v1`

/**
* Create a thin cPanel/WHM API client bound to a specific server row.
*
* All calls are proxied through the `cpanel-proxy` edge function so the
* browser never talks to the WHM endpoint directly (CORS + credential
* leak). Returns an object with the methods used by the rest of the app:
*
*   listAccounts()           → WHM /listaccts
*   getAccount(username)     → WHM /accountsummary
*   getDiskUsage(username)   → WHM /get_disk_usage
*   getBandwidth(username)   → WHM /showbw
*
* Each method returns `{ success, ... }` mirroring the WHM payload.
*
* This existed implicitly — `syncAccountsFromServer` in hosting.js
* imported it, but the export was missing, producing "n is not a function"
* in the minified bundle whenever an admin hit "cPanel'den Çek".
*/
export function createCPanelAPI(server) {
  if (!server) {
    throw new Error('createCPanelAPI: server is required')
  }

  const callProxy = async (endpoint, params = {}, method = 'GET') => {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/cpanel-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({ server, endpoint, method, params }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(err.error || `HTTP ${response.status}`)
    }
    return response.json()
  }

  return {
/** WHM listaccts — returns all cPanel accounts on the server. */
    async listAccounts() {
      try {
        const data = await callProxy('/listaccts', { 'api.version': 1 })
        const accounts = data?.data?.acct || data?.acct || []
        return { success: true, accounts }
      } catch (error) {
        console.error('cpanel.listAccounts failed:', error)
        return { success: false, error: error.message, accounts: [] }
      }
    },

/** WHM accountsummary — single account info. */
    async getAccount(username) {
      try {
        const data = await callProxy('/accountsummary', {
          'api.version': 1,
          user: username,
        })
        const acct = data?.data?.acct?.[0] || data?.acct?.[0] || null
        return { success: !!acct, account: acct }
      } catch (error) {
        console.error('cpanel.getAccount failed:', error)
        return { success: false, error: error.message }
      }
    },

    async getDiskUsage(username) {
      try {
        const data = await callProxy('/get_disk_usage', {
          'api.version': 1,
          user: username,
        })
        return { success: true, data: data?.data || data }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },

    async getBandwidth(username) {
      try {
        const data = await callProxy('/showbw', {
          'api.version': 1,
          searchtype: 'user',
          search: username,
        })
        return { success: true, data: data?.data || data }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },
  }
}

/**
 * Create cPanel account
 * @param {Object} accountData - Account creation data
 * @param {string} accountData.hosting_id - Hosting ID
 * @param {string} accountData.domain - Domain name
 * @param {string} accountData.username - cPanel username
 * @param {string} accountData.password - cPanel password (optional, auto-generated if not provided)
 * @param {string} accountData.package_name - Hosting package name
 * @param {string} accountData.email - Contact email
 * @param {string} accountData.server_id - Server ID (optional)
 */
export const createCPanelAccount = async (accountData) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/cpanel-create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(accountData),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to create cPanel account')
    }

    return result.account
  } catch (error) {
    console.error('createCPanelAccount failed:', error)
    throw error
  }
}

/**
 * Suspend cPanel account
 * @param {string} hosting_id - Hosting ID
 * @param {string} reason - Suspension reason
 */
export const suspendCPanelAccount = async (hosting_id, reason = 'Payment overdue') => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/cpanel-suspend-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ hosting_id, reason }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to suspend cPanel account')
    }

    return result
  } catch (error) {
    console.error('suspendCPanelAccount failed:', error)
    throw error
  }
}

/**
 * Unsuspend cPanel account
 * @param {string} hosting_id - Hosting ID
 */
export const unsuspendCPanelAccount = async (hosting_id) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/cpanel-unsuspend-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ hosting_id }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to unsuspend cPanel account')
    }

    return result
  } catch (error) {
    console.error('unsuspendCPanelAccount failed:', error)
    throw error
  }
}

/**
 * Terminate cPanel account
 * @param {string} hosting_id - Hosting ID
 * @param {boolean} keep_dns - Keep DNS records (default: false)
 */
export const terminateCPanelAccount = async (hosting_id, keep_dns = false) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/cpanel-terminate-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ hosting_id, keep_dns }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to terminate cPanel account')
    }

    return result
  } catch (error) {
    console.error('terminateCPanelAccount failed:', error)
    throw error
  }
}

/**
 * Get cPanel account info
 * @param {string} hosting_id - Hosting ID
 */
export const getCPanelAccountInfo = async (hosting_id) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/cpanel-get-account-info?hosting_id=${hosting_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to get cPanel account info')
    }

    return result.account
  } catch (error) {
    console.error('getCPanelAccountInfo failed:', error)
    throw error
  }
}

/**
 * Change cPanel password
 * @param {string} hosting_id - Hosting ID
 * @param {string} new_password - New password
 */
export const changeCPanelPassword = async (hosting_id, new_password) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/cpanel-change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ hosting_id, new_password }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to change password')
    }

    return result
  } catch (error) {
    console.error('changeCPanelPassword failed:', error)
    throw error
  }
}

/**
 * Change cPanel package
 * @param {string} hosting_id - Hosting ID
 * @param {string} new_package - New package name
 */
export const changeCPanelPackage = async (hosting_id, new_package) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/cpanel-change-package`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ hosting_id, new_package }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to change package')
    }

    return result
  } catch (error) {
    console.error('changeCPanelPackage failed:', error)
    throw error
  }
}
