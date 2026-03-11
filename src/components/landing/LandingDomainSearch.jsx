import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, Check, X, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useDomainSearch, useDomainPricing } from '@/hooks/useDomainSearch'
import { useExchangeRate } from '@/hooks/useCurrency'
import { convertUsdToTry } from '@/lib/api/currency'
import { useCart } from '@/contexts/CartContext'
import { toast } from '@/lib/toast'
import { useAuth } from '@/hooks/useAuth.jsx'

export default function LandingDomainSearch() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExtension, setSelectedExtension] = useState('com')
  const [searchResults, setSearchResults] = useState([])
  const { currency, addToCart, isInCart } = useCart()

  const PROFIT_MARGIN_PERCENT = 10
  const domainSearch = useDomainSearch()
  const { data: pricing } = useDomainPricing()
  const { data: exchangeRate } = useExchangeRate()

  // Psychological pricing
  const toPsychologicalPrice = (price) => {
    if (price <= 0) return 0
    const rounded = Math.ceil(price)
    return rounded - 0.01
  }

  // Add profit margin to pricing
  const pricingWithMargin = pricing?.map(p => {
    if (p.price <= 0) return { ...p, price: 0 }
    const priceWithMargin = p.price * (1 + PROFIT_MARGIN_PERCENT / 100)
    const psychPrice = toPsychologicalPrice(priceWithMargin)
    return { ...p, price: psychPrice }
  }) || []

  const popularExtensions = ['com', 'net', 'org']

  // Format price based on currency
  const formatPrice = (usdPrice) => {
    if (currency === 'TRY' && exchangeRate) {
      const tryPrice = parseFloat(convertUsdToTry(usdPrice, exchangeRate.sellRate))
      const psychTryPrice = toPsychologicalPrice(tryPrice)
      return `₺${psychTryPrice.toFixed(2)}`
    }
    return `$${usdPrice.toFixed(2)}`
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Lütfen domain adı girin')
      return
    }

    const cleanDomain = searchTerm.replace(/\.(com|net|org|io|co|tr|app|dev|ai)$/i, '').toLowerCase()

    try {
      const results = await domainSearch.mutateAsync({
        domains: [cleanDomain],
        extensions: [selectedExtension],
        period: 1,
      })

      // Merge pricing data with results
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
        toast.error('Domain müsait değil', {
          description: 'Farklı uzantı deneyin'
        })
      }
    } catch (error) {
      toast.error('Domain sorgulanamadı', {
        description: error.message
      })
    }
  }

  const handleAddToCart = (result) => {
    // If not logged in, redirect to register
    if (!user) {
      navigate('/register')
      return
    }

    if (isInCart(result.domain)) {
      toast.error('Bu domain sepette zaten var')
      return
    }

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

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Search Box */}
      <div className="p-6 bg-card rounded-lg border-2 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Domain adınızı girin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              .{selectedExtension}
            </span>
          </div>
          <Button
            size="lg"
            onClick={handleSearch}
            disabled={domainSearch.isPending || !searchTerm.trim()}
            className="min-w-[140px]"
          >
            {domainSearch.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sorgulanıyor
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Ara
              </>
            )}
          </Button>
        </div>

        {/* Extension Badges */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">Popüler uzantılar:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {popularExtensions.map((ext) => {
              const extPricing = pricingWithMargin?.find(p => p.extension === ext)
              return (
                <Badge
                  key={ext}
                  variant={selectedExtension === ext ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80 px-3 py-1.5 text-sm"
                  onClick={() => setSelectedExtension(ext)}
                >
                  .{ext} {extPricing && `- ${formatPrice(extPricing.price)}`}
                </Badge>
              )
            })}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((result) => (
            <div
              key={result.domain}
              className="p-4 bg-card rounded-lg border-2 flex items-center justify-between hover:shadow-md hover:border-primary transition-all"
            >
              <div className="flex items-center gap-3">
                {result.available ? (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">
                    <X className="h-5 w-5 text-destructive" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{result.domain}</p>
                  {result.available ? (
                    <p className="text-sm text-primary">Müsait</p>
                  ) : (
                    <p className="text-sm text-destructive">Kayıtlı</p>
                  )}
                </div>
              </div>

              {result.available && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatPrice(result.price)}</p>
                    <p className="text-xs text-muted-foreground">/ yıl</p>
                  </div>
                  <Button
                    onClick={() => handleAddToCart(result)}
                    size="sm"
                    disabled={isInCart(result.domain)}
                  >
                    {isInCart(result.domain) ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Sepette
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Sepete Ekle
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
