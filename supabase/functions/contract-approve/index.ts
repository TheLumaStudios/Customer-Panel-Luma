// Sözleşme onaylama - İnkar edilemezlik (non-repudiation) ile
// Deploy: supabase functions deploy contract-approve

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SHA-256 hash hesaplama
async function calculateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const {
      customer_contract_id,
      approval_status, // 'approved' or 'rejected'
      approval_text, // Kullanıcının okuduğu onay metni
      device_fingerprint, // Opsiyonel: cihaz parmak izi
    } = await req.json()

    console.log('📝 Processing contract approval:', customer_contract_id)

    // Sözleşmeyi getir
    const { data: contract } = await supabaseAdmin
      .from('customer_contracts')
      .select('*')
      .eq('id', customer_contract_id)
      .single()

    if (!contract) throw new Error('Contract not found')
    if (contract.customer_id !== user.id) throw new Error('Unauthorized - contract does not belong to user')
    if (contract.status !== 'pending') throw new Error('Contract already processed')

    // NON-REPUDIATION: İnkar edilemezlik bilgilerini topla
    const ipAddress = req.headers.get('x-forwarded-for') ||
                      req.headers.get('x-real-ip') ||
                      '0.0.0.0'

    const userAgent = req.headers.get('user-agent') || 'Unknown'

    // Coğrafi konum (opsiyonel - IP'den belirlenebilir)
    const geolocation = {
      ip: ipAddress,
      timestamp: new Date().toISOString(),
    }

    // Onay metninin hash'ini hesapla
    const approvalTextHash = await calculateSHA256(approval_text || contract.contract_content)

    console.log('🔐 Non-repudiation data collected:', {
      ip: ipAddress,
      userAgent: userAgent.substring(0, 50),
      timestamp: new Date().toISOString(),
    })

    // Onay kaydı oluştur
    const { data: approval, error: approvalError } = await supabaseAdmin
      .from('contract_approvals')
      .insert({
        customer_contract_id,
        customer_id: user.id,
        approval_status,
        approval_text,
        approval_text_hash: approvalTextHash,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_fingerprint,
        geolocation,
        approved_at: new Date().toISOString(),
        approval_method: 'web_interface',
      })
      .select()
      .single()

    if (approvalError) throw approvalError

    console.log('✅ Contract approval recorded')

    // Sözleşme durumu otomatik güncellenir (trigger tarafından)
    // Ama response için güncel durumu getirelim
    const { data: updatedContract } = await supabaseAdmin
      .from('customer_contracts')
      .select('*')
      .eq('id', customer_contract_id)
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        approval,
        contract: updatedContract,
        non_repudiation_info: {
          recorded: true,
          ip_address: ipAddress,
          timestamp: approval.approved_at,
          hash: approvalTextHash,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Contract approval error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
