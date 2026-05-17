import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import supabaseApi from '@/lib/axios'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Guard stale state updates after unmount (React Strict Mode safe)
  const mountedRef = useRef(true)
  // Prevent concurrent fetchProfile calls
  const fetchingProfileRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    // Safety valve — fires only if onAuthStateChange never responds
    const loadingTimeout = setTimeout(() => {
      if (mountedRef.current) setLoading(false)
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          clearTimeout(loadingTimeout)
        }

        if (mountedRef.current) setUser(session?.user ?? null)

        if (session?.user) {
          // 1) Anında: user_metadata'dan profil set et → loading biter, sayfa açılır
          const meta = session.user.user_metadata || {}
          if (meta.role || meta.full_name) {
            if (mountedRef.current) {
              setProfile({
                id: session.user.id,
                email: session.user.email,
                role: meta.role || 'customer',
                full_name: meta.full_name || session.user.email?.split('@')[0] || '',
                phone: meta.phone || '',
                company_name: meta.company_name || '',
              })
              setLoading(false)
            }
          }
          // 2) Arka planda: DB'den gerçek profili çek ve güncelle
          fetchProfile(session.user)
        } else {
          if (mountedRef.current) {
            setProfile(null)
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mountedRef.current = false
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async (user) => {
    if (fetchingProfileRef.current) return
    fetchingProfileRef.current = true

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!mountedRef.current) return

      if (data) {
        setProfile(data)
      } else {
        const meta = user.user_metadata || {}
        setProfile({
          id: user.id,
          email: user.email,
          role: meta.role || 'customer',
          full_name: meta.full_name || user.email?.split('@')[0] || '',
          phone: meta.phone || '',
          company_name: meta.company_name || '',
        })
      }
    } catch {
      // metadata fallback zaten set edildi, sessizce geç
    } finally {
      fetchingProfileRef.current = false
      if (mountedRef.current) setLoading(false)
    }
  }

  const signUp = async (email, password, userData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create profile (RLS disabled so this should work)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              role: userData.role || 'customer',
              full_name: userData.full_name || '',
              phone: userData.phone || '',
              company_name: userData.company_name || '',
            },
          ])

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't throw - trigger might have created it
        }

        // Create customer if role is customer
        if ((userData.role || 'customer') === 'customer') {
          const { error: customerError } = await supabase
            .from('customers')
            .insert([
              {
                profile_id: authData.user.id,
                customer_code: 'CUST-' + String(Math.floor(Math.random() * 90000) + 10000),
                created_by: authData.user.id,
              },
            ])

          if (customerError) {
            console.error('Customer creation error:', customerError)
          }
        }
      }

      return { data: authData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      // First try Supabase Auth (for admin users)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error) {
        return { data, error: null }
      }

      // If Supabase Auth fails, try customer_auth table
      try {
        const { data: customerAuthData } = await supabaseApi.get('/customer_auth', {
          params: {
            select: '*,customer:customers(*)',
            email: `eq.${email}`,
            password: `eq.${password}`,
            limit: 1
          }
        })

        if (customerAuthData && customerAuthData.length > 0) {
          const customerAuth = customerAuthData[0]

          // Create Supabase Auth user for this customer
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                full_name: customerAuth.customer?.full_name,
                role: 'customer',
                customer_id: customerAuth.customer_id
              }
            }
          })

          if (signUpError) {
            console.error('Auto signup error:', signUpError)
            // If signup fails (user exists), try signin again
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })

            if (retryError) {
              throw new Error('Giriş yapılamadı. Lütfen tekrar deneyin.')
            }

            return { data: retryData, error: null }
          }

          // Create profile for newly created user
          if (signUpData.user) {
            try {
              await supabase.from('profiles').insert([
                {
                  id: signUpData.user.id,
                  email: email,
                  role: 'customer',
                  full_name: customerAuth.customer?.full_name || '',
                  phone: customerAuth.customer?.phone || '',
                  company_name: customerAuth.customer?.company_name || '',
                },
              ])
            } catch (profileError) {
              console.error('Profile creation error:', profileError)
              // Don't throw - metadata fallback will work
            }
          }

          // Sign in with newly created account
          const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (newSignInError) {
            throw newSignInError
          }

          return { data: newSignInData, error: null }
        }
      } catch (customerAuthError) {
        console.error('customer_auth lookup error:', customerAuthError)
      }

      // Both methods failed
      throw error
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    // State'i hemen temizle
    setUser(null)
    setProfile(null)
    // 'local' scope: sadece localStorage/cookie temizler, network çağrısı yok → anında
    // Böylece sayfa yenilenince Supabase boş session görür, panel'e yönlendirmez
    await supabase.auth.signOut({ scope: 'local' })
    // Server token'ı arka planda invalidate et (opsiyonel, güvenlik için)
    supabase.auth.signOut({ scope: 'global' }).catch(() => {})
    return { error: null }
  }

  const refetch = async () => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refetch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
