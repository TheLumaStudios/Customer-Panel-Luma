/**
 * cPanel/WHM API Integration Service
 *
 * WHM API v1 Documentation: https://api.docs.cpanel.net/
 *
 * Uses Supabase Edge Function as proxy to avoid CORS issues
 */

const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cpanel-proxy`
  : 'http://localhost:54321/functions/v1/cpanel-proxy'

class CPanelAPIService {
  constructor(server) {
    this.server = server
  }

  /**
   * Make request via Edge Function proxy
   */
  async makeRequest(endpoint, method = 'GET', params = {}) {
    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          server: this.server,
          endpoint,
          method,
          params,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('cPanel API Request failed:', error)
      throw error
    }
  }

  /**
   * Test server connection
   */
  async testConnection() {
    try {
      const response = await this.makeRequest('/version')
      return {
        success: true,
        version: response.data?.version || response.version,
        message: 'Sunucu bağlantısı başarılı'
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.message
      }
    }
  }

  /**
   * List all cPanel accounts on server
   * WHM API Function: listaccts
   */
  async listAccounts() {
    try {
      const response = await this.makeRequest('/listaccts')
      const accounts = response.data?.acct || response.acct || []

      return {
        success: true,
        accounts: accounts,
        total: response.metadata?.result === 1
      }
    } catch (error) {
      throw new Error(`List accounts failed: ${error.message}`)
    }
  }

  /**
   * Get account summary/details
   * WHM API Function: accountsummary
   */
  async getAccountSummary(username) {
    try {
      const response = await this.makeRequest('/accountsummary', 'GET', { user: username })
      const account = response.data?.acct?.[0] || response.acct?.[0]

      return {
        success: true,
        account: account
      }
    } catch (error) {
      throw new Error(`Get account summary failed: ${error.message}`)
    }
  }

  /**
   * Create new cPanel account
   * WHM API Function: createacct
   */
  async createAccount(accountData) {
    try {
      const params = {
        username: accountData.username,
        domain: accountData.domain,
        password: accountData.password,
        contactemail: accountData.contactemail || accountData.email,
        plan: accountData.plan || undefined,
        quota: accountData.quota || 0,
        cgi: accountData.cgi ? 1 : 0,
        hasshell: accountData.hasshell ? 1 : 0,
        maxftp: accountData.maxftp || 'unlimited',
        maxsql: accountData.maxsql || 'unlimited',
        maxpop: accountData.maxpop || 'unlimited',
        maxlst: accountData.maxlst || 'unlimited',
        maxsub: accountData.maxsub || 'unlimited',
        maxpark: accountData.maxpark || 'unlimited',
        maxaddon: accountData.maxaddon || 'unlimited',
        ip: accountData.ip || 'n',
        useregns: accountData.useregns || 0,
      }

      const response = await this.makeRequest('/createacct', 'POST', params)

      return {
        success: response.metadata?.result === 1,
        message: response.metadata?.reason || 'Hesap oluşturuldu',
        username: accountData.username,
        domain: accountData.domain,
        rawlanguage: response.data?.rawout
      }
    } catch (error) {
      throw new Error(`Create account failed: ${error.message}`)
    }
  }

  /**
   * Suspend cPanel account
   */
  async suspendAccount(username, reason = 'Suspended by admin') {
    try {
      const response = await this.makeRequest('/suspendacct', 'POST', {
        user: username,
        reason: reason
      })

      return {
        success: response.metadata?.result === 1,
        message: response.metadata?.reason || 'Hesap askıya alındı'
      }
    } catch (error) {
      throw new Error(`Suspend account failed: ${error.message}`)
    }
  }

  /**
   * Unsuspend cPanel account
   */
  async unsuspendAccount(username) {
    try {
      const response = await this.makeRequest('/unsuspendacct', 'POST', { user: username })

      return {
        success: response.metadata?.result === 1,
        message: response.metadata?.reason || 'Hesap aktif edildi'
      }
    } catch (error) {
      throw new Error(`Unsuspend account failed: ${error.message}`)
    }
  }

  /**
   * Terminate (delete) cPanel account
   */
  async terminateAccount(username, keepdns = false) {
    try {
      const response = await this.makeRequest('/removeacct', 'POST', {
        user: username,
        keepdns: keepdns ? 1 : 0
      })

      return {
        success: response.metadata?.result === 1,
        message: response.metadata?.reason || 'Hesap silindi'
      }
    } catch (error) {
      throw new Error(`Terminate account failed: ${error.message}`)
    }
  }

  /**
   * Change account password
   */
  async changePassword(username, newPassword) {
    try {
      const response = await this.makeRequest('/passwd', 'POST', {
        user: username,
        password: newPassword
      })

      return {
        success: response.metadata?.result === 1,
        message: response.metadata?.reason || 'Şifre değiştirildi'
      }
    } catch (error) {
      throw new Error(`Change password failed: ${error.message}`)
    }
  }

  /**
   * Get server load average
   */
  async getLoadAverage() {
    try {
      const response = await this.makeRequest('/loadavg')
      return {
        success: true,
        one: response.data?.one,
        five: response.data?.five,
        fifteen: response.data?.fifteen
      }
    } catch (error) {
      throw new Error(`Get load average failed: ${error.message}`)
    }
  }

  /**
   * Get system load and stats
   */
  async getSystemStats() {
    try {
      const response = await this.makeRequest('/systemloadavg')
      return {
        success: true,
        ...response.data
      }
    } catch (error) {
      throw new Error(`Get system stats failed: ${error.message}`)
    }
  }

  /**
   * List hosting packages/plans
   */
  async listPackages() {
    try {
      const response = await this.makeRequest('/listpkgs')

      // WHM API returns {data: {pkg: [...]}, metadata: {...}}
      // But sometimes returns directly {package: [...]}
      const packages = response.data?.pkg || response.package || response.pkg || []

      console.log('Packages found:', packages.length)

      return {
        success: true,
        packages: packages
      }
    } catch (error) {
      console.error('listPackages error:', error)
      throw new Error(`List packages failed: ${error.message}`)
    }
  }

  /**
   * Get account bandwidth
   */
  async getAccountBandwidth(username, month, year) {
    try {
      const params = { search: username }
      if (month) params.month = month
      if (year) params.year = year

      const response = await this.makeRequest('/showbw', 'GET', params)
      return {
        success: true,
        bandwidth: response.data?.acct?.[0]
      }
    } catch (error) {
      throw new Error(`Get account bandwidth failed: ${error.message}`)
    }
  }

  /**
   * Get hostname
   */
  async getHostname() {
    try {
      const response = await this.makeRequest('/gethostname')
      return {
        success: true,
        hostname: response.data?.hostname
      }
    } catch (error) {
      throw new Error(`Get hostname failed: ${error.message}`)
    }
  }
}

/**
 * Create cPanel API instance for a server
 */
export function createCPanelAPI(server) {
  if (!server) {
    throw new Error('Server configuration is required')
  }

  if (!server.hostname) {
    throw new Error('Server hostname is required')
  }

  if (!server.username) {
    throw new Error('Server username is required')
  }

  if (!server.api_token && !server.access_hash && !server.password) {
    throw new Error('Server authentication (API token, access hash, or password) is required')
  }

  return new CPanelAPIService(server)
}

/**
 * Test connection to a cPanel server
 */
export async function testServerConnection(server) {
  try {
    const api = createCPanelAPI(server)
    const result = await api.testConnection()

    if (result.success) {
      // Get additional stats
      const [loadAvg, hostname] = await Promise.all([
        api.getLoadAverage().catch(() => null),
        api.getHostname().catch(() => null)
      ])

      return {
        success: true,
        message: result.message,
        version: result.version,
        hostname: hostname?.hostname,
        load_average: loadAvg?.one
      }
    }

    return result
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error.toString()
    }
  }
}

export default CPanelAPIService
