import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useProductPackages(productType) {
  return useQuery({
    queryKey: ['product-packages', productType],
    queryFn: async () => {
      let query = supabase.from('product_packages').select('*').order('sort_order')
      if (productType) query = query.eq('product_type', productType)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useActiveProductPackages(productType) {
  return useQuery({
    queryKey: ['product-packages', productType, 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_packages')
        .select('*')
        .eq('product_type', productType)
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data
    },
    enabled: !!productType,
  })
}

export function useCreateProductPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('product_packages')
        .insert(data)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-packages'] })
    },
  })
}

export function useUpdateProductPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from('product_packages')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-packages'] })
    },
  })
}

export function useDeleteProductPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('product_packages')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-packages'] })
    },
  })
}
