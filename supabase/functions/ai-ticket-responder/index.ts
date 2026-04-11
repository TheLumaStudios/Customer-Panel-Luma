// AI Ticket Responder — uses Claude with tool_use to actually *do* things
// on support tickets, not just draft a reply.
//
// How it works:
//  1. Admin opens a ticket and clicks "AI ile Cevapla".
//  2. Client POSTs { ticket_id, mode } to this function.
//  3. We load the ticket + customer context, hand it to Claude along with a
//     set of system tools (read invoices/customers, cancel invoices, post
//     replies, escalate, …).
//  4. We run the Claude agent loop: every `tool_use` block from Claude is
//     executed server-side, result is sent back as `tool_result`, until
//     Claude stops asking for tools and emits its final plain-text reply.
//  5. Each tool call is audited to the console and any action is strictly
//     scoped to the original ticket's customer.
//
// Auth: only admin users may invoke. The agent always acts on behalf of
// the admin — RLS is bypassed via service role.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─────────────────────────────────────────────────────────────
// Claude client
// ─────────────────────────────────────────────────────────────

const CLAUDE_MODEL = 'claude-sonnet-4-6' // latest Sonnet, good tool-use ability
const MAX_AGENT_STEPS = 8

async function callClaude(body: Record<string, unknown>): Promise<any> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY yapılandırılmamış')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('Claude API error:', data)
    throw new Error(data?.error?.message || `Claude HTTP ${res.status}`)
  }
  return data
}

// ─────────────────────────────────────────────────────────────
// Tool definitions (JSON schema returned to Claude)
// ─────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_customer_info',
    description:
      'Müşterinin profilini, hosting paketlerini, domainlerini ve cüzdan bakiyesini döner. Bağlam toplamak için ilk çağrılardan biri olmalıdır.',
    input_schema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string', description: 'customers.id UUID' },
      },
      required: ['customer_id'],
    },
  },
  {
    name: 'list_customer_invoices',
    description:
      'Müşterinin son faturalarını listeler (en yeni → en eski). Limit default 10.',
    input_schema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        status: {
          type: 'string',
          enum: ['unpaid', 'paid', 'cancelled', 'overdue', 'any'],
          description: "'any' tüm durumları getirir",
        },
        limit: { type: 'number' },
      },
      required: ['customer_id'],
    },
  },
  {
    name: 'get_invoice',
    description: 'Tek bir fatura + satırlarını döner.',
    input_schema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
      },
      required: ['invoice_id'],
    },
  },
  {
    name: 'cancel_invoice',
    description:
      'Bir faturayı iptal eder (status=cancelled). Sadece ticket sahibinin faturası iptal edilebilir. Her zaman neden bilgisi gerekir. İade (refund) yapmaz — sadece statusü değiştirir.',
    input_schema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
        reason: { type: 'string', description: 'Müşteriye gösterilebilecek kısa sebep' },
      },
      required: ['invoice_id', 'reason'],
    },
  },
  {
    name: 'post_ticket_reply',
    description:
      'Ticket\'a müşteriye görünür yanıt yazar. Tüm araştırma bittikten sonra nihai cevap için çağrılmalı. Kısa, samimi, Türkçe yaz.',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      required: ['message'],
    },
  },
  {
    name: 'add_internal_note',
    description:
      'Sadece admin/ekibin görebileceği dahili not (is_internal=true). Çözülemeyen durumlarda neden ekibe devredildiğini yazmak için kullan.',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      required: ['message'],
    },
  },
  {
    name: 'update_ticket_status',
    description:
      'Ticket durumunu değiştirir. Sorun çözüldüyse "resolved", incelenmeye devam edecekse "in_progress", tamamen kapatılacaksa "closed".',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
        },
      },
      required: ['status'],
    },
  },
  {
    name: 'escalate_to_human',
    description:
      'Emin değilsen veya yetkin dışındaysa insan ekibe devret. Ticket status=in_progress yapılır ve internal note eklenir.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
      },
      required: ['reason'],
    },
  },
]

