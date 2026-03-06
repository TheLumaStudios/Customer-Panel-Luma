import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as hostingPackagesApi from '@/lib/api/hostingPackages'

export function useHostingPackages() {
  return useQuery({
    queryKey: ['hostingPackages'],
    queryFn: hostingPackagesApi.getHostingPackages,
  })
}

export function useHostingPackage(id) {
  return useQuery({
    queryKey: ['hostingPackages', id],
    queryFn: () => hostingPackagesApi.getHostingPackage(id),
    enabled: !!id,
  })
}

export function useCreateHostingPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: hostingPackagesApi.createHostingPackage,
    onSuccess: () => {
      queryClient.invalidateQueries(['hostingPackages'])
    },
  })
}

export function useUpdateHostingPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => hostingPackagesApi.updateHostingPackage(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['hostingPackages'])
      queryClient.invalidateQueries(['hostingPackages', variables.id])
    },
  })
}

export function useDeleteHostingPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: hostingPackagesApi.deleteHostingPackage,
    onSuccess: () => {
      queryClient.invalidateQueries(['hostingPackages'])
    },
  })
}

export function useSyncPackagesFromServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: hostingPackagesApi.syncPackagesFromServer,
    onSuccess: () => {
      queryClient.invalidateQueries(['hostingPackages'])
    },
  })
}
