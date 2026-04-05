import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { TrendingUp, X } from 'lucide-react'

export function UpsellCard({ hostingId, resourceType, usagePercent, currentPackage, onUpgrade }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || usagePercent < 80) return null

  const handleDismiss = async () => {
    setDismissed(true)
    await supabase.from('hosting').update({ upsell_dismissed_at: new Date().toISOString() }).eq('id', hostingId)
  }

  const resourceLabels = {
    disk: 'Disk',
    bandwidth: 'Bant Genişliği',
    cpu: 'CPU',
  }

  const urgency = usagePercent >= 95 ? 'critical' : usagePercent >= 90 ? 'high' : 'normal'
  const colors = {
    critical: 'border-red-200 bg-red-50/50',
    high: 'border-amber-200 bg-amber-50/50',
    normal: 'border-blue-200 bg-blue-50/50',
  }

  return (
    <Card className={`p-4 ${colors[urgency]} relative`}>
      <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 rounded hover:bg-black/5">
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {resourceLabels[resourceType] || resourceType} kullanımınız <span className="font-bold text-primary">%{usagePercent}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentPackage && `Mevcut: ${currentPackage}.`} Performans sorunları yaşamamak için paketinizi yükseltmenizi öneriyoruz.
          </p>
          <Button size="sm" className="mt-2 h-7 text-xs gap-1" onClick={onUpgrade}>
            <TrendingUp className="h-3 w-3" /> Tek Tıkla Yükselt
          </Button>
        </div>
      </div>
    </Card>
  )
}
