import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api/bankAccounts'

export function useBankAccounts({ onlyActive = false } = {}) {
  return useQuery({
    queryKey: ['bank_accounts', { onlyActive }],
    queryFn: () => api.getBankAccounts({ onlyActive }),
  })
}

export function useCreateBankAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createBankAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_accounts'] }),
  })
}

export function useUpdateBankAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateBankAccount(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_accounts'] }),
  })
}

export function useDeleteBankAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteBankAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_accounts'] }),
  })
}
