import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSavedViews(entityType) {
  return useQuery({
    queryKey: ['saved-views', entityType],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('saved_views')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .order('created_at')
      if (error) throw error
      return data || []
    },
    enabled: !!entityType,
  })
}

export function useSaveView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, entityType, filters, sorting, columns }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('saved_views').insert({
        user_id: user.id,
        name,
        entity_type: entityType,
        filters,
        sorting,
        columns,
      }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['saved-views', vars.entityType] })
    },
  })
}

export function useDeleteSavedView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('saved_views').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views'] })
    },
  })
}
