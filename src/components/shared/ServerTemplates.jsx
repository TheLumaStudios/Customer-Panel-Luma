import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Rocket, Terminal } from 'lucide-react'

export function ServerTemplates({ hostingId, onInstall }) {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    supabase.from('server_templates').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setTemplates(data || []))
  }, [])

  const handleInstall = async () => {
    if (!selectedTemplate) return
    setInstalling(true)
    try {
      // In production, this would call an edge function that SSHs into the server
      await onInstall?.(selectedTemplate)
      toast.success('Kurulum baslatildi', { description: `${selectedTemplate.name} kurulumu arka planda devam ediyor` })
      setSelectedTemplate(null)
    } catch (err) {
      toast.error('Kurulum hatasi', { description: err.message })
    } finally {
      setInstalling(false)
    }
  }

  if (templates.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((t) => (
          <Card
            key={t.id}
            className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
            onClick={() => setSelectedTemplate(t)}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="w-[500px] max-w-[90vw]">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-xl">{selectedTemplate.icon}</span>
                  {selectedTemplate.name}
                </DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedTemplate.requirements && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Gereksinimler</p>
                    <Badge variant="outline">{selectedTemplate.requirements}</Badge>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Kurulacak Komutlar</p>
                  <div className="bg-slate-900 rounded-lg p-3 space-y-1 max-h-[200px] overflow-y-auto">
                    {(selectedTemplate.commands || []).map((cmd, i) => (
                      <div key={i} className="flex items-start gap-2 font-mono text-xs">
                        <Terminal className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-emerald-300">{cmd}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>İptal</Button>
                  <Button onClick={handleInstall} disabled={installing} className="gap-2">
                    <Rocket className="h-4 w-4" />
                    {installing ? 'Kuruluyor...' : 'Kurulumu Baslat'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
