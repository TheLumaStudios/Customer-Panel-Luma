import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'

export const PublicRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, redirect to dashboard based on role
  if (user && profile) {
    const redirectPath = profile.role === 'admin'
      ? '/admin/dashboard'
      : '/dashboard'
    return <Navigate to={redirectPath} replace />
  }

  // If not authenticated, render the public page
  return children
}
