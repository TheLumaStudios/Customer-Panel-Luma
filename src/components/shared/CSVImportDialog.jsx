import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { parseCSV } from '@/lib/csv'

export function CSVImportDialog({ open, onOpenChange, onImport, requiredColumns = [], title = 'CSV İçe Aktar' }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [errors, setErrors] = useState([])
  const [importing, setImporting] = useState(false)

  const handleFileChange = useCallback(async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setErrors([])

    try {
      const result = await parseCSV(f)

      // Validate required columns
      const missingCols = requiredColumns.filter(c => !result.meta.fields?.includes(c))
      if (missingCols.length > 0) {
        setErrors([`Eksik kolonlar: ${missingCols.join(', ')}`])
        setPreview(null)
        return
      }

      if (result.errors.length > 0) {
        setErrors(result.errors.map(e => `Satır ${e.row}: ${e.message}`))
      }

      setPreview({
        data: result.data,
        fields: result.meta.fields,
        total: result.data.length,
      })
    } catch (err) {
      setErrors([err.message])
    }
  }, [requiredColumns])

  const handleImport = async () => {
    if (!preview?.data) return
    setImporting(true)
    try {
      await onImport(preview.data)
      toast.success(`${preview.total} kayıt başarıyla içe aktarıldı`)
      onOpenChange(false)
      setFile(null)
      setPreview(null)
    } catch (err) {
      toast.error('İçe aktarma hatası', { description: err.message })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[700px] max-w-[90vw] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            CSV dosyanızı seçin. {requiredColumns.length > 0 && `Zorunlu kolonlar: ${requiredColumns.join(', ')}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* File Input */}
          <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csv-input" />
            <label htmlFor="csv-input" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="outline">{preview?.total || 0} kayıt</Badge>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">CSV dosyası seçmek için tıklayın</p>
                </div>
              )}
            </label>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {errors.slice(0, 5).map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {err}
                </div>
              ))}
              {errors.length > 5 && <p className="text-xs text-red-500">... ve {errors.length - 5} hata daha</p>}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10">#</TableHead>
                    {preview.fields?.slice(0, 6).map((f) => (
                      <TableHead key={f} className="text-xs">{f}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.data.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      {preview.fields?.slice(0, 6).map((f) => (
                        <TableCell key={f} className="text-xs max-w-[150px] truncate">{row[f] || '-'}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {preview.total > 10 && (
                <div className="text-center py-2 text-xs text-muted-foreground border-t">
                  İlk 10 kayıt gösteriliyor (toplam {preview.total})
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={handleImport} disabled={!preview?.data || importing} className="gap-2">
            {importing ? 'İçe aktarılıyor...' : (
              <><CheckCircle2 className="h-4 w-4" /> {preview?.total || 0} Kayıt İçe Aktar</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
