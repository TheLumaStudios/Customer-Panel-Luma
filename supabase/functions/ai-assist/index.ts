import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function callOpenAI(messages: any[], model = 'gpt-4o-mini') {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('OPENAI_API_KEY yapılandırılmamış')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 1000 }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content
}

async function getEmbedding(text: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('OPENAI_API_KEY yapılandırılmamış')

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })
  const data = await res.json()
  return data.data[0].embedding
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { action, ...params } = await req.json()

    // ─── Semantic Article Search ───
    if (action === 'search_articles') {
      const { query } = params
      const embedding = await getEmbedding(query)
      const { data: articles } = await supabaseAdmin.rpc('search_kb_articles', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5,
      })
      return new Response(JSON.stringify({ success: true, articles: articles || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── Ticket Summarization ───
    if (action === 'summarize_ticket') {
      const { ticket_id } = params
      const { data: ticket } = await supabaseAdmin.from('support_tickets').select('*').eq('id', ticket_id).single()
      if (!ticket) throw new Error('Ticket bulunamadı')

      const summary = await callOpenAI([
        { role: 'system', content: 'Sen bir destek talebi özetleyicisisin. Türkçe olarak, 2-3 cümleyle özet yaz.' },
        { role: 'user', content: `Konu: ${ticket.subject}\nAçıklama: ${ticket.description}\nDurum: ${ticket.status}\nÖncelik: ${ticket.priority}` },
      ])

      await supabaseAdmin.from('support_tickets').update({ ai_summary: summary }).eq('id', ticket_id)

      return new Response(JSON.stringify({ success: true, summary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── Draft Reply ───
    if (action === 'draft_reply') {
      const { ticket_id } = params
      const { data: ticket } = await supabaseAdmin.from('support_tickets').select('*').eq('id', ticket_id).single()
      if (!ticket) throw new Error('Ticket bulunamadı')

      const draft = await callOpenAI([
        { role: 'system', content: 'Sen Luma Yazılım destek ekibinin yardımcı AI\'ısın. Müşteriye profesyonel ve samimi bir Türkçe yanıt taslağı oluştur. Kısa ve çözüm odaklı yaz.' },
        { role: 'user', content: `Müşteri talebi:\nKonu: ${ticket.subject}\nAçıklama: ${ticket.description}\nKategori: ${ticket.category || 'Genel'}\nÖncelik: ${ticket.priority}` },
      ])

      await supabaseAdmin.from('support_tickets').update({ ai_draft_reply: draft }).eq('id', ticket_id)

      return new Response(JSON.stringify({ success: true, draft }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── Sentiment Analysis ───
    if (action === 'analyze_sentiment') {
      const { ticket_id } = params
      const { data: ticket } = await supabaseAdmin.from('support_tickets').select('*').eq('id', ticket_id).single()
      if (!ticket) throw new Error('Ticket bulunamadı')

      const analysis = await callOpenAI([
        { role: 'system', content: 'Destek talebinin duygu analizini yap. JSON olarak yanıt ver: {"sentiment": "positive|neutral|negative|angry", "score": -1.0 ile 1.0 arası}' },
        { role: 'user', content: `${ticket.subject}\n${ticket.description}` },
      ])

      let parsed
      try { parsed = JSON.parse(analysis) } catch { parsed = { sentiment: 'neutral', score: 0 } }

      await supabaseAdmin.from('support_tickets').update({
        sentiment: parsed.sentiment,
        sentiment_score: parsed.score,
      }).eq('id', ticket_id)

      return new Response(JSON.stringify({ success: true, ...parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── Embed Article ───
    if (action === 'embed_article') {
      const { article_id } = params
      const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') throw new Error('Admin only')

      const { data: article } = await supabaseAdmin.from('kb_articles').select('title, content, excerpt').eq('id', article_id).single()
      if (!article) throw new Error('Makale bulunamadı')

      const text = `${article.title}\n${article.excerpt || ''}\n${article.content?.replace(/<[^>]*>/g, ' ') || ''}`
      const embedding = await getEmbedding(text.substring(0, 8000))

      await supabaseAdmin.from('kb_articles').update({ embedding }).eq('id', article_id)

      return new Response(JSON.stringify({ success: true, message: 'Embedding oluşturuldu' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Geçersiz action')
  } catch (error) {
    console.error('AI assist error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
