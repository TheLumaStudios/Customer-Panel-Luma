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

/**
 * Upload invoice file mutation
 */
export function useUploadInvoiceFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoice_id, file }) =>
      invoicesApi.uploadInvoiceFile(invoice_id, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.invoice_id] })
    },
  })
}

/**
 * Delete invoice file mutation
 */
export function useDeleteInvoiceFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoice_id, filePath }) =>
      invoicesApi.deleteInvoiceFile(invoice_id, filePath),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.invoice_id] })
    },
  })
}

/**
 * Update invoice mutation
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => invoicesApi.updateInvoice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.id] })
    },
  })
}

/**
 * Delete invoice mutation
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: invoicesApi.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

/**
 * Upload tax receipt mutation
 */
export function useUploadTaxReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoice_id, file }) =>
      invoicesApi.uploadTaxReceipt(invoice_id, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.invoice_id] })
    },
  })
}

/**
 * Delete tax receipt mutation
 */
export function useDeleteTaxReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoice_id, filePath }) =>
      invoicesApi.deleteTaxReceipt(invoice_id, filePath),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.invoice_id] })
    },
  })
}
