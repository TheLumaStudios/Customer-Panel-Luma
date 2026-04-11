import { supabase } from '@/lib/supabase'

export const getBankAccounts = async ({ onlyActive = false } = {}) => {
  let query = supabase
    .from('bank_accounts')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('bank_name', { ascending: true })
  if (onlyActive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const createBankAccount = async (payload) => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateBankAccount = async (id, payload) => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteBankAccount = async (id) => {
  const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
  if (error) throw error
}

export const uploadBankLogo = async (file) => {
  if (!file) throw new Error('Dosya yok')
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage
    .from('bank-logos')
    .upload(key, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })
  if (error) throw error
  const { data } = supabase.storage.from('bank-logos').getPublicUrl(key)
  return data.publicUrl
}
