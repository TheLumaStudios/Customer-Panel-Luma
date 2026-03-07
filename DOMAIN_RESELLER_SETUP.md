# Domain Reseller Sistemi - Kurulum Kılavuzu

## 🚀 Genel Bakış

Sisteminize **nodejs-dna** paketi ile entegre edilmiş tam özellikli domain satış modülü eklenmiştir.

### ✨ Özellikler

- ✅ **Domain Sorgulama**: Gerçek zamanlı müsaitlik kontrolü
- ✅ **Çoklu TLD Desteği**: .com, .net, .org, .tr, .io, .ai ve 100+ uzantı
- ✅ **Fiyatlandırma**: Dinamik fiyat listeleme
- ✅ **Sepet Sistemi**: Çoklu domain ekleme ve yönetim
- ✅ **Güzel UI**: Modern, responsive arama arayüzü
- ✅ **Hem Admin Hem Müşteri**: Her iki panel için erişim

---

## 📦 Kurulum Adımları

### 1. Supabase Edge Functions Deploy

Domain sorgulama ve kayıt işlemleri için 3 adet Supabase Edge Function oluşturulmuştur:

```bash
# Supabase CLI kurulu değilse
npm install -g supabase

# Supabase projenize login olun
supabase login

# Functions'ları deploy edin
supabase functions deploy domain-check
supabase functions deploy domain-pricing
supabase functions deploy domain-register
```

### 2. DomainNameAPI Credentials Ayarlama

Edge Functions'lar için API kimlik bilgilerinizi Supabase'de secret olarak kaydedin:

```bash
# Supabase Dashboard > Project Settings > Edge Functions > Secrets
# Veya CLI ile:

supabase secrets set DNA_USERNAME=your_username
supabase secrets set DNA_PASSWORD=your_password
```

**DomainNameAPI Hesabı Nasıl Alınır:**
1. https://www.domainnameapi.com/ adresine gidin
2. Reseller hesabı oluşturun
3. API erişim bilgilerinizi alın

### 3. Environment Variables (.env)

Frontend'de Supabase Functions URL'ini kullanmak için `.env` dosyanızda:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🎨 Kullanım

### Müşteri Paneli
1. Sol menüden **"Domain Ara"** seçeneğine tıklayın
2. Domain adını girin (örn: "sirketiniz")
3. İstediğiniz uzantıları seçin (.com, .net vb.)
4. **"Sorgula"** butonuna basın
5. Müsait domainleri sepete ekleyin
6. **"Ödemeye Geç"** ile satın alın

### Admin Paneli
- Aynı özellikler + müşteri adına domain kayıt

### Klavye Kısayolları
- **Cmd/Ctrl + K** → Domain arama sayfasına hızlı erişim
- **G + D + S** → Domain Search (navigation shortcut)

---

## 📁 Oluşturulan Dosyalar

### Backend (Supabase Edge Functions)
```
supabase/functions/
├── domain-check/index.ts       # Domain müsaitlik kontrolü
├── domain-pricing/index.ts     # TLD fiyat listesi
└── domain-register/index.ts    # Domain kayıt işlemi
```

### Frontend
```
src/
├── pages/
│   └── DomainSearch.jsx        # Domain arama sayfası
├── lib/api/
│   └── domainReseller.js       # API wrapper
└── hooks/
    └── useDomainSearch.js      # React Query hooks
```

---

## 🔧 API Fonksiyonları

### Domain Sorgulama
```javascript
import { checkDomainAvailability } from '@/lib/api/domainReseller'

const results = await checkDomainAvailability(
  ['example'],              // Domain adları
  ['com', 'net', 'org'],    // TLD uzantıları
  1                         // Kayıt süresi (yıl)
)

// Sonuç:
// [
//   { domain: 'example.com', available: true, price: 10.99, currency: 'USD' },
//   { domain: 'example.net', available: false, ... }
// ]
```

### Fiyat Listesi
```javascript
import { getDomainPricing } from '@/lib/api/domainReseller'

const tlds = await getDomainPricing()

// [
//   { extension: 'com', price: 10.99, currency: 'USD', periods: [1,2,3,5,10] },
//   ...
// ]
```

### Domain Kaydı
```javascript
import { registerDomain } from '@/lib/api/domainReseller'

const result = await registerDomain(
  'example.com',
  1,  // period
  {
    admin: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+905551234567',
      address: 'Adres',
      city: 'İstanbul',
      country: 'TR',
      postalCode: '34000'
    }
  },
  ['ns1.hosting.com', 'ns2.hosting.com'],  // nameservers
  true  // privacy protection
)
```

---

## 🎯 DomainNameAPI Özellikleri

**nodejs-dna** paketi ile kullanılabilen tüm fonksiyonlar:

- `CheckAvailability` - Domain müsaitlik kontrolü ✅
- `GetTldList` - TLD fiyat listesi ✅
- `RegisterWithContactInfo` - Domain kayıt ✅
- `Renew` - Domain yenileme (TODO)
- `Transfer` - Domain transfer (TODO)
- `ModifyPrivacyProtectionStatus` - WHOIS gizliliği (TODO)
- `GetCurrentBalance` - Bakiye kontrolü (TODO)

---

## 🛠️ Troubleshooting

### Edge Function Hatası
```
Error: DomainNameAPI credentials not configured
```
**Çözüm:** Supabase secrets ayarlayın (Adım 2)

### CORS Hatası
```
Access to fetch blocked by CORS policy
```
**Çözüm:** Edge Functions otomatik CORS header ekliyor, browser cache temizleyin

### Domain Sorgulama Başarısız
```
Domain sorgulanamadı
```
**Çözüm:**
1. DomainNameAPI hesap bakiyesi kontrolü
2. API credentials doğru mu?
3. Supabase Functions logs kontrol: `supabase functions logs domain-check`

---

## 💰 Fiyatlandırma ve Maliyet

### DomainNameAPI Maliyetleri
- API çağrıları ücretsiz
- Domain kayıt ücretleri toptan fiyattan
- Müşteriye satış fiyatını siz belirlersiniz (mark-up)

### Supabase Edge Functions
- İlk 500K istek/ay **ÜCRETSİZ**
- Sonrası: $2/million requests

---

## 📞 Destek

**DomainNameAPI Dokümantasyon:**
https://www.domainnameapi.com/api-documentation

**nodejs-dna GitHub:**
https://github.com/domainreseller/nodejs-dna

**Supabase Edge Functions:**
https://supabase.com/docs/guides/functions

---

## 🔜 Gelecek Özellikler

- [ ] Domain transferi
- [ ] Domain yenileme (auto-renewal)
- [ ] WHOIS gizliliği yönetimi
- [ ] Toplu domain işlemleri
- [ ] Domain öneri sistemi (alternatifler)
- [ ] Ödeme entegrasyonu (Stripe/iyzico)

---

## ✅ Test Checklist

- [ ] Domain arama sayfasına erişim (hem admin hem customer)
- [ ] Domain sorgulama çalışıyor
- [ ] Fiyatlar görüntüleniyor
- [ ] Sepete ekleme çalışıyor
- [ ] Command Palette'te "Domain Ara" görünüyor
- [ ] Breadcrumbs "Domain Ara" gösteriyor
- [ ] Sidebar menüde "Domain Ara" var

---

**Not:** Domain satın alma flow'unu tamamlamak için ödeme entegrasyonu eklemeniz gerekecek. Şu an sepete ekleme yapabiliyorsunuz, ödeme kısmı TODO olarak bırakıldı.
