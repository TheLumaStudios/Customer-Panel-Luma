import { useAuthStore } from '@/stores/authStore'

export function RoleGuard({ roles, children, fallback = null }) {
  const role = useAuthStore((s) => s.role)

  if (!roles || roles.length === 0) return children
  if (roles.includes(role)) return children
  return fallback
}

// Usage: <RoleGuard roles={['admin']}><AdminButton /></RoleGuard>
