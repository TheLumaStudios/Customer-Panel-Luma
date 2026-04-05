import { useMemo } from 'react'

const strengthLevels = [
  { label: 'Çok Zayıf', color: 'bg-red-500', textColor: 'text-red-600' },
  { label: 'Zayıf', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { label: 'Orta', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { label: 'Güçlü', color: 'bg-green-500', textColor: 'text-green-600' },
  { label: 'Çok Güçlü', color: 'bg-green-700', textColor: 'text-green-700' },
]

function calculateStrength(password) {
  if (!password) return 0

  let score = 0

  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  // Map score (0-5) to level (0-4)
  if (score <= 1) return 0
  if (score === 2) return 1
  if (score === 3) return 2
  if (score === 4) return 3
  return 4
}

export default function PasswordStrength({ password }) {
  const level = useMemo(() => calculateStrength(password), [password])
  const config = strengthLevels[level]

  if (!password) return null

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i <= level ? config.color : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${config.textColor}`}>
        {config.label}
      </p>
    </div>
  )
}
