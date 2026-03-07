import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { Keyboard } from 'lucide-react'

export default function KeyboardShortcutsDialog({ open, onOpenChange }) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const shortcuts = {
    global: [
      { keys: ['⌘', 'K'], description: 'Command Palette\'i aç' },
      { keys: ['?'], description: 'Klavye kısayollarını göster' },
      { keys: ['Esc'], description: 'Modal/Dialog\'ları kapat' },
    ],
    navigation: isAdmin ? [
      { keys: ['G', 'D'], description: 'Dashboard\'a git' },
      { keys: ['G', 'C'], description: 'Müşteriler\'e git' },
      { keys: ['G', 'I'], description: 'Faturalar\'a git' },
      { keys: ['G', 'M'], description: 'Domainler\'e git' },
      { keys: ['G', 'H'], description: 'Hosting\'e git' },
      { keys: ['G', 'V'], description: 'VDS/VPS\'e git' },
      { keys: ['G', 'T'], description: 'Destek\'e git' },
      { keys: ['G', 'S'], description: 'Ayarlar\'a git' },
      { keys: ['G', 'P'], description: 'Hosting Paketleri\'ne git' },
      { keys: ['G', 'R'], description: 'Sunucular\'a git' },
    ] : [
      { keys: ['G', 'D'], description: 'Dashboard\'a git' },
      { keys: ['G', 'M'], description: 'Domainlerim\'e git' },
      { keys: ['G', 'H'], description: 'Hostingim\'e git' },
      { keys: ['G', 'V'], description: 'VDS/VPS\'e git' },
      { keys: ['G', 'I'], description: 'Faturalarım\'a git' },
      { keys: ['G', 'T'], description: 'Destek\'e git' },
      { keys: ['G', 'P'], description: 'Profil\'e git' },
    ],
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Klavye Kısayolları
          </DialogTitle>
          <DialogDescription>
            Paneli daha hızlı kullanmak için klavye kısayolları
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Global Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
              Global Kısayollar
            </h3>
            <div className="space-y-2">
              {shortcuts.global.map((shortcut, index) => (
                <ShortcutRow key={index} {...shortcut} />
              ))}
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
              Navigasyon Kısayolları
            </h3>
            <div className="space-y-2">
              {shortcuts.navigation.map((shortcut, index) => (
                <ShortcutRow key={index} {...shortcut} />
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold">İpuçları</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Navigasyon kısayolları için önce <kbd className="px-1.5 py-0.5 text-xs bg-background border rounded">G</kbd> tuşuna basın, ardından hedef tuşa basın</li>
              <li>Command Palette tüm özelliklere hızlı erişim sağlar</li>
              <li>Modal açıkken <kbd className="px-1.5 py-0.5 text-xs bg-background border rounded">Esc</kbd> ile kapatabilirsiniz</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShortcutRow({ keys, description }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
      <span className="text-sm">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center gap-1">
            <kbd className="px-2 py-1 text-xs font-semibold bg-background border border-border rounded shadow-sm min-w-[24px] text-center">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="text-muted-foreground text-xs">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
