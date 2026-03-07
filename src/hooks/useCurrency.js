import { useQuery } from '@tanstack/react-query'
import * as currencyApi from '@/lib/api/currency'

/**
 * Hook to fetch USD to TRY exchange rate
 */
export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rate', 'USD-TRY'],
    queryFn: currencyApi.getUsdToTryRate,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    retry: 2,
  })
}

/**
 * Hook to fetch all exchange rates
 */
export function useAllExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates', 'all'],
    queryFn: currencyApi.getExchangeRates,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    retry: 2,
  })
}
