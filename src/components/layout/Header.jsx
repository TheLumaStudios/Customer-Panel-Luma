import { useState } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export default function Header() {
  // Mock notifications - In production, fetch from API
  const [notifications] = useState([
    {
      id: 1,
      title: 'Yeni Fatura',
      message: 'Hosting paketiniz için yeni fatura oluşturuldu',
      date: new Date(),
      read: false,
      type: 'invoice'
    },
    {
      id: 2,
      title: 'Destek Talebi Yanıtlandı',
      message: 'Hosting sorunu talebiniz yanıtlandı',
      date: new Date(Date.now() - 86400000),
      read: false,
      type: 'ticket'
    },
    {
      id: 3,
      title: 'Domain Yenilenme Hatırlatması',
      message: 'example.com domaininiz 15 gün içinde yenilenmelidir',
      date: new Date(Date.now() - 172800000),
      read: false,
      type: 'domain'
    },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 hover:bg-secondary rounded-md transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Bildirimler</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Tümünü Okundu İşaretle
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Bildiriminiz bulunmuyor
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex-col items-start p-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{notification.title}</span>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notification.date)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle delete notification
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>
            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-sm text-primary cursor-pointer">
                  Tüm Bildirimleri Görüntüle
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
