import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

/**
 * Subscribe to Supabase Realtime changes on a table
 * @param {string} table - Table name
 * @param {string} event - 'INSERT' | 'UPDATE' | 'DELETE' | '*'
 * @param {function} callback - Called with payload
 * @param {object} filter - Optional filter { column: 'customer_id', value: 'uuid' }
 */
export function useRealtimeSubscription(table, event = '*', callback, filter) {
  useEffect(() => {
    let channel = supabase.channel(`${table}-changes`)

    const config = {
      event,
      schema: 'public',
      table,
    }

    if (filter?.column && filter?.value) {
      config.filter = `${filter.column}=eq.${filter.value}`
    }

    channel = channel.on('postgres_changes', config, (payload) => {
      callback?.(payload)
    })

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, event, filter?.column, filter?.value])
}

// Convenience: Show toast on new notifications
export function useRealtimeNotifications(userId) {
  useRealtimeSubscription('invoices', 'INSERT', (payload) => {
    if (payload.new?.customer_id === userId) {
      toast.info('Yeni Fatura', {
        description: `${payload.new.invoice_number || 'Yeni bir fatura'} oluşturuldu`,
      })
    }
  })

  useRealtimeSubscription('support_tickets', 'UPDATE', (payload) => {
    if (payload.new?.customer_id === userId) {
      toast.info('Destek Talebi Güncellendi', {
        description: `Talebiniz "${payload.new.status}" durumuna geçti`,
      })
    }
  })

  useRealtimeSubscription('hosting', 'UPDATE', (payload) => {
    if (payload.new?.customer_id === userId && payload.old?.status !== payload.new?.status) {
      const msg = payload.new.status === 'suspended' ? 'Hosting hesabınız askıya alındı' :
                  payload.new.status === 'active' ? 'Hosting hesabınız aktifleştirildi' :
                  `Hosting durumu: ${payload.new.status}`
      toast[payload.new.status === 'suspended' ? 'warning' : 'success']('Hosting Durumu', { description: msg })
    }
  })
}

// Admin: Real-time dashboard updates
export function useAdminRealtimeUpdates(onUpdate) {
  useRealtimeSubscription('invoices', '*', () => onUpdate?.('invoices'))
  useRealtimeSubscription('customers', 'INSERT', (payload) => {
    toast.info('Yeni Müşteri', { description: payload.new?.full_name || 'Yeni kayıt' })
    onUpdate?.('customers')
  })
  useRealtimeSubscription('support_tickets', 'INSERT', (payload) => {
    toast.info('Yeni Destek Talebi', { description: payload.new?.subject || 'Yeni talep' })
    onUpdate?.('tickets')
  })
}
