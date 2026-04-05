import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

async function callAI(action, params) {
  const { data: { session } } = await supabase.auth.getSession()
  const baseUrl = import.meta.env.VITE_SUPABASE_URL
  const url = baseUrl.includes('/rest/v1') ? baseUrl.replace('/rest/v1', '/functions/v1') : `${baseUrl}/functions/v1`
  const res = await fetch(`${url}/ai-assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
    body: JSON.stringify({ action, ...params }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error)
  return data
}

export function useSearchArticles() {
  return useMutation({ mutationFn: ({ query }) => callAI('search_articles', { query }) })
}

export function useSummarizeTicket() {
  return useMutation({ mutationFn: ({ ticket_id }) => callAI('summarize_ticket', { ticket_id }) })
}

export function useDraftReply() {
  return useMutation({ mutationFn: ({ ticket_id }) => callAI('draft_reply', { ticket_id }) })
}

export function useAnalyzeSentiment() {
  return useMutation({ mutationFn: ({ ticket_id }) => callAI('analyze_sentiment', { ticket_id }) })
}

export function useEmbedArticle() {
  return useMutation({ mutationFn: ({ article_id }) => callAI('embed_article', { article_id }) })
}
