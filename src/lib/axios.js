import axios from 'axios'
import { supabase } from './supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables')
}

// Create axios instance for Supabase REST API
export const supabaseApi = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseAnonKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  },
  timeout: 10000, // 10 second timeout
})

// Cache session to avoid multiple auth checks
let cachedSession = null
let sessionCacheTime = 0
const SESSION_CACHE_DURATION = 5000 // 5 seconds cache

// Add request interceptor to include user's access token
supabaseApi.interceptors.request.use(
  async (config) => {
    try {
      const now = Date.now()

      // Use cached session if available and fresh
      if (cachedSession && (now - sessionCacheTime) < SESSION_CACHE_DURATION) {
        const token = cachedSession.access_token || supabaseAnonKey
        config.headers.Authorization = `Bearer ${token}`
        return config
      }

      // Fetch session with longer timeout
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session fetch timeout')), 8000) // Increased to 8 seconds
      )

      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])

      // Cache the session
      cachedSession = session
      sessionCacheTime = now

      // Use user's access token if available, otherwise use anon key
      const token = session?.access_token || supabaseAnonKey
      config.headers.Authorization = `Bearer ${token}`

      return config
    } catch (error) {
      // Fallback to anon key (silent fallback, no console.error)
      config.headers.Authorization = `Bearer ${supabaseAnonKey}`
      return config
    }
  },
  (error) => {
    console.error('Axios request error:', error)
    return Promise.reject(error)
  }
)

// Listen to auth state changes to invalidate cache
supabase.auth.onAuthStateChange(() => {
  cachedSession = null
  sessionCacheTime = 0
})

// Add response interceptor for error handling
supabaseApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log actual errors, not successful requests
    if (error.response?.status >= 400) {
      console.error('API Error:', error.response?.status, error.config?.url)
      console.error('Error Response:', JSON.stringify(error.response?.data, null, 2))
      console.error('Request Data:', error.config?.data)
    }
    return Promise.reject(error)
  }
)

export default supabaseApi
