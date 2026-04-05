import { cn } from '@/lib/utils'
import { Smile, Meh, Frown, Angry } from 'lucide-react'

const SENTIMENT_CONFIG = {
  positive: { icon: Smile, label: 'Pozitif', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  neutral: { icon: Meh, label: 'Nötr', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  negative: { icon: Frown, label: 'Negatif', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  angry: { icon: Angry, label: 'Kızgın', color: 'bg-red-50 text-red-700 border-red-200' },
}

export function SentimentBadge({ sentiment, className }) {
  if (!sentiment) return null
  const config = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral
  const Icon = config.icon

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', config.color, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
