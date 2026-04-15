import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const YONCU_API_ID = Deno.env.get('YONCU_API_ID') || ''
const YONCU_API_KEY = Deno.env.get('YONCU_API_KEY') || ''
const YONCU_BASE_URL = 'https://www.yoncu.com/apiler'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, params = {} } = await req.json()

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map actions to Yöncü API endpoints
    const endpoints: Record<string, string> = {
      'list-servers': '/sunucu/sunucular.php',
      'power': '/sunucu/power.php',
      'rdns': '/sunucu/rdns.php',
      'systems': '/sunucu/sistemler.php',
      'report': '/sunucu/rapor.php',
      'mac': '/IP/mac.php',
      'ip-options': '/IP/secenekler.php',
    }

    const endpoint = endpoints[action]
    if (!endpoint) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build URL with auth params
    const url = new URL(`${YONCU_BASE_URL}${endpoint}`)
    url.searchParams.set('id', YONCU_API_ID)
    url.searchParams.set('key', YONCU_API_KEY)

    // Add extra params
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })

    const text = await response.text()

    // Yöncü API returns JSON like [true, "data"] or [false, "error"]
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
