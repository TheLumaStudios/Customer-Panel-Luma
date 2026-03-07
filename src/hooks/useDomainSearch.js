import { useMutation, useQuery } from '@tanstack/react-query'
import * as domainApi from '@/lib/api/domainReseller'

export function useDomainSearch() {
  return useMutation({
    mutationFn: ({ domains, extensions, period }) =>
      domainApi.checkDomainAvailability(domains, extensions, period),
  })
}

export function useDomainPricing() {
  return useQuery({
    queryKey: ['domain-pricing'],
    queryFn: domainApi.getDomainPricing,
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    // Use fallback data if API fails
    placeholderData: domainApi.popularTLDs,
  })
}

export function useDomainRegister() {
  return useMutation({
    mutationFn: ({ domains, currency, payment_method, return_url, cancel_url }) =>
      domainApi.registerDomains(domains, currency, payment_method, return_url, cancel_url),
  })
}

export function useDomainRegisterSingle() {
  return useMutation({
    mutationFn: ({ domainName, period, contacts, nameservers }) =>
      domainApi.registerDomain(domainName, period, contacts, nameservers),
  })
}
