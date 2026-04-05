import { supabase } from '@/lib/supabase'

/**
 * Log an action to the audit trail
 * @param {Object} params
 * @param {string} params.action - 'create' | 'update' | 'delete' | 'suspend' | 'login' | 'payment' | etc.
 * @param {string} params.entityType - 'customer' | 'invoice' | 'hosting' | 'domain' | etc.
 * @param {string} params.entityId - UUID of the entity
 * @param {string} params.entityName - Human readable name
 * @param {Object} params.changes - What changed
 * @param {Object} params.metadata - Extra context
 */
export async function logAudit({ action, entityType, entityId, entityName, changes, metadata }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role, email').eq('id', user?.id).single()

    await supabase.from('audit_logs').insert({
      actor_id: user?.id,
      actor_email: profile?.email || user?.email,
      actor_role: profile?.role || 'unknown',
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      changes: changes ? JSON.stringify(changes) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
  } catch (err) {
    console.error('Audit log failed:', err)
    // Silent fail - don't break the main action
  }
}
