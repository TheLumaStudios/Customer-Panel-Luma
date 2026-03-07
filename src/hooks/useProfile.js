import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as profileApi from '@/lib/api/profile'

/**
 * Get current user profile
 */
export function useCurrentProfile() {
  return useQuery({
    queryKey: ['current-profile'],
    queryFn: profileApi.getCurrentProfile,
  })
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-profile'] })
      queryClient.setQueryData(['current-profile'], data)
    },
  })
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: profileApi.changePassword,
  })
}

/**
 * Change email mutation
 */
export function useChangeEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileApi.changeEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-profile'] })
    },
  })
}

/**
 * Upload avatar mutation
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-profile'] })
    },
  })
}
