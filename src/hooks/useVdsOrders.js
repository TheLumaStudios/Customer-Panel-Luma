import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as vdsOrdersApi from '@/lib/api/vdsOrders'

export function useVdsOrders(status) {
  return useQuery({
    queryKey: ['vds-orders', status],
    queryFn: () => vdsOrdersApi.getVdsOrders(status),
  })
}

export function useVdsOrder(id) {
  return useQuery({
    queryKey: ['vds-orders', id],
    queryFn: () => vdsOrdersApi.getVdsOrder(id),
    enabled: !!id,
  })
}

export function useUpdateVdsOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => vdsOrdersApi.updateVdsOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vds-orders'] })
      queryClient.invalidateQueries({ queryKey: ['vds'] })
    },
  })
}
