import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth()

  // Debug logging
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
          <p className="mt-2 text-xs text-muted-foreground">
            5 saniyeden fazla bekliyorsanız, sayfayı yenileyin
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If user exists but no profile, still allow access (RLS disabled scenario)
  if (!profile) {
    console.warn('User exists but no profile found - RLS might be blocking or profile not created')
    // Don't block, just log warning
  }

  if (requiredRole && profile?.role && profile.role !== requiredRole) {
    let redirectPath = '/dashboard'
    if (profile.role === 'admin') {
      redirectPath = '/admin/dashboard'
    } else if (profile.role === 'employee') {
      redirectPath = '/employee/dashboard'
    }
    return <Navigate to={redirectPath} replace />
  }

  return children
}
