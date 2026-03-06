# Customer Panel - Hosting & Domain Yönetim Sistemi

Modern, siyah-beyaz temalı müşteri yönetim paneli. React, Vite, Supabase ve Tailwind CSS ile geliştirilmiştir.

## ✨ Özellikler

### Temel Özellikler
- ✅ **Müşteri Yönetimi** - Müşteri CRUD operasyonları, detaylar, notlar
- ✅ **Domain Takibi** - Domain listesi, son kullanma tarihleri, yenileme hatırlatıcıları
- ✅ **Hosting Paketleri** - Hosting paket bilgileri, paket tipleri, süre takibi
- ✅ **Fatura/Ödeme Takibi** - Fatura oluşturma, ödeme durumları, gelir raporları

### Ek Özellikler
- ✅ **Bildirim Sistemi** - Domain/hosting süre dolumu bildirimleri
- ✅ **Destek Talepleri** - Ticket sistemi, müşteri-admin mesajlaşma
- ✅ **Dashboard/İstatistikler** - Toplam müşteri, gelir grafikleri, yaklaşan yenilemeler
- ✅ **SMS Entegrasyonu** - VatanSMS API ile SMS bildirimleri

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Environment Variables (.env)

`.env` dosyası zaten yapılandırılmış:

```env
VITE_SUPABASE_URL=https://pbgajlkaulxrspyptzzs.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_VATANSMS_API_URL=https://api.vatansms.net/api/v1
VITE_VATANSMS_API_KEY=your_api_key
VITE_VATANSMS_API_SECRET=your_api_secret
VITE_VATANSMS_SENDER=your_sender_name
```

### 3. Supabase Database Kurulumu ⚠️ **ÖNEMLİ**

Uygulamayı çalıştırmadan önce **mutlaka** database şemasını oluşturmalısınız:

1. **Supabase SQL Editor'a gidin:**
   ```
   https://supabase.com/dashboard/project/pbgajlkaulxrspyptzzs/sql
   ```

2. **SQL Schema'yı çalıştırın:**
   - "New query" butonuna tıklayın
   - `supabase-schema.sql` dosyasının tüm içeriğini kopyalayın
   - SQL Editor'a yapıştırın
   - "Run" butonuna tıklayın

Bu işlem:
- ✅ 12 tablo oluşturacak (profiles, customers, domains, invoices, vb.)
- ✅ Row Level Security (RLS) policies kuracak
- ✅ Indexes ve triggers ekleyecek

### 4. Development Server'ı Başlatın

```bash
npm run dev
```

Uygulama http://localhost:5173 (veya başka bir port) adresinde çalışacaktır.

## 👤 İlk Kullanıcı Oluşturma

### Yöntem 1: Register + Admin Yapma

1. http://localhost:5173/register adresine gidin
2. Formu doldurup kayıt olun (customer olarak kaydedilir)
3. Supabase SQL Editor'da şu komutu çalıştırın:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'kayit-oldugunuz@email.com';
```

4. Logout yapın ve tekrar login olun
5. Artık Admin Dashboard'a erişebilirsiniz

### Yöntem 2: Doğrudan Admin Oluşturma

Supabase Authentication'da kullanıcı oluşturduktan sonra:

```sql
INSERT INTO profiles (id, email, role, full_name)
VALUES (
  'user_id_from_auth',
  'admin@example.com',
  'admin',
  'Admin Kullanıcı'
);
```

## 🎨 Teknoloji Stack

- **Frontend:** React 19.2 + Vite 7.2
- **Styling:** Tailwind CSS 3.4 (siyah-beyaz tema)
- **UI Components:** shadcn/ui
- **State Management:** React Query + Zustand
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Routing:** React Router v7
- **Form:** React Hook Form + Zod

## 📁 Proje Yapısı

```
customer-panel/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui bileşenleri
│   │   ├── layout/          # Sidebar, Header, MainLayout
│   │   ├── auth/            # ProtectedRoute
│   │   ├── customers/       # Müşteri bileşenleri
│   │   ├── domains/         # Domain bileşenleri
│   │   ├── hosting/         # Hosting bileşenleri
│   │   ├── invoices/        # Fatura bileşenleri
│   │   └── tickets/         # Destek bileşenleri
│   ├── hooks/               # Custom hooks (useAuth, vb.)
│   ├── lib/
│   │   ├── supabase.js      # Supabase client
│   │   ├── utils.js         # Utility fonksiyonlar
│   │   └── api/             # API service katmanları
│   ├── pages/
│   │   ├── auth/            # Login, Register
│   │   ├── admin/           # Admin sayfaları
│   │   └── customer/        # Müşteri sayfaları
│   └── App.jsx              # Ana routing
├── supabase-schema.sql      # Database şeması
└── .env                     # Environment variables
```

## 🔐 Roller ve Yetkiler

### Admin
- Tüm müşterileri görüntüleme ve yönetme
- Domain ve hosting ekleme/düzenleme/silme
- Fatura oluşturma ve yönetme
- Tüm destek taleplerini görüntüleme ve cevaplama
- Sistem ayarları ve istatistikler

### Customer
- Kendi servislerini görüntüleme (read-only)
- Kendi faturalarını görüntüleme
- Destek talebi oluşturma ve görüntüleme
- Profil bilgilerini düzenleme

## 🔒 Güvenlik

- **Row Level Security (RLS):** Tüm tablolarda aktif
- **Role-based Access Control:** Admin ve customer rolleri
- **JWT Authentication:** Supabase tarafından yönetilir
- **Activity Logging:** Admin işlemleri loglanır

## 📱 Responsive Tasarım

Uygulama mobil, tablet ve desktop cihazlarda sorunsuz çalışır.

## 🐛 Hata Ayıklama

### "Database henüz kurulmamış" Hatası

Bu hatayı alıyorsanız:
1. `supabase-schema.sql` dosyasını Supabase SQL Editor'da çalıştırın
2. Sayfayı yenileyin

### Profile Fetch Hatası

Console'da "Error fetching profile" görüyorsanız:
1. SQL schema'nın çalıştırıldığından emin olun
2. RLS policies'lerin doğru kurulduğunu kontrol edin

### Authentication Hatası

"Invalid login credentials" hatası alıyorsanız:
1. Email ve şifrenin doğru olduğundan emin olun
2. Supabase Authentication ayarlarını kontrol edin
3. Email verification gerekip gerekmediğini kontrol edin

## 📝 Sonraki Adımlar

- [ ] Supabase database schema'sını çalıştırın
- [ ] İlk admin kullanıcıyı oluşturun
- [ ] Müşteri ekleme fonksiyonunu test edin
- [ ] Domain ve hosting ekleme özelliklerini test edin
- [ ] VatanSMS API entegrasyonunu yapılandırın

## 📄 Lisans

Bu proje özel bir müşteri paneli projesidir.

## 🤝 Destek

Herhangi bir sorun yaşarsanız:
1. Console'u kontrol edin (F12)
2. Supabase logs'lara bakın
3. `supabase-schema.sql` dosyasının çalıştırıldığından emin olun
