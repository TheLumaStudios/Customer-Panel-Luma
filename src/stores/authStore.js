import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  role: null,
  loading: true,

  setSession: (session) => {
    set({ session, user: session?.user || null })
  },

  setProfile: (profile) => {
    set({ profile, role: profile?.role || 'customer' })
  },

  hasRole: (role) => {
    const current = get().role
    if (role === 'admin') return current === 'admin'
    if (role === 'employee') return current === 'admin' || current === 'employee'
    return true
  },

  isAdmin: () => get().role === 'admin',
  isEmployee: () => get().role === 'employee' || get().role === 'admin',

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ session, user: session.user })
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (profile) set({ profile, role: profile.role, loading: false })
      else set({ loading: false })
    } else {
      set({ loading: false })
    }

    // Auth state listener
    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user || null })
      if (!session) set({ profile: null, role: null })
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null, role: null })
  },
}))
