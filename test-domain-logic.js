// Test script to mimic Edge Function logic
const RP_USERNAME = 'store245114'
const RP_PASSWORD = 'Enes16P1289!'
const RP_API_URL = 'https://api.duoservers.com'

const domains = ['google', 'example']
const extensions = ['com', 'net']
const period = 1

async function testDomainCheck() {
  const results = []

  for (const sld of domains) {
    try {
      const params = new URLSearchParams({
        auth_username: RP_USERNAME,
        auth_password: RP_PASSWORD,
        section: 'domains',
        command: 'check',
        name: sld,
        return_type: 'json'
      })

      extensions.forEach(ext => {
        params.append('tlds[]', ext)
      })

      const apiUrl = `${RP_API_URL}/?${params.toString()}`

      console.log(`🔍 Checking: ${sld} with extensions: ${extensions.join(', ')}`)
      console.log(`📡 API URL: ${apiUrl}`)

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log(`📥 Response Status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error: ${response.status} ${response.statusText}`)
        console.error(`❌ Error Response: ${errorText}`)
        continue
      }

      const responseText = await response.text()
      console.log(`📄 Raw Response: ${responseText}`)

      const data = JSON.parse(responseText)

      console.log('📦 Parsed Response:', JSON.stringify(data, null, 2))

      // Response is wrapped in numbered object (e.g., "1": {...})
      const responseData = data['1'] || data

      // Check for API errors
      if (responseData.error_code && responseData.error_code !== 0) {
        console.error(`❌ API Error ${responseData.error_code}: ${responseData.error_msg}`)
        continue
      }

      // Parse results - result object has TLD as keys with status codes
      // Status: 0 = available, 1 = unavailable
      if (responseData.result && typeof responseData.result === 'object') {
        console.log(`✅ Found ${Object.keys(responseData.result).length} results`)
        for (const [tld, status] of Object.entries(responseData.result)) {
          const result = {
            domain: `${sld}.${tld}`,
            sld: sld,
            tld: tld,
            available: status === 0,
            status: status === 0 ? 'available' : 'unavailable',
            price: 0,
            currency: 'USD',
            period: period,
          }
          console.log(`  - ${result.domain}: ${result.status}`)
          results.push(result)
        }
      } else {
        console.log(`❌ No result object found or result is not an object`)
      }
    } catch (err) {
      console.error(`❌ Error checking ${sld}:`, err.message)
    }
  }

  console.log(`\n✅ Total results: ${results.length}`)
  console.log(JSON.stringify({ success: true, results }, null, 2))
}

testDomainCheck()
