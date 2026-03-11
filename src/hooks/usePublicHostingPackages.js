import { useQuery } from '@tanstack/react-query'
import { getHostingPackages } from '@/lib/api/hostingPackages'

export const usePublicHostingPackages = () => {
  return useQuery({
    queryKey: ['public-hosting-packages'],
    queryFn: async () => {
      const packages = await getHostingPackages()
      // Filter for active packages only
      return packages.filter(pkg => pkg.is_active)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
  })
}
