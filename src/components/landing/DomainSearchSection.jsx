import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, CheckCircle2, XCircle, ShoppingCart, Globe } from 'lucide-react'
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

  const toPsychologicalPrice = (price) => {
    if (price <= 0) return 0
    const rounded = Math.ceil(price)
    return rounded - 0.01
  }

  const pricingWithMargin = pricing?.map(p => {
    if (p.price <= 0) return { ...p, price: 0 }
    const priceWithMargin = p.price * (1 + PROFIT_MARGIN_PERCENT / 100)
    const psychPrice = toPsychologicalPrice(priceWithMargin)
    return { ...p, price: psychPrice }
  }) || []

  const popularExtensions = [
    { ext: 'com', label: '.com' },
    { ext: 'net', label: '.net' },
    { ext: 'org', label: '.org' },
    { ext: 'io', label: '.io' },
    { ext: 'com.tr', label: '.com.tr' },
  ]

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

    const cleanDomain = searchTerm.replace(/\.(com|net|org|io|co|tr|app|dev|ai|com\.tr)$/i, '').toLowerCase()

    try {
      const results = await domainSearch.mutateAsync({
        domains: [cleanDomain],
        extensions: [selectedExtension],
        period: 1,
      })

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
        toast.error('Domain müsait değil', { description: 'Farklı uzantı deneyin' })
      }
    } catch (error) {
      toast.error('Domain sorgulanamadı', { description: error.message })
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
    toast.success('Sepete eklendi', { description: result.domain })
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-6">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Alan Adı Sorgula</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">
            Hayalinizdeki Domaini Bulun
          </h2>
          <p className="text-muted-foreground text-lg">
            500+ uzantı arasından markanıza en uygun alan adını arayın
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-lg">
          {/* Search Input */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 flex items-center gap-3 border border-border rounded-xl px-4 py-3.5 bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                type="text"
                placeholder="ornek.com"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="border-0 bg-transparent p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button
              size="lg"
              onClick={handleSearch}
              disabled={domainSearch.isPending}
              className="px-8 h-[52px] bg-indigo-600 hover:bg-indigo-500 shadow-sm rounded-xl"
            >
              {domainSearch.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Aranıyor
                </div>
              ) : 'Sorgula'}
            </Button>
          </div>

          {/* Extensions */}
          <div className="flex flex-wrap gap-2 justify-center">
            {popularExtensions.map(({ ext, label }) => {
              const extPricing = pricingWithMargin?.find(p => p.extension === ext)
              return (
                <button
                  key={ext}
                  onClick={() => setSelectedExtension(ext)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedExtension === ext
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {label}
                  {extPricing && (
                    <span className="ml-1.5 opacity-75">{formatPrice(extPricing.price)}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
            <div className="mt-6 space-y-3">
              {searchResults.map((result) => (
                <div
                  key={result.domain}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    result.available
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.available ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold">{result.domain}</div>
                      <div className="text-xs text-muted-foreground">
                        {result.available ? 'Bu domain müsait!' : 'Bu domain alınmış'}
                      </div>
                    </div>
                  </div>
                  {result.available && (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatPrice(result.price)}</div>
                        <div className="text-xs text-muted-foreground">/yıl</div>
                      </div>
                      <Button
                        onClick={() => handleAddToCart(result)}
                        disabled={isInCart(result.domain)}
                        className="bg-indigo-600 hover:bg-indigo-500"
                      >
                        {isInCart(result.domain) ? (
                          'Sepette'
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-1.5" />
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
      </div>
    </section>
  )
}
