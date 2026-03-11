import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as approvalsApi from '@/lib/api/approvals'

/**
 * Get all approvals
 */
export function useApprovals(options = {}) {
  return useQuery({
    queryKey: ['approvals', options],
    queryFn: () => approvalsApi.getApprovals(options),
  })
}

/**
 * Get single approval
 */
export function useApproval(id) {
  return useQuery({
    queryKey: ['approvals', id],
    queryFn: () => approvalsApi.getApproval(id),
    enabled: !!id,
  })
}

/**
 * Create approval request
 */
export function useCreateApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approvalsApi.createApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}

/**
 * Review (approve/reject) approval
 */
export function useReviewApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, action, notes }) => approvalsApi.reviewApproval(id, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}

/**
 * Execute approved operation
 */
export function useExecuteApprovedOperation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approvalsApi.executeApprovedOperation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}
