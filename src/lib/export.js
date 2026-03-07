import * as XLSX from 'xlsx'

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column configuration [{key, label}]
 * @param {string} filename - Output filename (without extension)
 */
export function exportToCSV(data, columns, filename = 'export') {
  if (!data || data.length === 0) {
    throw new Error('Dışa aktarılacak veri bulunamadı')
  }

  // Create CSV headers
  const headers = columns.map(col => col.label).join(',')

  // Create CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key]

      // Handle null/undefined
      if (value === null || value === undefined) {
        return ''
      }

      // Handle dates
      if (value instanceof Date) {
        value = value.toLocaleDateString('tr-TR')
      }

      // Handle objects (stringify)
      if (typeof value === 'object') {
        value = JSON.stringify(value)
      }

      // Escape commas and quotes
      value = String(value)
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`
      }

      return value
    }).join(',')
  })

  // Combine headers and rows
  const csv = [headers, ...rows].join('\n')

  // Create and download file
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Export data to Excel format
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column configuration [{key, label}]
 * @param {string} filename - Output filename (without extension)
 * @param {string} sheetName - Worksheet name
 */
export function exportToExcel(data, columns, filename = 'export', sheetName = 'Sayfa1') {
  if (!data || data.length === 0) {
    throw new Error('Dışa aktarılacak veri bulunamadı')
  }

  // Transform data to match column configuration
  const transformedData = data.map(item => {
    const row = {}
    columns.forEach(col => {
      let value = item[col.key]

      // Handle dates
      if (value instanceof Date) {
        value = value.toLocaleDateString('tr-TR')
      }

      // Handle objects
      if (value !== null && typeof value === 'object') {
        value = JSON.stringify(value)
      }

      row[col.label] = value ?? ''
    })
    return row
  })

  // Create worksheet from transformed data
  const worksheet = XLSX.utils.json_to_sheet(transformedData)

  // Auto-size columns
  const maxWidths = columns.map(col => {
    const headerWidth = col.label.length
    const dataWidths = data.map(item => {
      const value = String(item[col.key] ?? '')
      return value.length
    })
    return Math.max(headerWidth, ...dataWidths, 10)
  })

  worksheet['!cols'] = maxWidths.map(width => ({ wch: Math.min(width + 2, 50) }))

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Generate and download file
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Export data with format choice dialog
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column configuration [{key, label}]
 * @param {string} filename - Output filename (without extension)
 * @param {string} format - 'csv' | 'excel' | 'both'
 */
export function exportData(data, columns, filename = 'export', format = 'csv') {
  try {
    if (format === 'csv') {
      exportToCSV(data, columns, filename)
    } else if (format === 'excel') {
      exportToExcel(data, columns, filename)
    } else if (format === 'both') {
      exportToCSV(data, columns, filename)
      exportToExcel(data, columns, filename)
    }
  } catch (error) {
    console.error('Export error:', error)
    throw error
  }
}

/**
 * Format date for export
 */
export function formatExportDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Format currency for export
 */
export function formatExportCurrency(amount, currency = 'TRY') {
  if (amount === null || amount === undefined) return ''
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}
