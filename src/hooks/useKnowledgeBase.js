import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useKBCategories() {
  return useQuery({
    queryKey: ['kb-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data
    },
  })
}

export function useAllKBCategories() {
  return useQuery({
    queryKey: ['kb-categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_categories')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return data
    },
  })
}

export function useKBArticles(params = {}) {
  return useQuery({
    queryKey: ['kb-articles', params],
    queryFn: async () => {
      let query = supabase.from('kb_articles').select('*, category:kb_categories(name, slug)')
      if (params.category_id) query = query.eq('category_id', params.category_id)
      if (params.status) query = query.eq('status', params.status)
      if (params.search) query = query.ilike('title', `%${params.search}%`)
      query = query.order('created_at', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useKBArticle(slug) {
  return useQuery({
    queryKey: ['kb-article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_articles')
        .select('*, category:kb_categories(name, slug)')
        .eq('slug', slug)
        .single()
      if (error) throw error
      // Increment views
      await supabase
        .from('kb_articles')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', data.id)
      return data
    },
    enabled: !!slug,
  })
}

export function useCreateKBArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleData) => {
      const { data, error } = await supabase
        .from('kb_articles')
        .insert(articleData)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] })
    },
  })
}

export function useUpdateKBArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from('kb_articles')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] })
      queryClient.invalidateQueries({ queryKey: ['kb-article'] })
    },
  })
}

export function useDeleteKBArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('kb_articles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] })
    },
  })
}

export function useCreateKBCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryData) => {
      const { data, error } = await supabase
        .from('kb_categories')
        .insert(categoryData)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-categories'] })
      queryClient.invalidateQueries({ queryKey: ['kb-categories-all'] })
    },
  })
}

export function useUpdateKBCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from('kb_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-categories'] })
      queryClient.invalidateQueries({ queryKey: ['kb-categories-all'] })
    },
  })
}

export function useDeleteKBCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('kb_categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-categories'] })
      queryClient.invalidateQueries({ queryKey: ['kb-categories-all'] })
    },
  })
}
