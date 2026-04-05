import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { ArrowUpDown, Check } from 'lucide-react'

export default function PackageUpgradeDialog({ hostingId, currentPackageId, open, onClose }) {
  const [packages, setPackages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPackageId, setSelectedPackageId] = useState(null)

  useEffect(() => {
    if (open) {
      fetchPackages()
    }
  }, [open])

  const fetchPackages = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('hosting_packages')
      .select('*')
      .order('monthly_price', { ascending: true })

    if (error) {
      toast.error('Paketler yüklenemedi', { description: error.message })
    } else {
      setPackages(data || [])
    }
    setIsLoading(false)
  }

  const currentPackage = packages.find(p => p.id === currentPackageId)

  const getPriceDifference = (pkg) => {
    if (!currentPackage) return null
    const currentPrice = currentPackage.monthly_price || 0
    const newPrice = pkg.monthly_price || 0
    const diff = newPrice - currentPrice
    if (diff === 0) return null
    return diff
  }

  const handleChangePackage = () => {
    if (!selectedPackageId || selectedPackageId === currentPackageId) return
    toast.success('Paket değiştirme talebi oluşturuldu', {
      description: 'Talebiniz en kısa sürede işleme alınacaktır',
    })
    onClose()
  }

  const formatCurrency = (amount) => {
    if (amount == null) return '-'
    return `${Number(amount).toFixed(2)} TL`
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Paket Değiştir
          </DialogTitle>
          <DialogDescription>
            Mevcut paketinizi yükseltebilir veya düşürebilirsiniz
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">Paketler yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => {
              const isCurrent = pkg.id === currentPackageId
              const isSelected = pkg.id === selectedPackageId
              const priceDiff = getPriceDifference(pkg)

              return (
                <Card
                  key={pkg.id}
                  className={`cursor-pointer transition-all ${
                    isCurrent
                      ? 'border-primary bg-primary/5'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-muted-foreground/30'
                  }`}
                  onClick={() => {
                    if (!isCurrent) setSelectedPackageId(pkg.id)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{pkg.name || pkg.package_name}</span>
                          {isCurrent && (
                            <Badge variant="default">Mevcut Paket</Badge>
                          )}
                          {isSelected && !isCurrent && (
                            <Badge className="bg-blue-500">Seçili</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                          {pkg.disk_space_gb && (
                            <span>Disk: {pkg.disk_space_gb} GB</span>
                          )}
                          {pkg.bandwidth_gb != null && (
                            <span>Bant Genişliği: {pkg.bandwidth_gb > 0 ? `${pkg.bandwidth_gb} GB` : 'Sınırsız'}</span>
                          )}
                          {pkg.email_accounts != null && (
                            <span>E-posta: {pkg.email_accounts}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {formatCurrency(pkg.monthly_price)}
                          <span className="text-sm font-normal text-muted-foreground">/ay</span>
                        </div>
                        {priceDiff !== null && !isCurrent && (
                          <div className={`text-sm ${priceDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)} fark
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {packages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Uygun paket bulunamadı
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button
                onClick={handleChangePackage}
                disabled={!selectedPackageId || selectedPackageId === currentPackageId}
              >
                <Check className="h-4 w-4 mr-2" />
                Paket Değiştir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
