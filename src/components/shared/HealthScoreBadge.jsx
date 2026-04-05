import { cn } from '@/lib/utils'

export function HealthScoreBadge({ score, size = 'default' }) {
  if (score == null) return null

  const getColor = (s) => {
    if (s >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-300'
    if (s >= 60) return 'bg-blue-100 text-blue-700 border-blue-300'
    if (s >= 40) return 'bg-amber-100 text-amber-700 border-amber-300'
    return 'bg-red-100 text-red-700 border-red-300'
  }

  const getLabel = (s) => {
    if (s >= 80) return 'Mükemmel'
    if (s >= 60) return 'İyi'
    if (s >= 40) return 'Orta'
    return 'Riskli'
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-medium',
      getColor(score),
      size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
    )}>
      <span className="font-bold">{score}</span>
      <span>{getLabel(score)}</span>
    </div>
  )
}
