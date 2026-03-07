import { Button } from '@/components/ui/button'
import { X, Trash2, Download, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Bulk action bar that appears when rows are selected
 * Shows selection count and available bulk actions
 */
export default function BulkActionBar({
  selectedCount,
  onDeselectAll,
  actions = [],
  className
}) {
  if (selectedCount === 0) return null

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg",
      "animate-in slide-in-from-top-2 duration-200",
      className
    )}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {selectedCount}
          </div>
          <span className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? 'öğe' : 'öğe'} seçildi
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDeselectAll}
          className="h-8"
        >
          <X className="h-4 w-4 mr-1" />
          Seçimi Temizle
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon || Edit
          return (
            <Button
              key={index}
              variant={action.variant || "secondary"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="h-8"
            >
              <Icon className="h-4 w-4 mr-1" />
              {action.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

// Common bulk action helpers
export const commonBulkActions = {
  delete: (onDelete) => ({
    icon: Trash2,
    label: 'Sil',
    variant: 'destructive',
    onClick: onDelete
  }),
  export: (onExport) => ({
    icon: Download,
    label: 'Dışa Aktar',
    variant: 'secondary',
    onClick: onExport
  }),
}
