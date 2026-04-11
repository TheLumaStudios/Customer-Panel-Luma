import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as domainsApi from '@/lib/api/domains'

export function useDomains() {
const result = useQuery({
    queryKey: ['domains'],
    queryFn: domainsApi.getDomains,
  })
  return result
}

export function useDomain(id) {
  return useQuery({
    queryKey: ['domains', id],
    queryFn: () => domainsApi.getDomain(id),
    enabled: !!id,
  })
}

export function useCreateDomain() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: domainsApi.createDomain,
    onSuccess: () => {
      queryClient.invalidateQueries(['domains'])
    },
  })
}

export function useUpdateDomain() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => domainsApi.updateDomain(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['domains'])
    },
  })
}

export function useDeleteDomain() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: domainsApi.deleteDomain,
    onSuccess: () => {
      queryClient.invalidateQueries(['domains'])
    },
  })
}
