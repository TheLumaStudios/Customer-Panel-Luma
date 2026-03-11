import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as employeesApi from '@/lib/api/employees'

/**
 * Get all employees
 * @param {Object} options - Query options
 */
export function useEmployees(options = {}) {
  return useQuery({
    queryKey: ['employees', options],
    queryFn: () => employeesApi.getEmployees(options),
  })
}

/**
 * Get single employee
 * @param {string} id - Employee ID
 */
export function useEmployee(id) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => employeesApi.getEmployee(id),
    enabled: !!id,
  })
}

/**
 * Create employee mutation
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: employeesApi.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

/**
 * Update employee mutation
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => employeesApi.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

/**
 * Delete employee mutation
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: employeesApi.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

/**
 * Generate employee code
 */
export function useGenerateEmployeeCode() {
  return useQuery({
    queryKey: ['employee-code-generator'],
    queryFn: employeesApi.generateEmployeeCode,
    enabled: false, // Only run when manually triggered
  })
}
