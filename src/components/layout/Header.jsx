import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Check, X, ShoppingCart, Trash2, Code, Server, Landmark, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
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
import { useCustomerView } from '@/contexts/CustomerViewContext'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useExchangeRate } from '@/hooks/useCurrency'
import { convertUsdToTry } from '@/lib/api/currency'
import Breadcrumbs from './Breadcrumbs'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, cartCount, cartTotal, currency, removeFromCart } = useCart()
  const { data: exchangeRate } = useExchangeRate()
  const { viewMode, changeView } = useCustomerView()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'employee'

  // Admin notifications — sadece admin/employee için gerçek DB'den
  const [notifications, setNotifications] = useState([])

  const fetchNotifications = useCallback(async () => {
    if (!isAdmin) return
    const { data } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setNotifications(data)
  }, [isAdmin])

  useEffect(() => {
    fetchNotifications()
    if (!isAdmin) return
    // Gerçek zamanlı yeni bildirimler
    const channel = supabase
      .channel('admin_notifications_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, () => {
        fetchNotifications()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [isAdmin, fetchNotifications])

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('admin_notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const dismissNotification = async (e, id) => {
    e.stopPropagation()
    await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const notifIcon = (type) => {
    if (type === 'bank_transfer') return <Landmark className="h-3.5 w-3.5 text-amber-400" />
    return <Bell className="h-3.5 w-3.5 text-indigo-400" />
  }

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

        {/* Ödeme Yöntemleri kısayolu - sadece admin */}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin/payment-methods')}
            className="p-2 hover:bg-secondary rounded-md transition-colors"
            title="Ödeme Yöntemleri"
          >
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

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
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={markAllRead}>
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
                    className={`flex-col items-start p-3 cursor-pointer ${!notification.is_read ? 'bg-amber-500/5' : ''}`}
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {notifIcon(notification.type)}
                          <span className="font-medium text-sm">{notification.title}</span>
                          {!notification.is_read && (
                            <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={(e) => dismissNotification(e, notification.id)}
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
                <DropdownMenuItem className="text-center text-sm text-primary cursor-pointer" onClick={markAllRead}>
                  Tümünü Okundu İşaretle
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Customer View Switcher - Admin/Employee only */}
        {isAdmin && (
          <div className="flex items-center bg-muted rounded-lg p-0.5 ml-1">
            <button
              onClick={() => changeView('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'all'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => changeView('software')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'software'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code className="h-3 w-3" />
              Yazılım
            </button>
            <button
              onClick={() => changeView('host')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'host'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Server className="h-3 w-3" />
              Host
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
