import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { useDebounce } from 'ahooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox,
} from 'lucide-react'

export function DataTable({
  data = [],
  columns: columnDefs = [],
  searchable = true,
  searchPlaceholder = 'Ara...',
  pagination = true,
  pageSize: initialPageSize = 25,
  loading = false,
  emptyIcon,
  emptyTitle = 'Veri bulunamadı',
  emptyDescription,
  onRowClick,
  selectable = false,
  selectedIds,
  onSelectionChange,
  headerActions,
  className,
}) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})

  const debouncedFilter = useDebounce(globalFilter, { wait: 300 })

  // Transform columnDefs to TanStack format
  const tanstackColumns = useMemo(() => {
    const cols = []

    if (selectable) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
        enableSorting: false,
      })
    }

    columnDefs.filter(c => !c.hidden).forEach((col) => {
      cols.push({
        id: col.key,
        accessorKey: col.key,
        header: ({ column }) => {
          const sorted = column.getIsSorted()
          return (
            <button
              className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider ${col.sortable === false ? '' : 'cursor-pointer select-none hover:text-foreground'}`}
              onClick={col.sortable !== false ? column.getToggleSortingHandler() : undefined}
            >
              {col.label}
              {col.sortable !== false && (
                sorted === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> :
                sorted === 'desc' ? <ChevronDown className="h-3.5 w-3.5" /> :
                <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
              )}
            </button>
          )
        },
        cell: col.render
          ? ({ row }) => col.render(row.original[col.key], row.original)
          : ({ getValue }) => getValue() ?? '-',
        enableSorting: col.sortable !== false,
        meta: { className: col.className },
      })
    })

    return cols
  }, [columnDefs, selectable])

  const table = useReactTable({
    data: data || [],
    columns: tanstackColumns,
    state: {
      globalFilter: debouncedFilter,
      sorting,
      rowSelection,
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: initialPageSize },
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
      setRowSelection(newSelection)

      // Sync with external selectedIds/onSelectionChange for backward compat
      if (onSelectionChange) {
        const selectedRowIds = new Set(
          Object.keys(newSelection)
            .filter(k => newSelection[k])
        )
        onSelectionChange(selectedRowIds)
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getRowId: (row) => row.id != null ? String(row.id) : undefined,
    enableRowSelection: selectable,
  })

  // Loading skeleton
  if (loading) {
    return (
      <div className={className}>
        {searchable && <div className="h-10 bg-muted rounded-lg animate-pulse w-72 mb-4" />}
        <div className="border rounded-xl overflow-hidden bg-card">
          <div className="h-11 bg-muted/50 border-b" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-t">
              {columnDefs.filter(c => !c.hidden).map((_, j) => (
                <div key={j} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 80}px` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const rows = table.getRowModel().rows

  return (
    <div className={className}>
      {/* Header: Search + Actions */}
      {(searchable || headerActions) && (
        <div className="flex items-center justify-between gap-4 mb-4">
          {searchable && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 bg-white h-9"
              />
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2 flex-shrink-0">{headerActions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-xl overflow-hidden bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-muted/40 border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-muted-foreground ${header.column.columnDef.meta?.className || ''}`}
                      style={header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={tanstackColumns.length} className="py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      {emptyIcon || <Inbox className="h-12 w-12 text-muted-foreground/20 mb-3" />}
                      <p className="font-medium text-muted-foreground">{emptyTitle}</p>
                      {emptyDescription && <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">{emptyDescription}</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-t transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${row.getIsSelected() ? 'bg-primary/5' : i % 2 === 0 ? 'bg-white' : 'bg-muted/15'} hover:bg-muted/30`}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={`px-4 py-3 ${cell.column.columnDef.meta?.className || ''}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && table.getFilteredRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>
              {table.getFilteredRowModel().rows.length} kayıt
              {selectable && table.getFilteredSelectedRowModel().rows.length > 0 && (
                <> · {table.getFilteredSelectedRowModel().rows.length} seçili</>
              )}
            </span>
            <span>·</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1 text-xs bg-white"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / sayfa</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={!table.getCanPreviousPage()} onClick={() => table.setPageIndex(0)}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-muted-foreground">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={!table.getCanNextPage()} onClick={() => table.setPageIndex(table.getPageCount() - 1)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
