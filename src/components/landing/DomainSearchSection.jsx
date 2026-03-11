import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { useDomainSearch, useDomainPricing } from '@/hooks/useDomainSearch'
import { useExchangeRate } from '@/hooks/useCurrency'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/contexts/CartContext'
import { toast } from '@/lib/toast'

export default function DomainSearchSection() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExtension, setSelectedExtension] = useState('com')
  const [searchResults, setSearchResults] = useState([])
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currency, addToCart, isInCart } = useCart()

  const domainSearch = useDomainSearch()
  const { data: pricing } = useDomainPricing()
  const { data: exchangeRate } = useExchangeRate()

  const PROFIT_MARGIN_PERCENT = 10

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

  const popularExtensions = ['com', 'net', 'org', 'io']

  // Format price based on currency
  const formatPrice = (usdPrice) => {
    if (currency === 'TRY' && exchangeRate?.sellRate) {
      const tryPrice = usdPrice * exchangeRate.sellRate
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
      tryPrice: currency === 'TRY' && exchangeRate?.sellRate
        ? result.price * exchangeRate.sellRate
        : null
    }

    addToCart(itemWithPricing)
    toast.success('Sepete eklendi', {
      description: result.domain
    })
  }

  return (
    <section className="py-16 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Mükemmel Domaininizi Bulun</h2>
            <p className="text-muted-foreground">Domain adınızı arayın ve hemen satın alın</p>
          </div>

          {/* Search Input */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 flex items-center gap-2 border border-border rounded-lg px-4 py-3 bg-input focus-within:ring-2 focus-within:ring-ring">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="example.com"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button size="lg" onClick={handleSearch} disabled={domainSearch.isPending} className="px-8">
              {domainSearch.isPending ? 'Aranıyor...' : 'Ara'}
            </Button>
          </div>

          {/* Popular Extensions */}
          <div className="flex flex-wrap gap-3 justify-center">
            {popularExtensions.map((ext) => {
              const extPricing = pricingWithMargin?.find(p => p.extension === ext)
              return (
                <Badge
                  key={ext}
                  variant={selectedExtension === ext ? 'default' : 'secondary'}
                  className="px-4 py-2 text-sm font-medium cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSelectedExtension(ext)}
                >
                  .{ext} {extPricing && `- ${formatPrice(extPricing.price)}/yıl`}
                </Badge>
              )
            })}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6 space-y-3">
              {searchResults.map((result) => (
                <div
                  key={result.domain}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary transition-colors"
                >
                  <div>
                    <div className="font-semibold">{result.domain}</div>
                    <div className="text-sm text-muted-foreground">
                      {result.available ? (
                        <span className="text-primary">Müsait</span>
                      ) : (
                        <span className="text-destructive">Alınmış</span>
                      )}
                    </div>
                  </div>
                  {result.available && (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">{formatPrice(result.price)}</div>
                        <div className="text-xs text-muted-foreground">/yıl</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(result)}
                        disabled={isInCart(result.domain)}
                      >
                        {isInCart(result.domain) ? 'Sepette' : 'Sepete Ekle'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
