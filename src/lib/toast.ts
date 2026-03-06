import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) => {
    return sonnerToast.success(message, {
      description: options?.description,
      action: options?.action,
    })
  },

  error: (message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) => {
    return sonnerToast.error(message, {
      description: options?.description,
      action: options?.action,
    })
  },

  info: (message: string, options?: { description?: string }) => {
    return sonnerToast.info(message, {
      description: options?.description,
    })
  },

  warning: (message: string, options?: { description?: string }) => {
    return sonnerToast.warning(message, {
      description: options?.description,
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, options)
  },
}
