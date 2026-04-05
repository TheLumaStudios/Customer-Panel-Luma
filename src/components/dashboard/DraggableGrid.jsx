import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const STORAGE_KEY = 'luma_dashboard_layout'

function SortableWidget({ id, children, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button {...attributes} {...listeners} className="p-1 rounded bg-white/80 hover:bg-white shadow-sm cursor-grab active:cursor-grabbing">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => onRemove(id)} className="p-1 rounded bg-white/80 hover:bg-red-50 shadow-sm">
          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
        </button>
      </div>
      {children}
    </div>
  )
}

export function DraggableGrid({ widgets, renderWidget }) {
  // widgets: [{ id: 'revenue', title: 'Gelir Trendi', size: 'large' | 'small' }, ...]
  const [activeWidgets, setActiveWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : widgets.map(w => w.id)
    } catch {
      return widgets.map(w => w.id)
    }
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setActiveWidgets((items) => {
      const oldIndex = items.indexOf(active.id)
      const newIndex = items.indexOf(over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))
      return newItems
    })
  }, [])

  const removeWidget = useCallback((id) => {
    setActiveWidgets((items) => {
      const newItems = items.filter(i => i !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))
      return newItems
    })
  }, [])

  const addWidget = useCallback((id) => {
    setActiveWidgets((items) => {
      if (items.includes(id)) return items
      const newItems = [...items, id]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))
      return newItems
    })
  }, [])

  const resetLayout = useCallback(() => {
    const defaultLayout = widgets.map(w => w.id)
    setActiveWidgets(defaultLayout)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLayout))
  }, [widgets])

  const hiddenWidgets = widgets.filter(w => !activeWidgets.includes(w.id))

  return (
    <div className="space-y-4">
      {/* Hidden widgets recovery + reset */}
      {(hiddenWidgets.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          {hiddenWidgets.map((w) => (
            <Button key={w.id} variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addWidget(w.id)}>
              <Plus className="h-3 w-3" /> {w.title}
            </Button>
          ))}
          <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={resetLayout}>
            Düzeni Sıfırla
          </Button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeWidgets} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeWidgets.map((id) => {
              const widget = widgets.find(w => w.id === id)
              if (!widget) return null
              return (
                <SortableWidget key={id} id={id} onRemove={removeWidget}>
                  <Card className={`rounded-xl shadow-card overflow-hidden ${widget.size === 'full' ? 'lg:col-span-2' : ''}`}>
                    {renderWidget(widget)}
                  </Card>
                </SortableWidget>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