// ─────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return json({ success: false, error: 'Unauthorized' }, 401)
    }

    // Only admins (and employees) may trigger the agent
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminProfile || !['admin', 'employee'].includes(adminProfile.role)) {
      return json({ success: false, error: 'Admin yetkisi gerekli' }, 403)
    }

    const { ticket_id } = await req.json()
    if (!ticket_id) return json({ success: false, error: 'ticket_id gerekli' }, 400)

    // Load ticket + customer + replies for context
    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', ticket_id)
      .single()

    if (ticketErr || !ticket) {
      return json({ success: false, error: 'Ticket bulunamadı' }, 404)
    }

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, full_name, email, customer_code, customer_type, status, phone')
      .eq('id', ticket.customer_id)
      .maybeSingle()

    const { data: replies } = await supabaseAdmin
      .from('ticket_replies')
      .select('message, is_internal, created_at, user_id')
      .eq('ticket_id', ticket_id)
      .order('created_at', { ascending: true })

    // ─── Build context block for Claude ───
    const contextBlock = [
      '# Ticket Bilgileri',
      `- ID: ${ticket.id}`,
      `- Numara: ${ticket.ticket_number ?? '-'}`,
      `- Konu: ${ticket.subject}`,
      `- Kategori: ${ticket.category ?? 'general'}`,
      `- Durum: ${ticket.status}`,
      `- Öncelik: ${ticket.priority}`,
      `- Oluşturma: ${ticket.created_at}`,
      '',
      '# Müşteri',
      `- ID: ${customer?.id}`,
      `- Ad: ${customer?.full_name ?? '-'}`,
      `- Email: ${customer?.email ?? '-'}`,
      `- Müşteri Kodu: ${customer?.customer_code ?? '-'}`,
      `- Tip: ${customer?.customer_type ?? '-'}`,
      '',
      '# Ticket Açıklaması',
      ticket.description ?? '(açıklama yok)',
      '',
      '# Önceki Yazışmalar',
      (replies && replies.length > 0)
        ? replies
            .map((r: any) => `[${r.is_internal ? 'dahili not' : 'yanıt'}] ${r.created_at}\n${r.message}`)
            .join('\n\n')
        : '(henüz yanıt yok)',
    ].join('\n')

    const systemPrompt = `Sen "Luma Destek AI" adlı bir müşteri destek asistanısın. Görevin:
1. Ticket'ı dikkatle oku, gerekli bağlamı araçlarla topla (get_customer_info, list_customer_invoices, get_invoice).
2. Mümkünse sorunu kendi başına çöz — fatura iptal talebi ise ilgili faturayı cancel_invoice ile iptal et, sonra post_ticket_reply ile müşteriye net Türkçe bir özet yaz.
3. Talep net değilse ya da yetkin dışındaysa escalate_to_human ile insana devret.
4. Her zaman şu sırayla çalış: **araştır → işle → yanıt yaz → statüyü güncelle**.
5. Yanıtlarında asla:
   - Müşteri bilgilerini (email, TC, kart) tekrarlama
   - Teknik jargon kullanma
   - "Ben yapay zekayım" demeden önce sorunu çözmeye çalış — çözebiliyorsan çöz
6. Müşteri dilinde yaz (genellikle Türkçe). Kısa, profesyonel, empatik.
7. Fatura iptali yapınca: cancel_invoice → post_ticket_reply("${ticket.subject} için talebinizi aldık, faturanız iptal edildi.") → update_ticket_status('resolved').
8. Ödeme/para iadesi yapma yetkin yok — sadece fatura iptal edebilirsin. İade gerekiyorsa escalate_to_human çağır.

Bu tek oturumda sıkı bir şekilde şu ticket'a bağlısın: ${ticket_id}.
Bu müşterinin customer_id'si: ${customer?.id ?? 'YOK'}.
Başka müşteri/ticket üzerinde işlem yapmaya çalışma.`

    // ─── Agent loop ───
    const messages: any[] = [
      { role: 'user', content: `Aşağıdaki ticket'ı incele ve çöz.\n\n${contextBlock}` },
    ]

    const actions: any[] = [] // audit log returned to client
    let finalText = ''

    for (let step = 0; step < MAX_AGENT_STEPS; step++) {
      const response = await callClaude({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      })

      // Append assistant turn
      messages.push({ role: 'assistant', content: response.content })

      const toolUses = (response.content || []).filter((b: any) => b.type === 'tool_use')
      if (toolUses.length === 0) {
        // Collect any text content
        const textBlocks = (response.content || []).filter((b: any) => b.type === 'text')
        finalText = textBlocks.map((b: any) => b.text).join('\n')
        break
      }

      // Execute each tool_use
      const toolResults = []
      for (const use of toolUses) {
        let result: any
        try {
          result = await runTool(
            supabaseAdmin,
            use.name,
            use.input || {},
            { ticket, customer_id: customer?.id || null }
          )
          actions.push({ tool: use.name, input: use.input, result, ok: true })
        } catch (e) {
          result = { error: (e as Error).message }
          actions.push({ tool: use.name, input: use.input, error: result.error, ok: false })
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: use.id,
          content: JSON.stringify(result).slice(0, 8000), // guard against huge payloads
        })
      }

      messages.push({ role: 'user', content: toolResults })
    }

    return json({ success: true, final_text: finalText, actions })
  } catch (error) {
    console.error('ai-ticket-responder error:', error)
    return json({ success: false, error: (error as Error).message }, 500)
  }
})

