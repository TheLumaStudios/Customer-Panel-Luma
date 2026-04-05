import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'

const STEP_ICONS = {
  pending: Circle,
  in_progress: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
}

export function ProvisioningTracker({ queueId }) {
  const [steps, setSteps] = useState([])

  useEffect(() => {
    if (!queueId) return

    const fetchSteps = async () => {
      const { data } = await supabase
        .from('provisioning_steps')
        .select('*')
        .eq('queue_id', queueId)
        .order('sort_order')
      setSteps(data || [])
    }

    fetchSteps()

    // Realtime subscription
    const channel = supabase
      .channel(`provisioning-${queueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'provisioning_steps',
        filter: `queue_id=eq.${queueId}`,
      }, () => {
        fetchSteps()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queueId])

  if (steps.length === 0) return null

  const completedCount = steps.filter(s => s.status === 'completed').length
  const progress = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{progress}%</span>
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[step.status]
          const isLast = i === steps.length - 1

          return (
            <div key={step.id} className="flex gap-3">
              {/* Vertical line + icon */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0',
                  step.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                  step.status === 'in_progress' ? 'bg-primary/10 text-primary' :
                  step.status === 'failed' ? 'bg-red-100 text-red-600' :
                  'bg-muted text-muted-foreground'
                )}>
                  <Icon className={cn('h-4 w-4', step.status === 'in_progress' && 'animate-spin')} />
                </div>
                {!isLast && (
                  <div className={cn(
                    'w-0.5 h-8',
                    step.status === 'completed' ? 'bg-emerald-300' : 'bg-muted'
                  )} />
                )}
              </div>

              {/* Content */}
              <div className="pb-8 pt-0.5">
                <p className={cn(
                  'text-sm font-medium',
                  step.status === 'completed' ? 'text-emerald-700' :
                  step.status === 'in_progress' ? 'text-foreground' :
                  step.status === 'failed' ? 'text-red-700' :
                  'text-muted-foreground'
                )}>
                  {step.step_label}
                </p>
                {step.status === 'failed' && step.error_message && (
                  <p className="text-xs text-red-500 mt-0.5">{step.error_message}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
