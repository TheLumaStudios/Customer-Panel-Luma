# Luma Yazılım — Müşteri Paneli Özellik Listesi

> Proje: `customer-panel` · Stack: React + Vite + Supabase · Tarih: 2026-05-17

---

## İçindekiler

1. [Genel Mimari](#genel-mimari)
2. [Herkese Açık Site (Public)](#herkese-açık-site-public)
3. [Admin Paneli](#admin-paneli)
4. [Müşteri Paneli](#müşteri-paneli)
5. [Çalışan (Employee) Paneli](#çalışan-employee-paneli)
6. [Entegrasyonlar](#entegrasyonlar)
7. [Altyapı & Teknik](#altyapı--teknik)

---

## Genel Mimari

- **Frontend:** React 18 + Vite, TailwindCSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Roller:** `admin`, `employee`, `customer`
- **Auth:** E-posta/şifre, Magic Link, GitHub OAuth, Cloudflare Turnstile (bot koruması)
- **Ödeme:** iyzico (kredi kartı, cüzdan yüklemesi), banka havalesi
- **SEO:** React Helmet, schema.org JSON-LD, per-page meta

---

## Herkese Açık Site (Public)

### Anasayfa
- Typewriter efektli hero başlık
- Particle field & dönen küre animasyonu
- Parallax mouse takip efekti
- Scroll progress bar
- Cursor glow efekti
- Özellikler bölümü (NVMe SSD, DDoS, SSL, Destek)
- İstatistik sayaçları (uptime, müşteri, destek süresi)
- Hizmet kartları (hosting, VPS, VDS, oyun sunucusu)
- Neden bizi seçin bölümü
- Müşteri yorumları (testimonials)
- Final CTA bölümü

### Ürün Sayfaları
| Sayfa | URL |
|-------|-----|
| Linux Hosting | `/linux-hosting` |
| WordPress Hosting | `/wordpress-hosting` |
| Plesk Hosting | `/plesk-hosting` |
| Reseller Hosting | `/reseller-hosting` |
| VPS Sunucu | `/vps` |
| VDS Sunucu | `/vds` |
| Dedicated Sunucu | `/dedicated` |
| Minecraft Sunucu | `/minecraft` |
| CS:GO / CS2 Sunucu | `/csgo` |

Her ürün sayfasında:
- Hero bölümü (ürün özellikleri, fiyat aralığı)
- Paket tablosu (CPU, RAM, Disk, Bant genişliği, fiyat — Supabase'den dinamik)
- İndirim gösterimi (orijinal fiyat çizgili, indirim badge'i)
- "Sepete Ekle" butonu
- Özellik kartları (DDoS, destek, SSD, anlık kurulum vb.)

### İletişim Sayfası (`/contact`)
- İletişim formu (ad, soyad, e-posta, departman seçimi, mesaj)
- Cloudflare Turnstile doğrulaması
- BTK uyumlu yetkili bilgileri (isim, adres, e-posta, telefon)
- Destek talebi yönlendirme
- Meta CAPI entegrasyonu (contact event)

### Özellikler Sayfası (`/features`)
- Tüm teknik özellikler detaylı açıklama

### Yasal Sayfalar
- Gizlilik Politikası (`/privacy`)
- Kullanım Koşulları (`/terms`)
- KVKK Aydınlatma Metni (`/kvkk`)
- Mesafeli Satış Sözleşmesi (`/distance-sales`)
- Hakkımızda (`/about`)
- Teslimat, İade ve İptal (`/delivery-return`)

### Ödeme Akışı (Public)
- Sepet (CartDropdown — header'da her sayfada)
- Checkout sayfası (`/checkout`)
  - Paket seçimi özeti
  - Dönem seçimi (aylık / yıllık)
  - Promo kodu uygulaması
  - KDV hesaplaması
  - iyzico ödeme entegrasyonu
  - Banka havalesi seçeneği
- Ödeme başarılı / başarısız sayfaları

### Kullanıcı Kaydı & Girişi
- E-posta + şifre ile kayıt
- Şifre güç göstergesi
- KVKK / Gizlilik Politikası onayı (kayıt sırasında zorunlu, DB'ye loglanır)
- GitHub OAuth
- Magic Link (şifresiz giriş)
- Cloudflare Turnstile (bot koruması)
- Referral kodu desteği (`?ref=CODE`)

---

## Admin Paneli

### Dashboard (`/admin/dashboard`)
- KPI kartları: Aktif müşteri, domain, hosting, bekleyen fatura sayısı
- Son 6 aylık gelir grafiği (aylık bazda, ödenen faturalar)
- Fatura durum dağılımı (pasta grafik: ödenmiş / bekleyen / iptal)
- Yeni müşteri trendi (bar grafik)
- Son aktiviteler akışı
- Yaklaşan yenilemeler listesi (30 gün içinde bitenler)

### Müşteriler (`/admin/customers`)
- Müşteri listesi (arama, filtre, sıralama)
- CSV export / import
- Müşteri oluşturma & düzenleme formu
- Toplu işlemler (bulk action bar)
- Gelişmiş filtre ve filtre chip'leri
- Sağlık skoru badge'i (HealthScoreBadge)
- Duygu analizi badge'i (SentimentBadge)
- SMS gönderme modalı
- Şifre sıfırlama modalı

### Müşteri Detayı (`/admin/customers/:id`)
- Genel bilgiler (isim, şirket, e-posta, telefon, adres)
- KYC görüntüsü önizleme ve doğrulama
- KYC hatırlatma SMS gönderimi
- Müşteriye ait domain listesi
- Müşteriye ait hosting listesi
- Müşteriye ait fatura listesi
- Müşteriye ait destek talepleri
- İç notlar (InternalNotes — yalnızca admin/çalışan görebilir)
- Çalışma alanı yönetimi (WorkspaceManager)
- Marka ayarları (BrandingSettings)
- Şifre oluşturma & SMS ile gönderme
- Müşteriyi düzenleme formu (modal içinde)
- Ghost mode (müşteriyi taklit etme)

### Domain Yönetimi (`/admin/domains`)
- Domain listesi (filtre, arama)
- Domain ekleme / düzenleme formu
- DNS kayıt yönetimi (DNS Manager)
- Domain durum takibi (aktif, askıda, süresi dolan)
- Cloudflare entegrasyonu (vanity nameserver)

### Hosting Yönetimi (`/admin/hosting`)
- Hosting hesapları listesi
- Hosting oluşturma / düzenleme formu
- Paket yükseltme diyaloğu
- Sağlayıcı senkronizasyonu (cPanel / Plesk)
- Provisioning tracker (kurulum aşamaları)
- Durum değiştirme (aktif / askıya al / sil)

### Hosting Paket Tanımları (`/admin/hosting-packages`)
- Paket CRUD
- Paket özellik seti (disk, bant genişliği, e-posta hesabı vb.)
- Görünür / gizli toggle

### Ürün Paket Tanımları (`/admin/product-packages`)
- VPS / VDS / Oyun Sunucusu paketleri CRUD
- CPU, RAM, Disk, bant genişliği, fiyat, indirim fiyatı
- Paket tipi (vps, vds, cpanel_hosting, minecraft, csgo, dedicated)
- Aktif / pasif toggle

### VDS Yönetimi
- **VDS Siparişleri** (`/admin/vds-orders`): Satın alınan VDS listesi, sipariş durumu
- **VDS Tanımları** (`/admin/vds`): Sunucu konfigürasyon yönetimi

### Sunucular (`/admin/servers`)
- Fiziksel / sanal sunucu envanteri
- Sunucu ekleme / düzenleme formu
- Sunucu sağlayıcı bilgileri
- IP adresi yönetimi

### Faturalar (`/admin/invoices`)
- Fatura listesi (durum filtresi, tarih aralığı, arama)
- Fatura oluşturma formu
- Fatura detayı (`/admin/invoice/:id`)
  - Kalem bazlı fatura satırları
  - KDV / net / brüt hesaplaması
  - Ödeme durumu güncelleme
  - PDF export
  - Müşteriye e-posta gönderme
  - iyzico link oluşturma
  - Banka havalesi onayı

### Destek Talepleri — Admin (`/admin/tickets`)
- Tüm müşterilerin ticket'ları
- Departman ve durum bazlı filtreleme
- Ticket detayı: mesaj geçmişi, dosya ekler
- İç notlar (müşteri göremez)
- Ticket ataması (çalışana atama)
- Durum güncelleme (açık / yanıtlandı / kapalı)

### Onay Sistemi (`/admin/approvals`)
- Müşteri talepleri onay kuyruğu (wallet yükleme, hizmet talepleri vb.)
- Onayla / reddet + not ekleme
- Durum filtresi (bekleyen / onaylı / reddedildi / hepsi)

### Cüzdan İade Talepleri (`/admin/wallet-refunds`)
- Müşterilerin iade taleplerini listeleme
- Onayla / reddet işlemleri
- iyzico üzerinden iade notu

### Sözleşmeler (`/admin/contracts`)
- Sözleşme şablonu yönetimi
- Müşterilere atanan sözleşmeler
- Elektronik imza / onay durumu
- İnkar edilemezlik sertifikası (NonRepudiation PDF)

### Analitik (`/admin/analytics`)
- Gelir analizi
- Müşteri büyüme grafikleri
- Hizmet dağılımı

### Gelir Paylaşımı (`/admin/revenue-split`)
- İş ortağı / bayii tanımları (isim, e-posta, yüzde)
- Her faturadan otomatik pay hesaplama
- Ödeme geçmişi

### Promo Kodları (`/admin/promo-codes`)
- Promo kodu oluşturma / düzenleme / silme
- İndirim tipi: yüzde veya sabit tutar
- Minimum sipariş tutarı
- Maksimum kullanım limiti (toplam ve müşteri başına)
- Geçerlilik tarihi
- Uygulanacak hizmet tipi seçimi
- "İlk ay ücretsiz" özel modu

### Duyurular (`/admin/announcements`)
- Site geneli duyuru oluşturma
- Başlık, içerik, tür (bilgi / uyarı / kritik)
- Başlangıç / bitiş tarihi

### Olaylar / İncidentler (`/admin/incidents`)
- Sistem olayı oluşturma (başlık, açıklama, şiddet: minor/major/critical)
- Durum akışı: Araştırılıyor → Tespit Edildi → İzleniyor → Çözüldü
- Olay güncelleme geçmişi
- Müşterilere bildirim gönderme

### Çalışanlar (`/admin/employees`)
- Çalışan oluşturma (e-posta, isim, şifre, telefon)
- Supabase Auth'da otomatik hesap açma
- Çalışan listesi ve durum yönetimi
- Şifre sıfırlama SMS gönderme
- Çalışanı devre dışı bırakma / silme

### Cloudflare Yönetimi (`/admin/cloudflare`)
- Zone listesi
- DNS kayıt ekleme / düzenleme / silme
- Vanity nameserver yapılandırması
- Cloudflare API token / account ID yönetimi

### E-posta Şablonları (`/admin/email-templates`)
- Sistem e-posta şablonları düzenleme (fatura, hoş geldin, şifre sıfırlama vb.)
- HTML template editörü

### Destek Departmanları (`/admin/ticket-departments`)
- Departman tanımlama (Satış, Teknik, Muhasebe vb.)
- Departmana göre ticket yönlendirme

### Bilgi Tabanı — Admin (`/admin/knowledge-base`)
- Makale oluşturma / düzenleme / silme
- Kategori yönetimi
- Yayın / taslak durumu

### Proje Milestonları (`/admin/project-milestones`)
- Geliştirme takvimi ve kilometre taşı takibi

### Banka Hesapları (`/admin/bank-accounts`)
- İş Bankası / Ziraat Bankası IBAN yönetimi
- Varsayılan banka seçimi

### Sistem Ayarları (`/admin/system-settings`)
- iyzico ödeme yapılandırması (fatura tipi, ödeme yöntemi)
- SMTP e-posta sunucusu ayarları
- Otomatik fatura oluşturma (yenileme öncesi X gün)
- Otomatik askıya alma (gecikmiş gün sayısı)
- Otomatik sonlandırma (askıdaki gün sayısı)
- Gecikme cezası (yüzde veya sabit, tolerans süresi)
- Kâr marjı yüzdesi (paket fiyatlarına uygulanır)
- Yazılım müşterisine ücretsiz hosting (süre ve toggle)
- Cloudflare API yapılandırması
- Vanity nameserver yapılandırması
- OpenAI API key

### Kişisel Ayarlar (`/admin/settings`)
- Admin profil bilgileri güncelleme
- Şifre değiştirme

### Denetim Günlüğü (`/admin/audit-logs`)
- Tüm admin/çalışan işlemlerinin zaman damgalı kaydı
- Kim, ne zaman, hangi işlemi yaptı

---

## Müşteri Paneli

### Dashboard (`/dashboard`)
- Hosting sayısı, domain sayısı, ödenmemiş fatura, açık ticket özeti
- Son faturalar
- Aktif servisler listesi
- Yaklaşan yenilemeler (30 gün)
- Sözleşme onay modalı (okunmamış sözleşmeler varsa otomatik açılır)

### Cüzdan (`/wallet`)
- Mevcut bakiye görüntüleme
- Hızlı yükleme butonları (100 / 250 / 500 / 1.000 / 2.500 / 5.000 ₺)
- Özel tutar girişi (min 50₺, max 10.000₺)
- iyzico ile kredi kartı ödemesi
- Bonus tier sistemi (yüksek yükleme = ekstra bonus)
- İşlem geçmişi (giren / çıkan, açıklama, tarih)
- Cüzdan iade talebi oluşturma

### Faturalar (`/invoices`)
- Tüm faturalar listesi (durum filtresi)
- Fatura detayı (`/invoice/:id`)
  - Kalem listesi, KDV, toplam
  - iyzico ile ödeme
  - Banka havalesi ile ödeme
  - PDF indirme

### Domainlerim (`/domains`)
- Kayıtlı domain listesi
- Domain durum ve bitiş tarihi
- Yenileme aksiyonu

### Hostingim (`/hosting`)
- Aktif hosting hesapları
- cPanel / Plesk erişim bilgileri
- Hosting detayları (paket, disk, bant genişliği)

### VDS'im (`/my-vds`)
- VDS siparişleri ve durumu
- Sunucu bilgileri (IP, şifre, kontrol paneli)

### Destek Talepleri (`/tickets`)
- Ticket oluşturma (departman seçimi, konu, açıklama, dosya ek)
- Ticket listesi ve durum takibi
- Ticket detayı (`/tickets/:id`): mesaj geçmişi, yanıtlama

### Profil (`/profile`)
- Kişisel bilgi güncelleme (ad, şirket, telefon)
- Şifre değiştirme
- Adres yönetimi
- KYC (kimlik doğrulama) belge yükleme

### Referral Sistemi (`/referrals`)
- Kişisel referral kodu görüntüleme
- Referral link paylaşma
- Davet ettiği kullanıcı listesi
- Kazanılan ödüller

### API Anahtarları & Webhooks (`/api-keys`)
- API anahtarı oluşturma / listeleme / silme
- Anahtar değerini görüntüleme (gizle/göster toggle)
- Kopyalama (clipboard)
- Webhook URL tanımlama
- Webhook event seçimi (fatura, hosting, domain, ticket eventleri)
- Webhook secret yönetimi

### Geliştirici Sayfası (`/developer`)
- API entegrasyon dokümantasyonu
- Endpoint örnekleri

### Bilgi Tabanı (`/knowledge-base`)
- Makaleler listesi (kategoriye göre)
- Makale detay sayfası (`/knowledge-base/:slug`)

### Bildirim Tercihleri (`/notifications`)
- E-posta bildirimi toggle'ları (fatura, yenileme, ticket yanıtı vb.)
- SMS bildirimi toggle'ları

### Banka Bilgisi (`/bank-info`)
- Havale yapılacak banka hesap bilgileri

---

## Çalışan (Employee) Paneli

Çalışanlar `/employee/*` altında admin paneline benzer ama kısıtlı bir görünüme sahiptir:

| Özellik | Erişim |
|---------|--------|
| Dashboard | Evet |
| Müşteriler (liste & detay) | Evet |
| Faturalar | Evet |
| Onaylar | Evet |
| Hosting | Evet |
| Domain | Evet |
| Destek Talepleri | Evet |
| Sistem Ayarları | Hayır |
| Çalışan Yönetimi | Hayır |
| Promo Kod / Gelir Paylaşımı | Hayır |
| Cloudflare / E-posta Şablonları | Hayır |

---

## Entegrasyonlar

### iyzico (Ödeme)
- Kredi kartı ödemesi (3D Secure)
- Cüzdan yükleme
- İade işlemleri
- Resmi fatura / e-fatura desteği
- Checkout formu (inline veya popup)

### Cloudflare
- Zone yönetimi
- DNS A / CNAME / MX / TXT kayıt yönetimi
- Vanity nameserver (ns1.lumayazilim.com, ns2.lumayazilim.com)
- API token tabanlı yetkilendirme

### Meta (Facebook) Pixel & Conversions API
- PageView (her sayfa değişiminde)
- ViewContent (ürün sayfaları)
- CompleteRegistration (kayıt)
- Purchase (ödeme tamamlandı)
- Lead (iletişim formu)
- Server-side CAPI (sunucu taraflı event gönderimi)

### SMS (Supabase Edge Function)
- Şifre gönderimi SMS ile
- KYC hatırlatma SMS
- Çalışan şifre sıfırlama SMS
- SMS log tablosu

### SMTP (E-posta)
- Konfigüre edilebilir SMTP sunucusu
- Sistem e-posta şablonları

### Cloudflare Turnstile
- Login ve Register formlarında bot koruması

### GitHub OAuth
- Sosyal giriş / kayıt

### Google Analytics / GTM
- Sayfa görüntüleme, kayıt, wallet yükleme event'leri

### OpenAI
- API key yapılandırması (gelecek AI entegrasyonları için hazır)

---

## Altyapı & Teknik

### Kimlik Doğrulama & Yetkilendirme
- Supabase Auth (JWT tabanlı)
- Row Level Security (RLS) — her tablo için ayrı politikalar
- Rol bazlı yönlendirme (admin / employee / customer)
- Public Route (giriş yapmış kullanıcıyı panele yönlendir)
- Protected Route (yetkisiz erişimi engelle)
- Ghost mode (admin müşteri hesabını görüntüler)

### State & Veri Yönetimi
- TanStack Query (React Query) — sunucu state, cache, refetch
- Zustand — checkout store (sepet state'i)
- Context API — AuthProvider, CartProvider, ProductCacheContext, CustomerViewContext

### UI & Bileşenler
- shadcn/ui (Card, Table, Dialog, Select, Badge, Button vb.)
- Recharts (grafik bileşenleri)
- Lucide React (ikonlar)
- TailwindCSS (utility-first CSS)
- Özel bileşenler: DraggableGrid, VirtualList, DataTable, AdvancedFilter, FilterChips, BulkActionBar, ExportButton

### Ürün Sayfa Özellikleri (Landing)
- Cursor glow animasyonu
- Magnetic button efekti
- Scroll reveal animasyonları
- TiltCard 3D hover efekti
- Particle field arka plan
- Dönen SVG küre (globe)
- Typewriter metin efekti
- Scroll progress bar

### SEO
- React Helmet Async
- Per-page meta (title, description, canonical)
- Open Graph & Twitter Card
- Schema.org JSON-LD (Product, ContactPage, Organization)
- Sitemap uyumlu URL yapısı

### Güvenlik
- KVKK onayı zorunlu kayıt (DB'ye loglanır)
- Audit log (tüm admin işlemleri)
- Cloudflare Turnstile (form spam koruması)
- RLS politikaları (Supabase)
- ID kartı yükleme kapısı (IdCardUploadGate)
- İnkar edilemezlik sertifikası (sözleşme imzaları)

### Diğer
- Keyboard shortcuts dialog
- Command palette
- Cookie consent banner
- Error boundary
- Ghost banner (müşteri görünümü aktifken uyarı)
- CSV import / export
- PDF generation (faturalar, sözleşmeler)
- Provisioning tracker
- Sistem durumu sayfası (incidents)
