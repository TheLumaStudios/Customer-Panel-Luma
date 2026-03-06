import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as customersApi from '@/lib/api/customers'

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers,
  })
}

export function useCustomer(id) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.getCustomer(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: customersApi.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => customersApi.updateCustomer(id, data),
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific customer
      queryClient.invalidateQueries(['customers'])
      queryClient.invalidateQueries(['customers', variables.id])
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: customersApi.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
    },
  })
}
