import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as hostingApi from '@/lib/api/hosting'

// These hooks are for customer hosting records (hosting table)
// For hosting packages, use useHostingPackages.js

export function useHosting() {
  return useQuery({
    queryKey: ['hosting'],
    queryFn: hostingApi.getHosting,
  })
}

export function useHostingRecord(id) {
  return useQuery({
    queryKey: ['hosting', id],
    queryFn: () => hostingApi.getHostingRecord(id),
    enabled: !!id,
  })
}

export function useCreateHosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hostingApi.createHosting,
    onSuccess: () => {
      queryClient.invalidateQueries(['hosting'])
    },
  })
}

export function useUpdateHosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => hostingApi.updateHosting(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['hosting'])
    },
  })
}

export function useDeleteHosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hostingApi.deleteHosting,
    onSuccess: () => {
      queryClient.invalidateQueries(['hosting'])
    },
  })
}

export function useProvisionHosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hostingApi.provisionHosting,
    onSuccess: () => {
      queryClient.invalidateQueries(['hosting'])
    },
  })
}

export function useSuspendHosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }) => hostingApi.suspendHosting(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['hosting'])
    },
  })
}

export function useUnsuspendHosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hostingApi.unsuspendHosting,
    onSuccess: () => {
      queryClient.invalidateQueries(['hosting'])
    },
  })
}

export function useTerminateHosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, keepDns }) => hostingApi.terminateHosting(id, keepDns),
    onSuccess: () => {
      queryClient.invalidateQueries(['hosting'])
    },
  })
}
