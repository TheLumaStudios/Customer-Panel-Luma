import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as ticketsApi from '@/lib/api/tickets'

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: ticketsApi.getTickets,
  })
}

export function useTicket(id) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketsApi.getTicket(id),
    enabled: !!id,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ticketsApi.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets'])
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => ticketsApi.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets'])
    },
  })
}

export function useDeleteTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ticketsApi.deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets'])
    },
  })
}

export function useCreateTicketReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ticketsApi.createTicketReply,
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets'])
    },
  })
}
