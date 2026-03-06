import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as serversApi from '@/lib/api/servers'

export function useServers() {
  return useQuery({
    queryKey: ['servers'],
    queryFn: serversApi.getServers,
  })
}

export function useServer(id) {
  return useQuery({
    queryKey: ['servers', id],
    queryFn: () => serversApi.getServer(id),
    enabled: !!id,
  })
}

export function useCreateServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: serversApi.createServer,
    onSuccess: () => {
      queryClient.invalidateQueries(['servers'])
    },
  })
}

export function useUpdateServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => serversApi.updateServer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['servers'])
      queryClient.invalidateQueries(['servers', variables.id])
    },
  })
}

export function useDeleteServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: serversApi.deleteServer,
    onSuccess: () => {
      queryClient.invalidateQueries(['servers'])
    },
  })
}

export function useTestServerConnection() {
  return useMutation({
    mutationFn: serversApi.testServerConnection,
  })
}

export function useSyncServerAccounts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (serverId) => {
      const { syncAccountsFromServer } = await import('@/lib/api/hosting')
      return syncAccountsFromServer(serverId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['servers'])
      queryClient.invalidateQueries(['hosting'])
      queryClient.invalidateQueries(['customers'])
    },
  })
}
