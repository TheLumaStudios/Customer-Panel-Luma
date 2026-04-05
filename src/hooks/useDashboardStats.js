import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { data: customerStats },
        { data: invoiceStats },
        { data: serviceStats },
        { data: monthlyRevenue },
      ] = await Promise.all([
        supabase.from('mv_customer_stats').select('*').single(),
        supabase.from('mv_invoice_summary').select('*').single(),
        supabase.from('mv_service_stats').select('*'),
        supabase.from('mv_monthly_revenue').select('*').order('month', { ascending: false }).limit(12),
      ])

      return {
        customers: customerStats || {},
        invoices: invoiceStats || {},
        services: serviceStats || [],
        monthlyRevenue: monthlyRevenue || [],
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - views are already cached
    refetchOnWindowFocus: false,
  })
}
