import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as settingsApi from '@/lib/api/settings'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getSettings,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['settings'])
    },
  })
}
