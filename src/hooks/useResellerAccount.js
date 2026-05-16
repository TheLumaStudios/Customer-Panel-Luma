/**
 * Giriş yapan kullanıcının bayi hesabı olup olmadığını kontrol eder.
 * resellers tablosunda profile_id eşleşiyorsa bayi verisini döner.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth.jsx'

export function useResellerAccount() {
  const { profile, loading: authLoading } = useAuth()
  const [resellerAccount, setResellerAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!profile?.id) { setLoading(false); return }

    supabase
      .from('resellers')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        setResellerAccount(data || null)
        setLoading(false)
      })
  }, [profile?.id, authLoading])

  return { resellerAccount, loading }
}
