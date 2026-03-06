import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as invoicesApi from '@/lib/api/invoices'

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: invoicesApi.getInvoices,
  })
}

export function useInvoice(id) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.getInvoice(id),
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: invoicesApi.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices'])
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => invoicesApi.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices'])
    },
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: invoicesApi.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices'])
    },
  })
}
