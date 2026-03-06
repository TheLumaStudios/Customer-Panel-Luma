import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import supabaseApi from '@/lib/axios'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('Auth loading timeout - forcing loading to false')
      setLoading(false)
    }, 5000) // 5 seconds max

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        clearTimeout(loadingTimeout)
        return
      }

      console.log('Session:', session ? 'exists' : 'null')
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user).finally(() => {
          clearTimeout(loadingTimeout)
        })
      } else {
        setLoading(false)
        clearTimeout(loadingTimeout)
      }
    }).catch((error) => {
      console.error('Unexpected session error:', error)
      setLoading(false)
      clearTimeout(loadingTimeout)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session ? 'has session' : 'no session')
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (user) => {
    try {
      const userId = user.id
      console.log('Fetching profile for user:', userId)
      console.log('User metadata:', user.user_metadata)

      // First, try to use user metadata if available (fastest)
      if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
        console.log('Using user metadata as profile:', user.user_metadata)
        const metadataProfile = {
          id: userId,
          email: user.email,
          full_name: user.user_metadata.full_name || '',
          role: user.user_metadata.role || 'customer',
          customer_id: user.user_metadata.customer_id,
          phone: user.user_metadata.phone || '',
          company_name: user.user_metadata.company_name || '',
        }
        setProfile(metadataProfile)
        setLoading(false)
        return
      }

      // If no metadata, try profiles table
      const response = await supabaseApi.get('/profiles', {
        params: {
          id: `eq.${userId}`,
          select: '*'
        }
      })

      console.log('Profile query result:', response.data)

      let data = response.data?.[0] || null

      if (data) {
        console.log('Profile found in table:', data)
        setProfile(data)
      } else {
        console.warn('No profile found for user:', userId)
        // Create minimal profile from user email
        setProfile({
          id: userId,
          email: user.email,
          role: 'customer',
          full_name: user.email.split('@')[0],
        })
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      // Minimal fallback
      setProfile({
        id: user.id,
        email: user.email,
        role: 'customer',
        full_name: user.email.split('@')[0],
      })
    } finally {
      setLoading(false)
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
      console.log('Supabase Auth failed, trying customer_auth...')

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
              console.log('Profile created for customer_auth user')
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
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
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
