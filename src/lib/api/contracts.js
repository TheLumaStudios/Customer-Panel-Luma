import { supabase } from '@/lib/supabase'

const baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_FUNCTIONS_URL = baseUrl.includes('/rest/v1')
  ? baseUrl.replace('/rest/v1', '/functions/v1')
  : `${baseUrl}/functions/v1`

// Sözleşme şablonları

export const getContractTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('getContractTemplates failed:', error)
    throw error
  }
}

export const createContractTemplate = async (templateData) => {
  try {
    // SHA-256 hash hesapla
    const encoder = new TextEncoder()
    const data = encoder.encode(templateData.content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { data: template, error } = await supabase
      .from('contract_templates')
      .insert({
        ...templateData,
        content_hash: contentHash,
      })
      .select()
      .single()

    if (error) throw error
    return template
  } catch (error) {
    console.error('createContractTemplate failed:', error)
    throw error
  }
}

export const updateContractTemplate = async (id, templateData) => {
  try {
    // Eğer içerik değiştiyse SHA-256 hash'i yeniden hesapla
    let updateData = { ...templateData }
    if (templateData.content) {
      const encoder = new TextEncoder()
      const data = encoder.encode(templateData.content)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      updateData.content_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    const { data, error } = await supabase
      .from('contract_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('updateContractTemplate failed:', error)
    throw error
  }
}

// Müşteri sözleşmeleri

export const getCustomerContracts = async (params = {}) => {
  try {
    let query = supabase
      .from('customer_contracts')
      .select(`
        *,
        template:contract_templates(name, type),
        customer:customers(full_name, email),
        sent_by_profile:profiles!customer_contracts_sent_by_fkey(full_name)
      `)

    if (params.customer_id) {
      query = query.eq('customer_id', params.customer_id)
    }

    if (params.status) {
      query = query.eq('status', params.status)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('getCustomerContracts failed:', error)
    throw error
  }
}

export const getCustomerContract = async (id) => {
  try {
    const { data, error } = await supabase
      .from('customer_contracts')
      .select(`
        *,
        template:contract_templates(*),
        customer:customers(*),
        approvals:contract_approvals(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('getCustomerContract failed:', error)
    throw error
  }
}

// TEST: Auth debugging
export const testContractAuth = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
    }

    console.log('Testing with token:', session.access_token ? 'Token exists' : 'No token')

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/test-contract-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    })

    const responseData = await response.json()
    console.log('Test result:', responseData)
    return responseData
  } catch (error) {
    console.error('testContractAuth failed:', error)
    throw error
  }
}

// Sözleşme gönderme - Geçici olarak direkt database insert kullanıyoruz
export const sendContract = async (contractData) => {
  try {
    console.log('📤 Sending contract request:', contractData)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
    }

    console.log('✅ User found:', user.email)

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', contractData.template_id)
      .single()

    if (templateError || !template) {
      throw new Error('Şablon bulunamadı')
    }

    console.log('✅ Template found:', template.name)

    // Verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, full_name')
      .eq('id', contractData.customer_id)
      .single()

    if (customerError || !customer) {
      console.error('❌ Customer not found:', contractData.customer_id, customerError)
      throw new Error('Müşteri bulunamadı')
    }

    console.log('✅ Customer found:', customer.full_name, customer.email)
    console.log('📝 Will insert contract with customer_id:', customer.id)

    // Calculate hash
    const encoder = new TextEncoder()
    const data = encoder.encode(template.content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const contractHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (contractData.expires_in_days || 30))

    // Insert contract
    console.log('📤 Inserting contract with data:', {
      customer_id: customer.id,
      template_id: contractData.template_id,
      status: 'pending',
      is_mandatory: template.is_mandatory,
      sent_by: user.id,
    })

    const { data: customerContract, error: contractError } = await supabase
      .from('customer_contracts')
      .insert({
        customer_id: customer.id,
        template_id: contractData.template_id,
        contract_content: template.content,
        contract_hash: contractHash,
        version: template.version,
        service_type: contractData.service_type || null,
        service_id: contractData.service_id || null,
        status: 'pending',
        is_mandatory: template.is_mandatory,
        sent_by: user.id,
        sent_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (contractError) {
      console.error('❌ Contract insert error:', contractError)
      throw new Error(contractError.message)
    }

    console.log('✅ Contract inserted successfully!')
    console.log('📋 Contract details:', {
      id: customerContract.id,
      customer_id: customerContract.customer_id,
      status: customerContract.status,
      template_id: customerContract.template_id,
    })

    // Create history record
    console.log('📜 Creating history record...')
    const { error: historyError } = await supabase
      .from('contract_history')
      .insert({
        customer_contract_id: customerContract.id,
        action: 'sent',
        old_status: null,
        new_status: 'pending',
        performed_by: user.id,
        details: {
          template_name: template.name,
          expires_at: expiresAt.toISOString(),
        },
      })

    if (historyError) {
      console.warn('⚠️ History record failed (non-critical):', historyError)
    } else {
      console.log('✅ History record created')
    }

    console.log('🎉 Contract send complete! Customer should see modal now.')
    return { success: true, contract: customerContract }
  } catch (error) {
    console.error('❌ sendContract failed:', error)
    throw error
  }
}

// Sözleşme onaylama - Client-side implementation
export const approveContract = async (approvalData) => {
  try {
    console.log('📝 Approving contract:', approvalData)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Oturum bulunamadı')
    }

    console.log('✅ User found:', user.email)

    // Get contract
    const { data: contract, error: contractError } = await supabase
      .from('customer_contracts')
      .select('*')
      .eq('id', approvalData.customer_contract_id)
      .single()

    if (contractError || !contract) {
      console.error('❌ Contract not found:', contractError)
      throw new Error('Sözleşme bulunamadı')
    }

    console.log('✅ Contract found:', contract.id, 'status:', contract.status)

    // Get customer to verify ownership
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!customer || contract.customer_id !== customer.id) {
      throw new Error('Bu sözleşme size ait değil')
    }

    if (contract.status !== 'pending') {
      throw new Error('Sözleşme zaten işlenmiş')
    }

    console.log('✅ Customer verified, creating approval...')

    // Calculate approval text hash
    const encoder = new TextEncoder()
    const data = encoder.encode(approvalData.approval_text || contract.contract_content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const approvalTextHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Get IP and user agent (will be '0.0.0.0' and 'Unknown' from client)
    const ipAddress = '0.0.0.0' // Client-side can't get real IP
    const userAgent = navigator.userAgent

    // Create approval record
    const { data: approval, error: approvalError } = await supabase
      .from('contract_approvals')
      .insert({
        customer_contract_id: approvalData.customer_contract_id,
        customer_id: customer.id,
        approval_status: approvalData.approval_status,
        approval_text: approvalData.approval_text || contract.contract_content,
        approval_text_hash: approvalTextHash,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_fingerprint: approvalData.device_fingerprint,
        approved_at: new Date().toISOString(),
        approval_method: 'web_interface',
      })
      .select()
      .single()

    if (approvalError) {
      console.error('❌ Approval insert error:', approvalError)
      throw new Error(approvalError.message)
    }

    console.log('✅ Approval created:', approval.id)

    // Update contract status (trigger will handle this, but we do it explicitly too)
    const { error: updateError } = await supabase
      .from('customer_contracts')
      .update({ status: approvalData.approval_status })
      .eq('id', approvalData.customer_contract_id)

    if (updateError) {
      console.warn('⚠️ Contract status update warning:', updateError)
    }

    console.log('🎉 Contract approved successfully!')

    return {
      success: true,
      approval: approval,
      non_repudiation_info: {
        approval_id: approval.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: approval.approved_at,
        hash: approvalTextHash,
      }
    }
  } catch (error) {
    console.error('❌ approveContract failed:', error)
    throw error
  }
}

// Onay bekleyen sözleşmeleri getir (müşteri için)
export const getPendingContracts = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    console.log('📋 Checking pending contracts for user:', user.email, user.id)

    // First, find customer by email
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', user.email)
      .single()

    if (customerError || !customer) {
      console.log('❌ Customer not found for email:', user.email)
      return []
    }

    console.log('✅ Customer found with ID:', customer.id)

    // Then get contracts for this customer
    const { data, error } = await supabase
      .from('customer_contracts')
      .select(`
        *,
        template:contract_templates(name, description, type)
      `)
      .eq('customer_id', customer.id)
      .eq('status', 'pending')
      .order('sent_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching contracts:', error)
      throw error
    }

    console.log('✅ Found pending contracts:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('getPendingContracts failed:', error)
    return [] // Return empty array instead of throwing to prevent app crash
  }
}

// Sözleşme geçmişi
export const getContractHistory = async (contractId) => {
  try {
    const { data, error } = await supabase
      .from('contract_history')
      .select(`
        *,
        performed_by_profile:profiles(full_name)
      `)
      .eq('customer_contract_id', contractId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('getContractHistory failed:', error)
    throw error
  }
}

// Tüm onayları getir (admin/employee için)
export const getAllApprovals = async () => {
  try {
    const { data, error } = await supabase
      .from('contract_approvals')
      .select(`
        *,
        contract:customer_contracts(
          id,
          customer_id,
          template_id,
          contract_content,
          version,
          customers(full_name, email),
          contract_templates(name, type)
        )
      `)
      .order('approved_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('getAllApprovals failed:', error)
    throw error
  }
}
