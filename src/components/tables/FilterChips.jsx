import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

/**
 * Display active filters as removable chips
 */
export default function FilterChips({ filters = [], columns = [], onRemove }) {
  if (filters.length === 0) return null

  const getFilterLabel = (filter) => {
    const column = columns.find(c => c.value === filter.column)
    if (!column) return null

    let valueLabel = filter.value

    // Format based on column type
    if (column.type === 'date') {
      if (filter.operator === 'between' && filter.value?.start && filter.value?.end) {
        valueLabel = `${format(filter.value.start, 'PPP', { locale: tr })} - ${format(filter.value.end, 'PPP', { locale: tr })}`
      } else if (filter.value) {
        valueLabel = format(filter.value, 'PPP', { locale: tr })
      }
    } else if (column.type === 'number' && filter.operator === 'between') {
      valueLabel = `${filter.value?.min || ''} - ${filter.value?.max || ''}`
    } else if (column.type === 'select') {
      const option = column.options?.find(opt => opt.value === filter.value)
      valueLabel = option?.label || filter.value
    } else if (column.type === 'boolean') {
      valueLabel = filter.value === 'true' ? 'Evet' : 'Hayır'
    }

    const operatorLabels = {
      contains: 'içerir',
      equals: '=',
      startsWith: 'başlar',
      endsWith: 'biter',
      gt: '>',
      lt: '<',
      between: 'arasında',
      is: '=',
      isNot: '≠',
      before: 'önce',
      after: 'sonra',
      isAnyOf: 'herhangi',
    }

    const operatorLabel = operatorLabels[filter.operator] || filter.operator

    return `${column.label} ${operatorLabel} ${valueLabel}`
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Aktif Filtreler:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="pr-1 gap-2 cursor-pointer hover:bg-secondary/80"
        >
          <span>{getFilterLabel(filter)}</span>
          <button
            onClick={() => onRemove(filter.id)}
            className="hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}
