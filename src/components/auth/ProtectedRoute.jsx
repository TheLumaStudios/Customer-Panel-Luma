import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth()

  // Debug logging
  console.log('ProtectedRoute:', { user: !!user, profile, loading, requiredRole })

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
    console.log('No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // If user exists but no profile, still allow access (RLS disabled scenario)
  if (!profile) {
    console.warn('User exists but no profile found - RLS might be blocking or profile not created')
    // Don't block, just log warning
  }

  if (requiredRole && profile?.role && profile.role !== requiredRole) {
    console.log('Wrong role, redirecting:', profile.role, 'required:', requiredRole)
    const redirectPath = profile.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    return <Navigate to={redirectPath} replace />
  }

  console.log('Access granted, rendering children')
  return children
}
