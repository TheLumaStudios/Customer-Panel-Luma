import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, CreditCard, Globe, User, Mail, Phone, MapPin, Building, Loader2, ArrowLeft, Check } from 'lucide-react'
import { useCreateSelfInvoice, useInitializeIyzicoPayment } from '@/hooks/useInvoices'
import IyzicoPaymentDialog from '@/components/payments/IyzicoPaymentDialog'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function DomainCheckout() {
  const navigate = useNavigate()
  const location = useLocation()
  const cart = location.state?.cart || []
  const currency = location.state?.currency || 'USD'

  const [contacts, setContacts] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'TR',
    organization: '',
  })

  const [nameservers, setNameservers] = useState([
    'ns1.thelumastudios.com',
    'ns2.thelumastudios.com'
  ])

  const createSelfInvoice = useCreateSelfInvoice()
  const initializeIyzico = useInitializeIyzicoPayment()
  const isPaying = createSelfInvoice.isPending || initializeIyzico.isPending

  const [iyzicoOpen, setIyzicoOpen] = useState(false)
  const [iyzicoContent, setIyzicoContent] = useState('')
  const [iyzicoUrl, setIyzicoUrl] = useState('')

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0)

  // Psychological pricing: round to .99 (e.g., 801 → 799.99)
  const toPsychologicalPrice = (price) => {
    if (price <= 0) return 0
    const rounded = Math.ceil(price)
    return rounded - 0.01
  }

  // Format price for display with psychological pricing
  const formatDisplayPrice = (item) => {
    if (currency === 'TRY' && item.tryPrice) {
      const psychPrice = toPsychologicalPrice(item.tryPrice)
      return `₺${psychPrice.toFixed(2)}`
    }
    return `$${item.price.toFixed(2)}`
  }

  const getTotalPrice = () => {
    if (currency === 'TRY') {
      const total = cart.reduce((sum, item) => {
        const psychPrice = item.tryPrice ? toPsychologicalPrice(item.tryPrice) : item.price
        return sum + psychPrice
      }, 0)
      return `₺${total.toFixed(2)}`
    }
    return `$${totalPrice.toFixed(2)}`
  }

  const handleInputChange = (e) => {
    setContacts({
      ...contacts,
      [e.target.name]: e.target.value
    })
  }

  const handleCheckout = async () => {
    // Validate form
    if (!contacts.firstName || !contacts.lastName || !contacts.email || !contacts.phone) {
      toast.error('Lütfen tüm zorunlu alanları doldurun', {
        description: 'Ad, soyad, email ve telefon gerekli'
      })
      return
    }

    try {
// Resolve TRY unit price per domain (psychological TRY price if available,
// otherwise a simple USD→TRY assumption handled server-side would be
// preferable; for now trust what the landing page displayed).
      const items = cart.map(item => ({
        type: 'domain',
        description: `${item.domain} — ${item.period || 1} yıl`,
        quantity: 1,
        unit_price: Number(
          (currency === 'TRY' && item.tryPrice)
            ? toPsychologicalPrice(item.tryPrice)
// Fallback: approximate USD→TRY at 1:34 so the invoice is in TRY.
// The reseller is paid separately at registration time.
            : (item.price * 34)
        ).toFixed(2),
      }))

// Create self-service invoice. `notes_json` carries the contact + NS
// snapshot that payment-iyzico-callback will use to trigger reseller
// registration AFTER the payment clears.
      const invoice = await createSelfInvoice.mutateAsync({
        items,
        notes_json: {
          contacts,
          nameservers,
          domains: cart.map(item => ({
            sld: item.sld,
            tld: item.tld,
            period: item.period || 1,
          })),
        },
      })

      const result = await initializeIyzico.mutateAsync({
        invoice_id: invoice.id,
        return_url: `${window.location.origin}/payment-success`,
      })

      setIyzicoContent(result.checkoutFormContent || '')
      setIyzicoUrl(result.paymentPageUrl || '')
      setIyzicoOpen(true)
    } catch (error) {
      toast.error('Sipariş oluşturulamadı', {
        description: error.message
      })
    }
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Sepetiniz Boş</h2>
        <p className="text-muted-foreground">Domain aramaya başlayın!</p>
        <Button onClick={() => navigate('/admin/domain-search')}>
          <Globe className="h-4 w-4 mr-2" />
          Domain Ara
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Domain Sipariş
          </h1>
          <p className="text-muted-foreground mt-1">
            Sipariş bilgilerinizi tamamlayın
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sipariş Özeti</CardTitle>
              <CardDescription>{cart.length} domain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.domain}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.domain}</p>
                    <p className="text-xs text-muted-foreground">1 yıl</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {formatDisplayPrice(item)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Toplam:</span>
                  <span className="text-2xl font-bold">
                    {getTotalPrice()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                İletişim Bilgileri
              </CardTitle>
              <CardDescription>
                Domain kaydı için gerekli bilgiler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Ad <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="firstName"
                    placeholder="Adınız"
                    value={contacts.firstName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Soyad <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="lastName"
                    placeholder="Soyadınız"
                    value={contacts.lastName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={contacts.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Telefon <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="+90 555 123 4567"
                    value={contacts.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Organizasyon</label>
                  <Input
                    name="organization"
                    placeholder="Şirket adı (opsiyonel)"
                    value={contacts.organization}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Adres</label>
                  <Input
                    name="address"
                    placeholder="Sokak, No, vb."
                    value={contacts.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Şehir</label>
                  <Input
                    name="city"
                    placeholder="İstanbul"
                    value={contacts.city}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">İlçe/Bölge</label>
                  <Input
                    name="state"
                    placeholder="Kadıköy"
                    value={contacts.state}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Posta Kodu</label>
                  <Input
                    name="postalCode"
                    placeholder="34000"
                    value={contacts.postalCode}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ülke</label>
                  <Input
                    name="country"
                    placeholder="TR"
                    value={contacts.country}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Name Server Ayarları
              </CardTitle>
              <CardDescription>
                Domain için kullanılacak name serverlar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">NS1</label>
                  <Input
                    value={nameservers[0]}
                    onChange={(e) => setNameservers([e.target.value, nameservers[1]])}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">NS2</label>
                  <Input
                    value={nameservers[1]}
                    onChange={(e) => setNameservers([nameservers[0], e.target.value])}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Varsayılan name serverlarımızı kullanabilir veya kendi name serverlarınızı girebilirsiniz
              </p>
            </CardContent>
          </Card>

          {/* Checkout Button */}
          <Card className="bg-primary/5 border-primary">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ödenecek Tutar</p>
                  <p className="text-3xl font-bold">
                    {getTotalPrice()}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isPaying}
                  className="min-w-[200px]"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Ödemeye Geç
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <IyzicoPaymentDialog
        open={iyzicoOpen}
        onOpenChange={setIyzicoOpen}
        paymentPageUrl={iyzicoUrl}
        htmlContent={iyzicoContent}
      />
    </div>
  )
}
