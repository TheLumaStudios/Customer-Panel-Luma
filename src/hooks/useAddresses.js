import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as addressesApi from '@/lib/api/addresses'

/**
 * Get all addresses for current user or specific customer
 * @param {string} customer_id - Optional customer ID
 */
export function useAddresses(customer_id = null) {
  return useQuery({
    queryKey: ['addresses', customer_id],
    queryFn: () => addressesApi.getAddresses(customer_id),
  })
}

/**
 * Get single address by ID
 * @param {string} id - Address ID
 */
export function useAddress(id) {
  return useQuery({
    queryKey: ['address', id],
    queryFn: () => addressesApi.getAddress(id),
    enabled: !!id,
  })
}

/**
 * Create address mutation
 */
export function useCreateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addressesApi.createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })
}

/**
 * Update address mutation
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...addressData }) => addressesApi.updateAddress(id, addressData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      queryClient.invalidateQueries({ queryKey: ['address', data.id] })
    },
  })
}

/**
 * Delete address mutation
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addressesApi.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })
}

/**
 * Set default address mutation
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, type }) => addressesApi.setDefaultAddress(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })
}

/**
 * Get default address by type
 * @param {string} customer_id - Customer ID
 * @param {string} type - Address type
 */
export function useDefaultAddress(customer_id, type = 'billing') {
  return useQuery({
    queryKey: ['default-address', customer_id, type],
    queryFn: () => addressesApi.getDefaultAddress(customer_id, type),
    enabled: !!customer_id,
  })
}
