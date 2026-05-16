import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useResellerAccount } from '@/hooks/useResellerAccount'

export const ProtectedRoute = ({ children, requiredRole, skipResellerRedirect = false }) => {
  const { user, profile, loading } = useAuth()
  const { resellerAccount, loading: resellerLoading } = useResellerAccount()

  if (loading || (profile?.role === 'customer' && resellerLoading)) {
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

  // Bayi hesabı varsa ve normal müşteri paneline girmeye çalışıyorsa → reseller dashboard'a yönlendir
  if (!skipResellerRedirect && resellerAccount && requiredRole === 'customer') {
    return <Navigate to="/reseller/dashboard" replace />
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
