import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

/**
 * Generate breadcrumbs automatically from current route
 */
export function useBreadcrumbs() {
  const location = useLocation()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const crumbs = []

    // Route labels mapping
    const routeLabels = {
      // Admin routes
      admin: 'Admin',
      dashboard: 'Dashboard',
      customers: 'Müşteriler',
      invoices: 'Faturalar',
      'domain-search': 'Domain Ara',
      domains: 'Domainler',
      hosting: 'Hosting',
      vds: 'VDS / VPS',
      tickets: 'Destek',
      settings: 'Ayarlar',
      servers: 'Sunucular',
      'hosting-packages': 'Hosting Paketleri',

      // Customer routes
      profile: 'Profil',
    }

    // Build breadcrumb path
    let currentPath = ''

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Skip 'admin' prefix from breadcrumb display (but keep in path)
      if (segment === 'admin' && isAdmin) {
        return
      }

      // Check if this segment is a UUID (detail page)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

      if (isUuid) {
        // For detail pages, use "Detaylar" or fetch from context if available
        crumbs.push({
          label: 'Detaylar',
          path: currentPath,
          isLast: index === pathSegments.length - 1
        })
      } else {
        // Use mapped label or capitalize segment
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

        crumbs.push({
          label,
          path: currentPath,
          isLast: index === pathSegments.length - 1
        })
      }
    })

    // If we're at root or admin root, show Dashboard
    if (crumbs.length === 0) {
      crumbs.push({
        label: 'Dashboard',
        path: isAdmin ? '/admin/dashboard' : '/dashboard',
        isLast: true
      })
    }

    return crumbs
  }, [location.pathname, isAdmin])

  return breadcrumbs
}
