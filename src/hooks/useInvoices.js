import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as invoicesApi from '@/lib/api/invoices'

/**
 * Get invoices list
 * @param {Object} params - Query parameters
 */
export function useInvoices(params = {}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesApi.getInvoices(params),
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

/**
 * Pay invoice mutation
 */
export function usePayInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: invoicesApi.payInvoice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', data.invoice.id] })
      queryClient.invalidateQueries({ queryKey: ['customer-credit'] })
    },
  })
}

/**
 * Get customer credit balance
 * @param {string} customer_id - Customer ID
 */
export function useCustomerCredit(customer_id) {
  return useQuery({
    queryKey: ['customer-credit', customer_id],
    queryFn: () => invoicesApi.getCustomerCredit(customer_id),
    enabled: !!customer_id,
  })
}

/**
 * Add customer credit mutation
 */
export function useAddCustomerCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ customer_id, amount, currency, description }) =>
      invoicesApi.addCustomerCredit(customer_id, amount, currency, description),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-credit', variables.customer_id] })
    },
  })
}

/**
 * Initialize iyzico payment mutation
 */
export function useInitializeIyzicoPayment() {
  return useMutation({
    mutationFn: ({ invoice_id, return_url }) =>
      invoicesApi.initializeIyzicoPayment(invoice_id, return_url),
  })
}
