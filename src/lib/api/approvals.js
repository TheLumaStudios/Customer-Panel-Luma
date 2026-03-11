import { supabase } from '@/lib/supabase'

/**
 * Get all pending approvals
 * @param {Object} options - Query options
 */
export const getApprovals = async (options = {}) => {
  try {
    let query = supabase
      .from('pending_approvals')
      .select(`
        *,
        requester:requested_by(full_name, email),
        reviewer:reviewed_by(full_name, email),
        customer:customers(full_name, email, customer_code)
      `)
      .order('created_at', { ascending: false })

    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.operation_type) {
      query = query.eq('operation_type', options.operation_type)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('getApprovals failed:', error)
    throw error
  }
}

/**
 * Get single approval
 * @param {string} id - Approval ID
 */
export const getApproval = async (id) => {
  try {
    const { data, error } = await supabase
      .from('pending_approvals')
      .select(`
        *,
        requester:requested_by(full_name, email),
        reviewer:reviewed_by(full_name, email),
        customer:customers(full_name, email, customer_code)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('getApproval failed:', error)
    throw error
  }
}

/**
 * Create approval request
 * @param {Object} approvalData - Approval data
 */
export const createApproval = async (approvalData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('pending_approvals')
      .insert([{
        ...approvalData,
        requested_by: user?.id,
        requested_at: new Date().toISOString(),
        status: 'pending',
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('createApproval failed:', error)
    throw error
  }
}

/**
 * Approve or reject approval request
 * @param {string} id - Approval ID
 * @param {string} action - 'approve' or 'reject'
 * @param {string} notes - Review notes
 */
export const reviewApproval = async (id, action, notes = '') => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const status = action === 'approve' ? 'approved' : 'rejected'

    const { data, error } = await supabase
      .from('pending_approvals')
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('reviewApproval failed:', error)
    throw error
  }
}

/**
 * Execute approved operation
 * @param {string} approval_id - Approval ID
 */
export const executeApprovedOperation = async (approval_id) => {
  try {
    const approval = await getApproval(approval_id)

    if (approval.status !== 'approved') {
      throw new Error('Operation is not approved')
    }

    // TODO: Execute the actual operation based on operation_type
    // This will need to call the appropriate API (refund, credit add, etc.)

    return { success: true }
  } catch (error) {
    console.error('executeApprovedOperation failed:', error)
    throw error
  }
}
