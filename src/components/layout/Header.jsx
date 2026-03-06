import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Header() {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Hoş Geldiniz
        </h2>
        <p className="text-sm text-muted-foreground">
          Panel yönetim sistemi
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-secondary rounded-md transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            3
          </Badge>
        </button>
      </div>
    </header>
  )
}
