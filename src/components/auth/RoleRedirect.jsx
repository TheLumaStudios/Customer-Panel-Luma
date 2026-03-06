import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'

export default function RoleRedirect() {
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

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Admin ise admin dashboard'a yönlendir
  if (profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  // Customer ise customer dashboard'a yönlendir
  return <Navigate to="/dashboard" replace />
}
