import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, ShoppingCart, Check, X, Loader2, Globe, Star, DollarSign, TrendingUp } from 'lucide-react'
import { useDomainSearch, useDomainPricing } from '@/hooks/useDomainSearch'
import { useExchangeRate } from '@/hooks/useCurrency'
import { convertUsdToTry } from '@/lib/api/currency'
import { useCart } from '@/contexts/CartContext'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function DomainSearch() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExtensions, setSelectedExtensions] = useState(['com', 'net', 'org'])
  const [searchResults, setSearchResults] = useState([])
  const { cart, currency, setCurrency, addToCart, removeFromCart, isInCart, cartTotal } = useCart()

  const PROFIT_MARGIN_PERCENT = 10 // %10 kar marjı

  const domainSearch = useDomainSearch()
  const { data: pricing, isLoading: pricingLoading } = useDomainPricing()
  const { data: exchangeRate, isLoading: exchangeRateLoading } = useExchangeRate()

  // Psychological pricing: round to .99 (e.g., 801 → 799.99)
  const toPsychologicalPrice = (price) => {
    if (price <= 0) return 0

    // Round up to nearest integer, then subtract 0.01 to get .99
    const rounded = Math.ceil(price)
    return rounded - 0.01
  }

  // Add profit margin to pricing
  const pricingWithMargin = pricing?.map(p => {
    if (p.price <= 0) return { ...p, price: 0 }

    const priceWithMargin = p.price * (1 + PROFIT_MARGIN_PERCENT / 100)
    const psychPrice = toPsychologicalPrice(priceWithMargin)

    return {
      ...p,
      price: psychPrice
    }
  }) || []

  const popularExtensions = pricingWithMargin.filter(t => ['com', 'net', 'org', 'co', 'io', 'com.tr', 'ai'].includes(t.extension))
  const allExtensions = pricingWithMargin

  // Format price based on selected currency
  const formatPrice = (usdPrice) => {
    if (currency === 'TRY' && exchangeRate) {
      const tryPrice = parseFloat(convertUsdToTry(usdPrice, exchangeRate.sellRate))
      // Apply psychological pricing to TRY as well
      const psychTryPrice = toPsychologicalPrice(tryPrice)
      return `₺${psychTryPrice.toFixed(2)}`
    }
    return `$${usdPrice.toFixed(2)}`
  }

  // Get current exchange rate for display
  const currentRate = exchangeRate?.sellRate || 34.55

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Lütfen domain adı girin')
      return
    }

    // Remove extension if user typed it
    const cleanDomain = searchTerm.replace(/\.(com|net|org|io|co|tr|app|dev|ai)$/i, '').toLowerCase()

    try {
      const results = await domainSearch.mutateAsync({
        domains: [cleanDomain],
        extensions: selectedExtensions,
        period: 1,
      })

      // Merge pricing data with results (profit margin already added)
      const resultsWithPricing = results.map(result => {
        const pricingInfo = pricingWithMargin?.find(p => p.tld === result.tld || p.extension === result.tld)
        return {
          ...result,
          price: pricingInfo?.price || 0,
          currency: pricingInfo?.currency || 'USD'
        }
      })

      setSearchResults(resultsWithPricing)

      if (resultsWithPricing.every(r => !r.available)) {
        toast.error('Aradığınız domainler müsait değil', {
          description: 'Farklı uzantılar deneyin'
        })
      } else {
        toast.success('Sorgulama tamamlandı', {
          description: `${resultsWithPricing.filter(r => r.available).length} domain müsait`
        })
      }
    } catch (error) {
      toast.error('Domain sorgulanamadı', {
        description: error.message
      })
    }
  }

  const toggleExtension = (ext) => {
    setSelectedExtensions(prev =>
      prev.includes(ext)
        ? prev.filter(e => e !== ext)
        : [...prev, ext]
    )
  }

  const handleAddToCart = (result) => {
    if (isInCart(result.domain)) {
      toast.error('Bu domain sepette zaten var')
      return
    }

    // Add tryPrice for TRY currency
    const itemWithPricing = {
      ...result,
      tryPrice: currency === 'TRY' && exchangeRate
        ? parseFloat(convertUsdToTry(result.price, exchangeRate.sellRate))
        : null
    }

    addToCart(itemWithPricing)
    toast.success('Sepete eklendi', {
      description: result.domain
    })
  }

  const handleRemoveFromCart = (domain) => {
    removeFromCart(domain)
    toast.success('Sepetten çıkarıldı')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Domain Arama
          </h1>
          <p className="text-muted-foreground mt-1">
            Mükemmel domain adınızı bulun ve hemen kaydedin
          </p>
        </div>

        {/* Currency Toggle */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={currency === 'USD' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrency('USD')}
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            USD
          </Button>
          <Button
            variant={currency === 'TRY' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrency('TRY')}
            className="gap-2"
          >
            ₺ TRY
          </Button>
        </div>
      </div>

      {/* Exchange Rate Info */}
      {currency === 'TRY' && exchangeRate && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Güncel Döviz Kuru (USD/TRY):</span>
              <span className="font-bold text-blue-600">₺{currentRate.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Fiyatlara %0.5 spread eklendi (Alış: ₺{exchangeRate.buyRate.toFixed(2)} / Satış: ₺{exchangeRate.sellRate.toFixed(2)})
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Box */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Sorgulama</CardTitle>
          <CardDescription>
            Domain adınızı girin, müsaitliğini ve fiyatını kontrol edin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Domain adını girin (örn: sirketiniz)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pr-10"
              />
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <Button
              onClick={handleSearch}
              disabled={domainSearch.isPending || !searchTerm.trim()}
              className="min-w-[120px]"
            >
              {domainSearch.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sorgulanıyor...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Sorgula
                </>
              )}
            </Button>
          </div>

          {/* Extension Selection */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Popüler Uzantılar:</p>
            <div className="flex flex-wrap gap-2">
              {popularExtensions.map((tld) => (
                <Badge
                  key={tld.extension}
                  variant={selectedExtensions.includes(tld.extension) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80 gap-2 px-3 py-1"
                  onClick={() => toggleExtension(tld.extension)}
                >
                  <Checkbox
                    checked={selectedExtensions.includes(tld.extension)}
                    className="h-3 w-3"
                  />
                  .{tld.extension}
                  <span className="text-xs">{formatPrice(tld.price)}</span>
                </Badge>
              ))}
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Tüm uzantıları göster ({allExtensions.length})
              </summary>
              <div className="flex flex-wrap gap-2 mt-3">
                {allExtensions.filter(t => !popularExtensions.includes(t)).map((tld) => (
                  <Badge
                    key={tld.extension}
                    variant={selectedExtensions.includes(tld.extension) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/80 gap-2 px-3 py-1"
                    onClick={() => toggleExtension(tld.extension)}
                  >
                    <Checkbox
                      checked={selectedExtensions.includes(tld.extension)}
                      className="h-3 w-3"
                    />
                    .{tld.extension}
                    <span className="text-xs">{formatPrice(tld.price)}</span>
                  </Badge>
                ))}
              </div>
            </details>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sonuçlar</CardTitle>
            <CardDescription>
              {searchResults.filter(r => r.available).length} müsait, {searchResults.filter(r => !r.available).length} kayıtlı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.domain}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg transition-colors",
                    result.available
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                      : "bg-muted/50 border-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {result.available ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-semibold">{result.domain}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.available ? 'Müsait' : 'Kayıtlı'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {result.available && (
                      <>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatPrice(result.price)}</p>
                          <p className="text-xs text-muted-foreground">/yıl</p>
                        </div>
                        <Button
                          onClick={() => handleAddToCart(result)}
                          disabled={isInCart(result.domain)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {isInCart(result.domain) ? 'Sepette' : 'Sepete Ekle'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shopping Cart */}
      {cart.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sepet ({cart.length} domain)
            </CardTitle>
            <CardDescription>
              Toplam: {formatPrice(cartTotal)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.domain}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.domain}</p>
                    <p className="text-sm text-muted-foreground">1 yıl</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold">{formatPrice(item.price)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromCart(item.domain)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Toplam (1 yıl)</p>
                <p className="text-2xl font-bold">{formatPrice(cartTotal)}</p>
              </div>
              <Button
                size="lg"
                onClick={() => {
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
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Ödemeye Geç
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
