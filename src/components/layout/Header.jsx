import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Check, X, ShoppingCart, Trash2 } from 'lucide-react'
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
import { useCart } from '@/contexts/CartContext'
import { useExchangeRate } from '@/hooks/useCurrency'
import { convertUsdToTry } from '@/lib/api/currency'
import Breadcrumbs from './Breadcrumbs'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, cartCount, cartTotal, currency, removeFromCart } = useCart()
  const { data: exchangeRate } = useExchangeRate()

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

  // Psychological pricing: round to .99 (e.g., 801 → 799.99)
  const toPsychologicalPrice = (price) => {
    if (price <= 0) return 0
    const rounded = Math.ceil(price)
    return rounded - 0.01
  }

  // Format price based on selected currency
  const formatPrice = (usdPrice) => {
    if (currency === 'TRY' && exchangeRate) {
      const tryPrice = parseFloat(convertUsdToTry(usdPrice, exchangeRate.sellRate))
      const psychTryPrice = toPsychologicalPrice(tryPrice)
      return `₺${psychTryPrice.toFixed(2)}`
    }
    return `$${usdPrice.toFixed(2)}`
  }

  const handleGoToCheckout = () => {
    // Prepare cart with all necessary data
    const cartWithDetails = cart.map(item => ({
      ...item,
      sld: item.domain.split('.')[0],
      tld: item.domain.split('.').slice(1).join('.'),
      tryPrice: currency === 'TRY' && exchangeRate
        ? parseFloat(convertUsdToTry(item.price, exchangeRate.sellRate))
        : null
    }))

    // Determine path based on current route
    const checkoutPath = location.pathname.startsWith('/admin')
      ? '/admin/domain-checkout'
      : '/domain-checkout'

    navigate(checkoutPath, {
      state: { cart: cartWithDetails, currency }
    })
  }

  return (
    <header className="border-b border-border bg-card px-6 flex items-center justify-between min-h-16 py-3">
      <div className="flex flex-col gap-2">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        {/* Shopping Cart */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 hover:bg-secondary rounded-md transition-colors">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              {cartCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartCount}
                </Badge>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel>Sepetim ({cartCount} domain)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Sepetiniz boş
                </div>
              ) : (
                cart.map((item) => (
                  <DropdownMenuItem
                    key={item.domain}
                    className="flex items-center justify-between p-3 cursor-default"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.domain}</p>
                      <p className="text-xs text-muted-foreground">1 yıl</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{formatPrice(item.price)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromCart(item.domain)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>
            {cart.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Toplam:</span>
                    <span className="text-lg font-bold">{formatPrice(cartTotal)}</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleGoToCheckout}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Ödemeye Geç
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
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
