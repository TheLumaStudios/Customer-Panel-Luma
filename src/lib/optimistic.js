import { toast } from 'sonner'

/**
 * Wrapper for optimistic mutations with TanStack Query
 * Usage with useMutation:
 *
 * const mutation = useMutation({
 *   mutationFn: api.updateHosting,
 *   ...optimisticUpdate(queryClient, {
 *     queryKey: ['hosting'],
 *     updateFn: (old, variables) => old.map(h => h.id === variables.id ? { ...h, ...variables.data } : h),
 *     successMessage: 'Hosting güncellendi',
 *     errorMessage: 'Güncelleme başarısız',
 *   }),
 * })
 */
export function optimisticUpdate(queryClient, {
  queryKey,
  updateFn,
  successMessage,
  errorMessage,
}) {
  return {
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey)

      // Optimistically update
      if (updateFn && previousData) {
        queryClient.setQueryData(queryKey, (old) => updateFn(old, variables))
      }

      return { previousData }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.error(errorMessage || 'İşlem başarısız', {
        description: err.message,
      })
    },
    onSuccess: () => {
      if (successMessage) {
        toast.success(successMessage)
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey })
    },
  }
}
