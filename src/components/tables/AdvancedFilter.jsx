import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Filter, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

/**
 * Advanced filter builder component
 * Allows building complex filters with multiple columns and operators
 */
export default function AdvancedFilter({
  columns = [],
  onFilterChange,
  className
}) {
  const [filters, setFilters] = useState([])
  const [showBuilder, setShowBuilder] = useState(false)

  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      column: columns[0]?.value || '',
      operator: 'contains',
      value: ''
    }
    setFilters([...filters, newFilter])
    setShowBuilder(true)
  }

  const updateFilter = (id, field, value) => {
    const updatedFilters = filters.map(f =>
      f.id === id ? { ...f, [field]: value } : f
    )
    setFilters(updatedFilters)
    onFilterChange?.(updatedFilters)
  }

  const removeFilter = (id) => {
    const updatedFilters = filters.filter(f => f.id !== id)
    setFilters(updatedFilters)
    onFilterChange?.(updatedFilters)
  }

  const clearAllFilters = () => {
    setFilters([])
    setShowBuilder(false)
    onFilterChange?.([])
  }

  const getOperatorsForColumn = (columnValue) => {
    const column = columns.find(c => c.value === columnValue)
    if (!column) return []

    switch (column.type) {
      case 'text':
        return [
          { value: 'contains', label: 'İçerir' },
          { value: 'equals', label: 'Eşittir' },
          { value: 'startsWith', label: 'Başlar' },
          { value: 'endsWith', label: 'Biter' },
        ]
      case 'number':
        return [
          { value: 'equals', label: 'Eşittir' },
          { value: 'gt', label: 'Büyüktür' },
          { value: 'lt', label: 'Küçüktür' },
          { value: 'between', label: 'Arasında' },
        ]
      case 'date':
        return [
          { value: 'is', label: 'Eşittir' },
          { value: 'before', label: 'Önce' },
          { value: 'after', label: 'Sonra' },
          { value: 'between', label: 'Arasında' },
        ]
      case 'select':
        return [
          { value: 'is', label: 'Eşittir' },
          { value: 'isNot', label: 'Değildir' },
          { value: 'isAnyOf', label: 'Herhangi biri' },
        ]
      case 'boolean':
        return [
          { value: 'is', label: 'Eşittir' },
        ]
      default:
        return [{ value: 'contains', label: 'İçerir' }]
    }
  }

  const renderValueInput = (filter) => {
    const column = columns.find(c => c.value === filter.column)
    if (!column) return null

    switch (column.type) {
      case 'text':
        return (
          <Input
            placeholder="Değer girin"
            value={filter.value}
            onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
            className="w-[200px]"
          />
        )

      case 'number':
        if (filter.operator === 'between') {
          return (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filter.value?.min || ''}
                onChange={(e) => updateFilter(filter.id, 'value', {
                  ...filter.value,
                  min: e.target.value
                })}
                className="w-[100px]"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={filter.value?.max || ''}
                onChange={(e) => updateFilter(filter.id, 'value', {
                  ...filter.value,
                  max: e.target.value
                })}
                className="w-[100px]"
              />
            </div>
          )
        }
        return (
          <Input
            type="number"
            placeholder="Değer girin"
            value={filter.value}
            onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
            className="w-[200px]"
          />
        )

      case 'date':
        if (filter.operator === 'between') {
          return (
            <div className="flex items-center gap-2">
              <DatePicker
                date={filter.value?.start}
                onSelect={(date) => updateFilter(filter.id, 'value', {
                  ...filter.value,
                  start: date
                })}
              />
              <span className="text-muted-foreground">-</span>
              <DatePicker
                date={filter.value?.end}
                onSelect={(date) => updateFilter(filter.id, 'value', {
                  ...filter.value,
                  end: date
                })}
              />
            </div>
          )
        }
        return (
          <DatePicker
            date={filter.value}
            onSelect={(date) => updateFilter(filter.id, 'value', date)}
          />
        )

      case 'select':
        return (
          <Select
            value={filter.value}
            onValueChange={(value) => updateFilter(filter.id, 'value', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seçin" />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'boolean':
        return (
          <Select
            value={filter.value}
            onValueChange={(value) => updateFilter(filter.id, 'value', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Evet</SelectItem>
              <SelectItem value="false">Hayır</SelectItem>
            </SelectContent>
          </Select>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={addFilter}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtre Ekle
        </Button>

        {filters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Tümünü Temizle
          </Button>
        )}
      </div>

      {showBuilder && filters.length > 0 && (
        <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
          {filters.map((filter) => (
            <div key={filter.id} className="flex items-center gap-2">
              {/* Column selector */}
              <Select
                value={filter.column}
                onValueChange={(value) => {
                  updateFilter(filter.id, 'column', value)
                  updateFilter(filter.id, 'operator', getOperatorsForColumn(value)[0]?.value)
                  updateFilter(filter.id, 'value', '')
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.value} value={column.value}>
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Operator selector */}
              <Select
                value={filter.operator}
                onValueChange={(value) => updateFilter(filter.id, 'operator', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getOperatorsForColumn(filter.column).map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value input */}
              {renderValueInput(filter)}

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFilter(filter.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Date picker helper component
function DatePicker({ date, onSelect }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[200px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          {date ? format(date, 'PPP', { locale: tr }) : <span>Tarih seçin</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
