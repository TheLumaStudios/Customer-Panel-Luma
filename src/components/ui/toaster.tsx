import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          borderRadius: '8px',
        },
        className: 'font-sans',
      }}
    />
  )
}
