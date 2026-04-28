import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MessageSquare, Phone, Mail, MapPin, ArrowRight, User } from 'lucide-react'
import { toast } from '@/lib/toast'
import Turnstile, { resetTurnstile } from '@/components/Turnstile'
import { capiContact } from '@/lib/metaCapi'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: 'sales',
    message: '',
  })
  const [turnstileToken, setTurnstileToken] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!turnstileToken) {
      toast.error('Lütfen güvenlik doğrulamasını tamamlayın')
      return
    }
    toast.success('Mesajınız gönderildi', {
      description: 'En kısa sürede sizinle iletişime geçeceğiz.',
    })
    capiContact({ email: formData.email, firstName: formData.firstName, lastName: formData.lastName })
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      department: 'sales',
      message: '',
    })
    resetTurnstile()
    setTurnstileToken('')
  }

  return (
    <section id="iletisim" className="py-24 bg-slate-950">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Left: Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">Bize Mesaj Gönderin</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-slate-300">Ad</Label>
                    <Input
                      id="firstName"
                      placeholder="Adınız"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-slate-300">Soyad</Label>
                    <Input
                      id="lastName"
                      placeholder="Soyadınız"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-slate-300">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@mail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Departman</Label>
                  <RadioGroup
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sales" id="sales" />
                      <Label htmlFor="sales" className="cursor-pointer font-normal text-slate-300">Satış</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="technical" id="technical" />
                      <Label htmlFor="technical" className="cursor-pointer font-normal text-slate-300">Teknik</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="billing" id="billing" />
                      <Label htmlFor="billing" className="cursor-pointer font-normal text-slate-300">Muhasebe</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="message" className="text-slate-300">Mesajınız</Label>
                  <Textarea
                    id="message"
                    placeholder="Size nasıl yardımcı olabiliriz?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                </div>

                <Turnstile onVerify={setTurnstileToken} theme="dark" />

                <p className="text-xs text-slate-500">
                  Formu göndererek, kişisel verilerinizin talebinizin değerlendirilmesi amacıyla işlenmesini kabul etmiş olursunuz.
                  Detaylı bilgi için{' '}
                  <a href="/kvkk" target="_blank" className="text-indigo-400 hover:text-indigo-300 underline">
                    KVKK Aydınlatma Metni
                  </a>'ni inceleyiniz.
                </p>

                <Button type="submit" size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white" disabled={!turnstileToken}>
                  Mesaj Gönder
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>
            </div>
          </div>

          {/* Right: Contact Info (BTK Uyumlu) */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">İletişim</h3>
              <p className="text-sm text-slate-400">
                Aşağıdaki bilgilerden bize doğrudan ulaşabilirsiniz.
              </p>
            </div>

            {/* Yetkili Bilgileri - BTK Zorunlu */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Yetkili</h4>
                  <p className="text-sm text-slate-400 mt-0.5">Enes POYRAZ</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Açık Posta Adresi</h4>
                  <p className="text-sm text-slate-400 mt-0.5">Cumhuriyet Mah. Başak Sk. Yükselen Park Nilüfer St. H Blok Kat:7 D:18 Nilüfer/Bursa</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Elektronik İletişim Adresi</h4>
                  <a href="mailto:enespoyraz380@gmail.com" className="text-sm text-indigo-400 hover:text-indigo-300 mt-0.5 block">enespoyraz380@gmail.com</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Telefon Numarası</h4>
                  <a href="tel:+905467805972" className="text-sm text-indigo-400 hover:text-indigo-300 mt-0.5 block">0546 780 59 72</a>
                </div>
              </div>
            </div>

            {/* Destek Kanalları */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/30 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-indigo-400" />
              </div>
              <h4 className="font-semibold text-white mb-1">Destek Talebi</h4>
              <p className="text-sm text-slate-400 mb-3">
                Müşteri panelinizden destek talebi açarak teknik ekibimize ulaşabilirsiniz.
              </p>
              <a
                href="/login"
                className="text-indigo-400 text-sm font-medium inline-flex items-center gap-1 hover:underline"
              >
                Panele Git <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
