import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Trash2, X, ArrowRight, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCheckoutStore } from '@/stores/checkoutStore'

const formatPrice = (price) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(price)

export default function CartDropdown() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const store = useCheckoutStore()
  const itemCount = store.items.length

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cart Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Sepet"
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white leading-none px-1">
            {itemCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[360px] animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-indigo-400" />
                Sepetim
                {itemCount > 0 && (
                  <span className="text-xs text-slate-400">({itemCount} ürün)</span>
                )}
              </h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            <div className="max-h-[320px] overflow-y-auto">
              {itemCount === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Package className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Sepetiniz boş</p>
                  <p className="text-xs text-slate-500 mt-1">Ürün sayfalarından sepete ekleyebilirsiniz</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {store.items.map((item) => (
                    <div key={item.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-800/30 transition-colors">
                      {/* Icon */}
                      <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Package className="h-4 w-4 text-indigo-400" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{item.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.product_type === 'vps' && 'VPS Sunucu'}
                          {item.product_type === 'vds' && 'VDS Sunucu'}
                          {item.product_type === 'hosting' && 'Web Hosting'}
                          {item.product_type === 'dedicated' && 'Dedicated Sunucu'}
                          {!['vps', 'vds', 'hosting', 'dedicated'].includes(item.product_type) && (item.product_type || 'Hizmet')}
                        </div>
                      </div>

                      {/* Price & Remove */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-white">{formatPrice(item.price_monthly)}₺</div>
                        <button
                          onClick={() => store.removeItem(item.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors mt-0.5"
                          title="Kaldır"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {itemCount > 0 && (
              <div className="border-t border-slate-800 px-5 py-4 space-y-3">
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Toplam</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">{formatPrice(store.getSubtotal())}₺</span>
                    <span className="text-xs text-slate-500 ml-1">/ay +KDV</span>
                  </div>
                </div>

                {/* Checkout button */}
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-500 h-10"
                  onClick={() => setOpen(false)}
                  asChild
                >
                  <Link to="/checkout">
                    Ödemeye Geç
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
