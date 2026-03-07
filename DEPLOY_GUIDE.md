# 🚀 Domain Reseller Deployment Kılavuzu

## Adım 1: Supabase CLI Kurulumu

### macOS (Homebrew):
```bash
brew install supabase/tap/supabase
```

### Windows (Scoop):
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Linux / macOS (NPM):
```bash
npm install -g supabase
```

### Kurulumu Doğrula:
```bash
supabase --version
# Çıktı: supabase version x.x.x
```

---

## Adım 2: Supabase'e Login

```bash
supabase login
```

Bu komut tarayıcınızda Supabase login sayfasını açacak. Giriş yaptıktan sonra access token alacaksınız.

**Alternatif (Access Token ile):**
```bash
supabase login --token YOUR_ACCESS_TOKEN
```

Access token almak için:
1. https://app.supabase.com/account/tokens
2. "Generate new token" → İsim verin → Kopyalayın

---

## Adım 3: Proje ID'sini Öğrenme

```bash
# Supabase Dashboard'da:
# Project Settings > General > Reference ID
```

Veya `.env` dosyanızdaki URL'den:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
                          ^^^^^^^^^^^^^ <- Bu kısım Project ID
```

---

## Adım 4: Edge Functions'ları Deploy Etme

### Proje klasörünüze gidin:
```bash
cd /Users/epoyraz/Documents/Projeler/customer-panel
```

### Her bir function'ı ayrı ayrı deploy edin:

#### 1. Domain Check Function:
```bash
supabase functions deploy domain-check --project-ref YOUR_PROJECT_ID
```

#### 2. Domain Pricing Function:
```bash
supabase functions deploy domain-pricing --project-ref YOUR_PROJECT_ID
```

#### 3. Domain Register Function:
```bash
supabase functions deploy domain-register --project-ref YOUR_PROJECT_ID
```

### Veya Hepsini Tek Seferde:
```bash
supabase functions deploy domain-check domain-pricing domain-register --project-ref YOUR_PROJECT_ID
```

---

## Adım 5: DomainNameAPI Credentials Ayarlama

### Secrets Ekleme (CLI ile):
```bash
supabase secrets set DNA_USERNAME=your_username --project-ref YOUR_PROJECT_ID
supabase secrets set DNA_PASSWORD=your_password --project-ref YOUR_PROJECT_ID
```

### Alternatif: Dashboard Üzerinden
1. https://app.supabase.com/project/YOUR_PROJECT_ID/settings/functions
2. Sol menüden "Edge Functions"
3. "Manage secrets" butonuna tıklayın
4. Şu secrets'ları ekleyin:
   - `DNA_USERNAME` = DomainNameAPI kullanıcı adınız
   - `DNA_PASSWORD` = DomainNameAPI şifreniz

---

## Adım 6: DomainNameAPI Hesabı Alma

### Eğer henüz hesabınız yoksa:

1. **https://www.domainnameapi.com/** adresine gidin
2. "Become a Reseller" / "Reseller Ol" seçeneğine tıklayın
3. Kayıt formunu doldurun
4. Hesabınız onaylandıktan sonra:
   - Dashboard > API Credentials
   - Username ve Password'ünüzü alın

### Test Hesabı:
DomainNameAPI'den test/sandbox hesabı isteyebilirsiniz. Destek ile iletişime geçin:
- Email: support@domainnameapi.com
- Test mode API'si var mı sorun

---

## Adım 7: Functions'ların Çalıştığını Test Etme

### Test Request (cURL ile):

```bash
# Domain Check Test
curl -X POST \
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/domain-check' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "domains": ["example"],
    "extensions": ["com", "net"],
    "period": 1
  }'
```

### Test Request (JavaScript/Browser Console):

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co'
const ANON_KEY = 'YOUR_ANON_KEY'

const response = await fetch(`${SUPABASE_URL}/functions/v1/domain-check`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    domains: ['example'],
    extensions: ['com', 'net'],
    period: 1
  })
})

const result = await response.json()
console.log(result)
```

**Beklenen Çıktı:**
```json
{
  "success": true,
  "results": [
    {
      "domain": "example.com",
      "available": false,
      "status": "registered",
      "price": 10.99,
      "currency": "USD"
    },
    {
      "domain": "example.net",
      "available": true,
      "status": "available",
      "price": 12.99,
      "currency": "USD"
    }
  ]
}
```

---

## Adım 8: Functions Logs İzleme

Hataları görmek için logs'ları izleyin:

