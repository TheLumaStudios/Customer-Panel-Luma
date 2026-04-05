import Papa from 'papaparse'

/**
 * Parse a CSV file and return data
 * @param {File} file
 * @returns {Promise<{ data: Array, errors: Array, meta: Object }>}
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => resolve(results),
      error: (error) => reject(error),
    })
  })
}

/**
 * Export data to CSV and trigger download
 * @param {Array} data - Array of objects
 * @param {string} filename - File name without extension
 * @param {Array<string>} columns - Optional column order
 */
export function exportCSV(data, filename = 'export', columns) {
  const csv = Papa.unparse(data, {
    columns: columns || undefined,
  })

  const BOM = '\uFEFF' // UTF-8 BOM for Turkish chars in Excel
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