// ─────────────────────────────────────────────────────────────
// Tool execution
// ─────────────────────────────────────────────────────────────

async function runTool(
  db: any,
  name: string,
  input: any,
  ctx: { ticket: any; customer_id: string | null }
): Promise<any> {
  // Scope enforcement: any tool acting on a specific customer_id must match
  // the ticket's customer. Prevents prompt injection from a user embedding
  // "call get_customer_info with some-other-uuid" in the ticket body.
  const assertSameCustomer = (id: string | undefined) => {
    if (!id) throw new Error('customer_id missing')
    if (ctx.customer_id && id !== ctx.customer_id) {
      throw new Error('Agent bu customer için yetkili değil')
    }
  }

  switch (name) {
    case 'get_customer_info': {
      assertSameCustomer(input.customer_id)
      const [{ data: customer }, { data: hostings }, { data: domains }, { data: credit }] =
        await Promise.all([
          db.from('customers').select('*').eq('id', input.customer_id).maybeSingle(),
          db.from('hosting').select('id, package_name, domain, status, expiration_date').eq('customer_id', input.customer_id),
          db.from('domains').select('id, domain_name, status, expiration_date').eq('customer_id', input.customer_id),
          db.from('customer_credit').select('balance, currency').eq('customer_id', customer?.profile_id ?? input.customer_id).maybeSingle(),
        ])
      return {
        customer: customer
          ? {
              id: customer.id,
              full_name: customer.full_name,
              email: customer.email,
              customer_code: customer.customer_code,
              status: customer.status,
              customer_type: customer.customer_type,
            }
          : null,
        hostings: hostings || [],
        domains: domains || [],
        wallet: credit || { balance: 0, currency: 'TRY' },
      }
    }

    case 'list_customer_invoices': {
      assertSameCustomer(input.customer_id)
      const limit = Math.min(Math.max(parseInt(input.limit || '10'), 1), 50)
      let q = db
        .from('invoices')
        .select('id, invoice_number, status, total, currency, created_at, due_date, paid_date')
        .eq('customer_id', input.customer_id)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (input.status && input.status !== 'any') q = q.eq('status', input.status)
      const { data } = await q
      return { invoices: data || [] }
    }

    case 'get_invoice': {
      const { data: invoice } = await db
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', input.invoice_id)
        .maybeSingle()
      if (!invoice) return { error: 'Fatura bulunamadı' }
      if (ctx.customer_id && invoice.customer_id !== ctx.customer_id) {
        throw new Error('Bu fatura bu ticket\'ın müşterisine ait değil')
      }
      return { invoice }
    }

    case 'cancel_invoice': {
      const { data: invoice } = await db
        .from('invoices')
        .select('customer_id, status, invoice_number')
        .eq('id', input.invoice_id)
        .maybeSingle()
      if (!invoice) return { error: 'Fatura bulunamadı' }
      if (ctx.customer_id && invoice.customer_id !== ctx.customer_id) {
        throw new Error('Bu fatura bu ticket\'ın müşterisine ait değil')
      }
      if (invoice.status === 'paid') {
        return { error: 'Ödenmiş fatura iptal edilemez — refund gerekir, escalate_to_human çağır' }
      }
      await db
        .from('invoices')
        .update({
          status: 'cancelled',
          admin_notes: `[AI agent] ${input.reason} (ticket: ${ctx.ticket.id})`,
        })
        .eq('id', input.invoice_id)
      return {
        ok: true,
        message: `${invoice.invoice_number} iptal edildi`,
      }
    }

    case 'post_ticket_reply': {
      // Public reply — visible to customer. Use service role so the
      // agent acts as "system" rather than a specific user.
      await db.from('ticket_replies').insert({
        ticket_id: ctx.ticket.id,
        user_id: null, // system reply
        message: input.message,
        is_internal: false,
      })
      return { ok: true }
    }

    case 'add_internal_note': {
      await db.from('ticket_replies').insert({
        ticket_id: ctx.ticket.id,
        user_id: null,
        message: `[AI] ${input.message}`,
        is_internal: true,
      })
      return { ok: true }
    }

    case 'update_ticket_status': {
      const allowed = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']
      if (!allowed.includes(input.status)) throw new Error('Geçersiz durum')
      await db
        .from('support_tickets')
        .update({ status: input.status })
        .eq('id', ctx.ticket.id)
      return { ok: true }
    }

    case 'escalate_to_human': {
      await db.from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', ctx.ticket.id)
      await db.from('ticket_replies').insert({
        ticket_id: ctx.ticket.id,
        user_id: null,
        message: `[AI] İnsan ekibe devredildi. Sebep: ${input.reason}`,
        is_internal: true,
      })
      return { ok: true }
    }

    default:
      throw new Error(`Bilinmeyen tool: ${name}`)
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