```bash
# Tüm functions için
supabase functions logs --project-ref YOUR_PROJECT_ID

# Sadece domain-check için
supabase functions logs domain-check --project-ref YOUR_PROJECT_ID

# Real-time log streaming
supabase functions logs domain-check --project-ref YOUR_PROJECT_ID --stream
```

---

## Adım 9: Frontend'i Test Etme

1. **Dev server'ı başlatın:**
```bash
npm run dev
```

2. **Tarayıcıda açın:**
   - Customer: http://localhost:5173/domain-search
   - Admin: http://localhost:5173/admin/domain-search

3. **Domain sorgulama test edin:**
   - Domain adı girin (örn: "google")
   - Uzantıları seçin (.com, .net)
   - "Sorgula" butonuna tıklayın

---

## Troubleshooting

### ❌ Hata: "Error invoking remote function"

**Sebep:** Function deploy edilmemiş veya hata veriyor

**Çözüm:**
```bash
# Logs kontrol edin
supabase functions logs domain-check --project-ref YOUR_PROJECT_ID

# Tekrar deploy edin
supabase functions deploy domain-check --project-ref YOUR_PROJECT_ID
```

---

### ❌ Hata: "DomainNameAPI credentials not configured"

**Sebep:** Secrets ayarlanmamış

**Çözüm:**
```bash
supabase secrets set DNA_USERNAME=your_username --project-ref YOUR_PROJECT_ID
supabase secrets set DNA_PASSWORD=your_password --project-ref YOUR_PROJECT_ID

# Secrets'ları kontrol edin
supabase secrets list --project-ref YOUR_PROJECT_ID
```

---

### ❌ Hata: "CORS policy blocked"

**Sebep:** Browser cache veya CORS headers

**Çözüm:**
1. Browser cache temizle (Hard Refresh: Cmd+Shift+R)
2. Incognito mode'da dene
3. Edge functions CORS headers ekliyor, kod doğru

---

### ❌ Hata: "Unauthorized"

**Sebep:** Anon key yanlış veya expired

**Çözüm:**
1. `.env` dosyasındaki `VITE_SUPABASE_ANON_KEY` kontrol edin
2. Supabase Dashboard > Settings > API > anon/public key kopyalayın
3. `.env` güncelleyin ve server restart edin

---

### ❌ Hata: "Domain sorgulanamadı"

**Sebep:** DomainNameAPI hesap problemi veya bakiye yetersiz

**Çözüm:**
1. DomainNameAPI Dashboard'a login olun
2. Hesap bakiyesi kontrol edin
3. API credentials doğru mu kontrol edin
4. DomainNameAPI SOAP endpoint çalışıyor mu test edin:
```bash
curl https://api.domainnameapi.com/api/soap
```

---

## Adım 10: Production Deployment (Vercel/Netlify)

### Environment Variables Ayarlama

**Vercel:**
1. Project Settings > Environment Variables
2. Ekleyin:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

**Netlify:**
1. Site settings > Build & deploy > Environment
2. Aynı variables ekleyin

### Build & Deploy:
```bash
npm run build
```

---

## 📋 Deployment Checklist

Tüm adımları tamamladınız mı?

- [ ] Supabase CLI kuruldu
- [ ] Supabase'e login yapıldı
- [ ] Project ID öğrenildi
- [ ] Edge Functions deploy edildi (3 adet)
- [ ] DomainNameAPI credentials ayarlandı
- [ ] DomainNameAPI hesabı alındı ve aktif
- [ ] Functions test edildi (cURL/browser)
- [ ] Logs kontrol edildi (hata yok)
- [ ] Frontend test edildi (domain arama çalışıyor)
- [ ] Production environment variables ayarlandı
- [ ] Build başarılı

---

## 🎯 Hızlı Komutlar

**Full Deploy:**
```bash
# 1. Login
supabase login

# 2. Deploy all functions
supabase functions deploy domain-check domain-pricing domain-register --project-ref YOUR_PROJECT_ID

# 3. Set secrets
supabase secrets set DNA_USERNAME=xxx DNA_PASSWORD=yyy --project-ref YOUR_PROJECT_ID

# 4. Test
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/domain-check' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"domains":["test"],"extensions":["com"],"period":1}'

# 5. Watch logs
supabase functions logs --project-ref YOUR_PROJECT_ID --stream
```

---

## 📞 Yardım

**Supabase Docs:**
https://supabase.com/docs/guides/functions

**DomainNameAPI Docs:**
https://www.domainnameapi.com/api-documentation

**Supabase Discord:**
https://discord.supabase.com/

---

**Deployment başarılı olduğunda domain satışına başlayabilirsiniz! 🚀**
