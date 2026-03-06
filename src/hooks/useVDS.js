import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as vdsApi from '@/lib/api/vds'

export function useVDS() {
  return useQuery({
    queryKey: ['vds'],
    queryFn: vdsApi.getVDS,
  })
}

export function useVDSRecord(id) {
  return useQuery({
    queryKey: ['vds', id],
    queryFn: () => vdsApi.getVDSRecord(id),
    enabled: !!id,
  })
}

export function useCreateVDS() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: vdsApi.createVDS,
    onSuccess: () => {
      queryClient.invalidateQueries(['vds'])
    },
  })
}

export function useUpdateVDS() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => vdsApi.updateVDS(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vds'])
    },
  })
}

export function useDeleteVDS() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: vdsApi.deleteVDS,
    onSuccess: () => {
      queryClient.invalidateQueries(['vds'])
    },
  })
}
