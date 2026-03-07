import { useState } from 'react'
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from '@/hooks/useAddresses'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Edit2, Trash2, Star, MapPin, Building2, Home } from 'lucide-react'
import { toast } from '@/lib/toast'

export default function AddressManager({ customerId }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [formData, setFormData] = useState({
    type: 'billing',
    label: '',
    contact_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Turkey',
    tax_office: '',
    tax_number: '',
    identity_number: '',
    is_default: false,
  })

  const { data: addresses = [], isLoading } = useAddresses(customerId)
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const setDefaultAddress = useSetDefaultAddress()

  const handleOpenDialog = (address = null) => {
    if (address) {
      setEditingAddress(address)
      setFormData(address)
    } else {
      setEditingAddress(null)
      setFormData({
        type: 'billing',
        label: '',
        contact_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Turkey',
        tax_office: '',
        tax_number: '',
        identity_number: '',
        is_default: false,
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingAddress) {
        await updateAddress.mutateAsync({
          id: editingAddress.id,
          ...formData,
        })
        toast.success('Adres güncellendi')
      } else {
        await createAddress.mutateAsync(formData)
        toast.success('Adres eklendi')
      }
      setDialogOpen(false)
    } catch (error) {
      toast.error('Hata', {
        description: error.message,
      })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) return

    try {
      await deleteAddress.mutateAsync(id)
      toast.success('Adres silindi')
    } catch (error) {
      toast.error('Hata', {
        description: error.message,
      })
    }
  }

  const handleSetDefault = async (id, type) => {
    try {
      await setDefaultAddress.mutateAsync({ id, type })
      toast.success('Varsayılan adres güncellendi')
    } catch (error) {
      toast.error('Hata', {
        description: error.message,
      })
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'billing':
        return <Building2 className="h-4 w-4" />
      case 'shipping':
        return <Home className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type) => {
    const config = {
      billing: { label: 'Fatura', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      shipping: { label: 'Teslimat', className: 'bg-green-100 text-green-800 border-green-200' },
      other: { label: 'Diğer', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    }
    const { label, className } = config[type] || config.other
    return <Badge variant="outline" className={className}>{label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Adreslerim</h3>
          <p className="text-sm text-muted-foreground">
            Fatura ve teslimat adreslerinizi yönetin
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Adres
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="font-medium">Henüz adres eklemediniz</p>
            <p className="text-sm text-muted-foreground mt-1">
              Fatura ve teslimat için adres ekleyin
            </p>
            <Button onClick={() => handleOpenDialog()} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              İlk Adresi Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_default ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(address.type)}
                    <div>
                      <CardTitle className="text-base">
                        {address.label || 'Adres'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {getTypeBadge(address.type)}
                        {address.is_default && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            <Star className="h-3 w-3 mr-1" />
                            Varsayılan
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(address)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-medium">{address.contact_name}</p>
                  {address.phone && (
                    <p className="text-sm text-muted-foreground">{address.phone}</p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{address.address_line1}</p>
                  {address.address_line2 && <p>{address.address_line2}</p>}
                  <p>
                    {address.city}, {address.postal_code}
                  </p>
                  <p>{address.country}</p>
                </div>
                {(address.tax_office || address.tax_number) && (
                  <div className="pt-2 border-t text-sm">
                    {address.tax_office && (
                      <p className="text-muted-foreground">
                        Vergi Dairesi: {address.tax_office}
                      </p>
                    )}
                    {address.tax_number && (
                      <p className="text-muted-foreground">
                        Vergi No: {address.tax_number}
                      </p>
                    )}
                  </div>
                )}
                {!address.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleSetDefault(address.id, address.type)}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Varsayılan Yap
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Address Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
              </DialogTitle>
              <DialogDescription>
                Fatura veya teslimat adresi ekleyin
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Adres Tipi *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">Fatura Adresi</SelectItem>
                      <SelectItem value="shipping">Teslimat Adresi</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Adres Etiketi</Label>
                  <Input
                    id="label"
                    placeholder="Ev, İş, vb."
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">İletişim Adı *</Label>
                  <Input
                    id="contact_name"
                    required
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+90 555 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line1">Adres Satırı 1 *</Label>
                <Input
                  id="address_line1"
                  required
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line2">Adres Satırı 2</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Şehir *</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">İlçe</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">Posta Kodu *</Label>
                  <Input
                    id="postal_code"
                    required
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Ülke *</Label>
                <Input
                  id="country"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Fatura Bilgileri (Opsiyonel)</p>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_office">Vergi Dairesi</Label>
                    <Input
                      id="tax_office"
                      value={formData.tax_office}
                      onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tax_number">Vergi Numarası</Label>
                      <Input
                        id="tax_number"
                        value={formData.tax_number}
                        onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="identity_number">TC Kimlik No</Label>
                      <Input
                        id="identity_number"
                        maxLength={11}
                        value={formData.identity_number}
                        onChange={(e) => setFormData({ ...formData, identity_number: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_default" className="text-sm font-normal">
                  Bu adresi varsayılan adres olarak ayarla
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={createAddress.isPending || updateAddress.isPending}>
                {editingAddress ? 'Güncelle' : 'Ekle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
