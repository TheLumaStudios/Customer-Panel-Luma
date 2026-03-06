import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatCurrency(amount) {
  if (!amount) return '₺0.00'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount)
}

export function getDaysUntil(date) {
  if (!date) return null
  const today = new Date()
  const targetDate = new Date(date)
  const diffTime = targetDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function getExpirationStatus(expirationDate) {
  const daysUntil = getDaysUntil(expirationDate)

  if (daysUntil < 0) return 'expired'
  if (daysUntil <= 7) return 'critical'
  if (daysUntil <= 30) return 'warning'
  return 'active'
}
