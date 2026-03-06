# Supabase Edge Functions - cPanel Proxy

## Kurulum

### 1. Supabase CLI Kurulumu

```bash
# macOS
brew install supabase/tap/supabase

# NPM
npm install -g supabase

# Verify installation
supabase --version
```

### 2. Supabase Projenize Login

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

Project Ref'inizi Supabase Dashboard'dan alabilirsiniz:
- Dashboard → Settings → General → Reference ID

### 3. Edge Function Deploy

```bash
# Deploy cpanel-proxy function
supabase functions deploy cpanel-proxy

# Or deploy all functions
supabase functions deploy
```

### 4. Environment Variables (Opsiyonel)

Eğer Edge Function'da secret kullanmak isterseniz:

```bash
supabase secrets set MY_SECRET=my_value
```

## Local Development (Opsiyonel)

Edge Function'ı local olarak test etmek için:

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve cpanel-proxy

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/cpanel-proxy' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"server":{"hostname":"server.example.com","port":2087,"username":"root","api_token":"YOUR_TOKEN"},"endpoint":"/version","method":"GET"}'
```

## Nasıl Çalışır?

1. **Frontend** → Edge Function'a POST request yapar
2. **Edge Function** → cPanel/WHM API'ye request yapar
3. **cPanel Server** → Response döner
4. **Edge Function** → Response'u CORS headers ile frontend'e iletir
5. **Frontend** → Response'u alır

## Avantajları

✅ **CORS sorunu çözülür** - Backend'den istek yapılır
✅ **API credentials güvende** - Server bilgileri sadece istek sırasında gönderilir
✅ **SSL sertifika sorunları yok** - Edge Function self-signed sertifikaları handle eder
✅ **Serverless** - Ayrı bir backend server'a gerek yok
✅ **Hızlı** - Edge location'larda çalışır

## Endpoint

```
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/cpanel-proxy
```

### Request Body

```json
{
  "server": {
    "hostname": "server.example.com",
    "port": 2087,
    "username": "root",
    "api_token": "YOUR_API_TOKEN"
  },
  "endpoint": "/listaccts",
  "method": "GET",
  "params": {
    "search": "username"
  }
}
```

### Response

```json
{
  "metadata": {
    "result": 1,
    "reason": "OK"
  },
  "data": {
    "acct": [...]
  }
}
```

## Troubleshooting

### Deploy hatası alıyorum

```bash
# Supabase CLI güncelleyin
brew upgrade supabase

# Yeniden login olun
supabase login
```

### Edge Function çalışmıyor

1. Doğru project'e link olduğunuzdan emin olun:
   ```bash
   supabase projects list
   supabase link --project-ref YOUR_REF
   ```

2. Function deploy durumunu kontrol edin:
   ```bash
   supabase functions list
   ```

3. Logs'u kontrol edin:
   ```bash
   supabase functions logs cpanel-proxy
   ```

### CORS hatası hala alıyorum

1. Edge Function URL'sini kontrol edin (`src/lib/api/cpanel.js`):
   ```javascript
   const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cpanel-proxy`
   ```

2. `.env` dosyasında `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` tanımlı olmalı

## Production Deployment

Production'a deploy için:

```bash
# Deploy to production
supabase functions deploy cpanel-proxy --project-ref YOUR_PROJECT_REF

# Verify deployment
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/cpanel-proxy
```

## Güvenlik

⚠️ **Önemli**: Server credentials (api_token, password) her istek ile gönderilir.
- Bu bilgileri frontend'de saklamayın
- Request'leri sadece authenticated kullanıcılar yapabilmeli
- Edge Function'a RLS ekleyebilirsiniz

## Monitoring

Dashboard'dan monitoring:
- Supabase Dashboard → Edge Functions → cpanel-proxy
- Invocations, errors, execution time görebilirsiniz
