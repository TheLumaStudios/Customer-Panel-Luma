import { useState, useCallback } from 'react'

/**
 * Hook for managing table row selection state
 * Supports individual selection, select all, and range selection (shift+click)
 */
export function useTableSelection(items = []) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null)

  // Toggle individual item selection
  const toggleSelection = useCallback((itemId, index, shiftKey = false) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev)

      // Range selection with Shift key
      if (shiftKey && lastSelectedIndex !== null && index !== lastSelectedIndex) {
        const start = Math.min(lastSelectedIndex, index)
        const end = Math.max(lastSelectedIndex, index)

        for (let i = start; i <= end; i++) {
          if (items[i]) {
            newSelection.add(items[i].id)
          }
        }
      } else {
        // Toggle single item
        if (newSelection.has(itemId)) {
          newSelection.delete(itemId)
        } else {
          newSelection.add(itemId)
        }
      }

      return newSelection
    })

    setLastSelectedIndex(index)
  }, [items, lastSelectedIndex])

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)))
  }, [items])

  // Deselect all items
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
    setLastSelectedIndex(null)
  }, [])

  // Toggle select all (if all selected, deselect all, else select all)
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length && items.length > 0) {
      deselectAll()
    } else {
      selectAll()
    }
  }, [selectedIds.size, items.length, selectAll, deselectAll])

  // Check if item is selected
  const isSelected = useCallback((itemId) => {
    return selectedIds.has(itemId)
  }, [selectedIds])

  // Check if all items are selected
  const isAllSelected = items.length > 0 && selectedIds.size === items.length

  // Check if some (but not all) items are selected
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length

  // Get selected items
  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedIds.has(item.id))
  }, [items, selectedIds])

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    isSelected,
    isAllSelected,
    isSomeSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,
    getSelectedItems,
  }
}
