-- ============================================================================
-- Fix: Re-insert seed data with correct column names for system_settings
-- and ensure all admin-only tables have data
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. System Settings (with category and description)
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
  ('auto_invoice_enabled', 'true', 'boolean', 'automation', 'Otomatik fatura oluşturmayı etkinleştir'),
  ('invoice_days_before_renewal', '14', 'number', 'automation', 'Yenilemeden kaç gün önce fatura oluşturulacak'),
  ('auto_suspend_enabled', 'true', 'boolean', 'automation', 'Vadesi geçmiş faturalarda otomatik askıya almayı etkinleştir'),
  ('auto_suspend_days_overdue', '7', 'number', 'automation', 'Fatura vadesinden kaç gün sonra askıya alınacak'),
  ('auto_terminate_days_suspended', '30', 'number', 'automation', 'Askıya alındıktan kaç gün sonra sonlandırılacak'),
  ('late_fee_enabled', 'false', 'boolean', 'automation', 'Gecikme faizi uygulamayı etkinleştir'),
  ('late_fee_type', 'percentage', 'text', 'automation', 'Gecikme faizi tipi (percentage veya fixed)'),
  ('late_fee_amount', '5', 'number', 'automation', 'Gecikme faizi miktarı (yüzde veya sabit tutar)'),
  ('late_fee_grace_days', '3', 'number', 'automation', 'Gecikme faizi uygulanmadan önceki ek süre (gün)'),
  ('smtp_host', '', 'text', 'email', 'SMTP sunucu adresi'),
  ('smtp_port', '587', 'number', 'email', 'SMTP port numarası'),
  ('smtp_user', '', 'text', 'email', 'SMTP kullanıcı adı'),
  ('smtp_password', '', 'text', 'email', 'SMTP şifresi'),
  ('smtp_from_email', '', 'text', 'email', 'Gönderen e-posta adresi'),
  ('smtp_from_name', 'Luma Yazılım', 'text', 'email', 'Gönderen adı')
ON CONFLICT (setting_key) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- ---------------------------------------------------------------------------
-- 2. Cron Jobs (bypass RLS with explicit insert)
-- ---------------------------------------------------------------------------
INSERT INTO cron_jobs (job_name, description, schedule, is_active) VALUES
  ('auto_invoice', 'Yenileme tarihine yaklaşan hosting ve domain hizmetleri için otomatik fatura oluşturur.', '0 2 * * *', true),
  ('auto_suspend', 'Vadesi geçmiş ödenmemiş faturaları olan hosting hesaplarını otomatik askıya alır.', '0 3 * * *', true),
  ('auto_terminate', 'Uzun süredir askıda olan hosting hesaplarını otomatik sonlandırır ve kaynakları serbest bırakır.', '0 4 * * *', true),
  ('email_reminders', 'Vadesi yaklaşan ve geçen faturalar için müşterilere otomatik hatırlatma e-postaları gönderir.', '0 9 * * *', true),
  ('late_fees', 'Ödeme süresi geçen faturalara belirlenen oranda gecikme faizi uygular.', '0 1 * * *', true),
  ('provision_services', 'Ödeme tamamlanan yeni hizmetler için kurulum kuyruğunu işler (cPanel hesap açma, domain kayıt vb.).', '*/10 * * * *', true)
ON CONFLICT (job_name) DO UPDATE SET
  description = EXCLUDED.description,
  schedule = EXCLUDED.schedule;

-- ---------------------------------------------------------------------------
-- 3. Email Templates
-- ---------------------------------------------------------------------------
INSERT INTO email_templates (template_key, name, subject, body_html, variables, is_active) VALUES
(
  'invoice_created',
  'Yeni Fatura Bildirimi',
  '{{invoice_number}} Numaralı Faturanız Oluşturuldu',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Luma Yazılım</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Fatura Bildirimi</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1a202c; margin-top: 0;">Sayın {{customer_name}},</h2>
    <p>Hesabınıza yeni bir fatura oluşturulmuştur.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background: #f7fafc;"><td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Fatura No</td><td style="padding: 12px; border: 1px solid #e2e8f0;">{{invoice_number}}</td></tr>
      <tr><td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Tutar</td><td style="padding: 12px; border: 1px solid #e2e8f0; font-size: 18px; font-weight: bold;">{{total}} {{currency}}</td></tr>
      <tr style="background: #f7fafc;"><td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Son Ödeme Tarihi</td><td style="padding: 12px; border: 1px solid #e2e8f0; color: #e53e3e;">{{due_date}}</td></tr>
    </table>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invoice_url}}" style="background: #667eea; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold;">Faturayı Görüntüle ve Öde</a>
    </div>
    <p style="color: #718096; font-size: 13px;">Gecikmeli ödemelerde hizmetiniz askıya alınabilir.</p>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
    <p>© 2026 Luma Yazılım - Tüm hakları saklıdır.</p>
  </div>
</body></html>',
  '{customer_name,invoice_number,total,currency,due_date,invoice_url}', true
),
(
  'invoice_reminder',
  'Fatura Hatırlatma',
  'Hatırlatma: {{invoice_number}} Numaralı Faturanızın Vadesi Yaklaşıyor',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">Luma Yazılım</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Ödeme Hatırlatması</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="margin-top: 0;">Sayın {{customer_name}},</h2>
    <p>Faturanızın son ödeme tarihi yaklaşmaktadır.</p>
    <div style="background: #fffbeb; border: 1px solid #f6ad55; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #c05621;">Son Ödeme: {{due_date}}</p>
      <p style="margin: 10px 0 0;">Fatura: {{invoice_number}} | Tutar: {{total}} {{currency}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invoice_url}}" style="background: #ed8936; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold;">Şimdi Öde</a>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;"><p>© 2026 Luma Yazılım</p></div>
</body></html>',
  '{customer_name,invoice_number,total,currency,due_date,invoice_url}', true
),
(
  'invoice_overdue',
  'Vadesi Geçmiş Fatura Uyarısı',
  'ÖNEMLİ: {{invoice_number}} Numaralı Faturanızın Vadesi Geçti!',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #fc8181 0%, #e53e3e 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">Luma Yazılım</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Acil Ödeme Bildirimi</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="margin-top: 0;">Sayın {{customer_name}},</h2>
    <p>Faturanızın vadesi <strong>geçmiştir</strong>. Ödeme yapılmaması durumunda hizmetleriniz askıya alınacaktır.</p>
    <div style="background: #fff5f5; border: 2px solid #e53e3e; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #c53030;">Vadesi Geçmiş Fatura</p>
      <p style="margin: 10px 0 0;">Fatura: <strong>{{invoice_number}}</strong> | Vade: <strong style="color: #e53e3e;">{{due_date}}</strong></p>
      <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold;">{{total}} {{currency}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invoice_url}}" style="background: #e53e3e; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Hemen Öde</a>
    </div>
    <div style="background: #f7fafc; border-radius: 8px; padding: 15px; margin-top: 20px;">
      <p style="margin: 0; font-size: 13px; color: #4a5568;"><strong>Ne olacak?</strong></p>
      <ul style="margin: 10px 0 0; padding-left: 20px; font-size: 13px; color: #718096;">
        <li>Hosting hesabınız askıya alınacaktır</li>
        <li>Web siteniz ve e-postalarınız erişilemez olur</li>
        <li>Uzun süreli askıda kalan hesaplar kalıcı olarak silinebilir</li>
      </ul>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;"><p>© 2026 Luma Yazılım</p></div>
</body></html>',
  '{customer_name,invoice_number,total,currency,due_date,invoice_url}', true
),
(
  'service_suspended',
  'Hizmet Askıya Alındı',
  'Hizmetiniz Askıya Alındı - Acil İşlem Gerekli',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #805ad5 0%, #6b46c1 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">Luma Yazılım</h1>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="margin-top: 0;">Sayın {{customer_name}},</h2>
    <p>Ödenmemiş fatura nedeniyle <strong>{{service_name}}</strong> hizmetiniz askıya alınmıştır.</p>
    <p>Hizmetinizi yeniden aktifleştirmek için ödemenizi tamamlayın. Ödeme onaylandıktan sonra hizmetiniz otomatik olarak aktifleştirilecektir.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invoice_url}}" style="background: #805ad5; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ödeme Yap ve Aktifleştir</a>
    </div>
    <p style="color: #e53e3e; font-size: 13px; font-weight: bold;">Uzun süreli askıda kalan hesaplar kalıcı olarak silinebilir.</p>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;"><p>© 2026 Luma Yazılım</p></div>
</body></html>',
  '{customer_name,service_name,invoice_url}', true
),
(
  'service_activated',
  'Hizmet Aktifleştirildi',
  'Harika Haber! Hizmetiniz Yeniden Aktif',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">Luma Yazılım</h1>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="margin-top: 0;">Sayın {{customer_name}},</h2>
    <p style="text-align: center; font-size: 48px; margin: 10px 0;">✅</p>
    <p style="text-align: center; font-size: 18px; color: #276749;"><strong>{{service_name}}</strong> hizmetiniz başarıyla aktifleştirilmiştir!</p>
    <p>Hizmetiniz artık sorunsuz çalışmaktadır. Web sitenize ve tüm hizmetlerinize normal şekilde erişebilirsiniz.</p>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;"><p>© 2026 Luma Yazılım</p></div>
</body></html>',
  '{customer_name,service_name}', true
),
(
  'welcome',
  'Hoş Geldiniz',
  'Luma Yazılım''a Hoş Geldiniz!',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Hoş Geldiniz!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Luma Yazılım ailesine katıldığınız için teşekkürler</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="margin-top: 0;">Sayın {{customer_name}},</h2>
    <p>Hesabınız başarıyla oluşturulmuştur. Artık tüm hizmetlerimizden yararlanabilirsiniz.</p>
    <h3 style="color: #4a5568;">Hemen Başlayın</h3>
    <div style="padding: 12px; background: #f7fafc; border-radius: 8px; margin-bottom: 10px;">
      <strong>🌐 Domain Kayıt</strong> - Hayalinizdeki domain adını hemen kaydedin
    </div>
    <div style="padding: 12px; background: #f7fafc; border-radius: 8px; margin-bottom: 10px;">
      <strong>🖥️ Web Hosting</strong> - Hızlı ve güvenilir hosting paketlerimizi inceleyin
    </div>
    <div style="padding: 12px; background: #f7fafc; border-radius: 8px; margin-bottom: 10px;">
      <strong>💬 7/24 Destek</strong> - Her türlü sorunuz için destek ekibimiz yanınızda
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{panel_url}}" style="background: #667eea; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold;">Panelime Git</a>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;"><p>© 2026 Luma Yazılım</p></div>
</body></html>',
  '{customer_name,panel_url}', true
),
(
  'service_provisioned',
  'Yeni Hizmet Kurulumu Tamamlandı',
  'Hizmetiniz Hazır! {{service_name}} Kurulumu Tamamlandı',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">Luma Yazılım</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Hizmet Kurulumu</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="margin-top: 0;">Sayın {{customer_name}},</h2>
    <p style="text-align: center; font-size: 48px; margin: 10px 0;">🎉</p>
    <p style="text-align: center; font-size: 18px;"><strong>{{service_name}}</strong> hizmetiniz başarıyla kurulmuştur!</p>
    <div style="background: #ebf8ff; border: 1px solid #4299e1; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #2b6cb0;">Erişim Bilgileriniz</p>
      <p style="margin: 10px 0 5px;">Kullanıcı Adı: <strong>{{username}}</strong></p>
      <p style="margin: 0;">Sunucu: <strong>{{server}}</strong></p>
    </div>
    <p style="color: #e53e3e; font-size: 13px;">Güvenliğiniz için şifrenizi ilk girişte değiştirmenizi öneriyoruz.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{panel_url}}" style="background: #4299e1; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold;">Hizmeti Yönet</a>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;"><p>© 2026 Luma Yazılım</p></div>
</body></html>',
  '{customer_name,service_name,username,server,panel_url}', true
),
(
  'password_reset',
  'Şifre Sıfırlama',
  'Şifre Sıfırlama Talebi',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">Luma Yazılım</h1>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="margin-top: 0;">Sayın {{customer_name}},</h2>
    <p>Hesabınız için bir şifre sıfırlama talebi aldık.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reset_url}}" style="background: #667eea; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold;">Şifremi Sıfırla</a>
    </div>
    <p style="color: #718096; font-size: 13px;">Bu bağlantı 1 saat geçerlidir. Talebi siz yapmadıysanız bu e-postayı görmezden gelin.</p>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;"><p>© 2026 Luma Yazılım</p></div>
</body></html>',
  '{customer_name,reset_url}', true
),
(
  'domain_renewal_reminder',
  'Domain Yenileme Hatırlatması',
  'Domain Yenileme: {{domain_name}} süresi dolmak üzere',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #38b2ac 0%, #319795 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">Luma Yazılım</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Domain Yenileme</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="margin-top: 0;">Sayın {{customer_name}},</h2>
    <p><strong>{{domain_name}}</strong> alan adınızın süresi <strong>{{expiry_date}}</strong> tarihinde sona erecektir.</p>
    <div style="background: #e6fffa; border: 1px solid #38b2ac; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #285e61;">Kalan Süre</p>
      <p style="margin: 10px 0 0; font-size: 28px; font-weight: bold; color: #234e52;">{{days_remaining}} Gün</p>
    </div>
    <p>Süresi dolan domainler başkaları tarafından kaydedilebilir. Lütfen zamanında yenileyin.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{renewal_url}}" style="background: #38b2ac; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold;">Şimdi Yenile</a>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;"><p>© 2026 Luma Yazılım</p></div>
</body></html>',
  '{customer_name,domain_name,expiry_date,days_remaining,renewal_url}', true
)
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;

-- ---------------------------------------------------------------------------
-- 4. Ticket Departments
-- ---------------------------------------------------------------------------
INSERT INTO ticket_departments (name, slug, description, email, is_active, sort_order) VALUES
  ('Teknik Destek', 'teknik', 'Hosting, sunucu, cPanel, e-posta yapılandırması ve teknik altyapı sorunları için destek alın.', 'teknik@lumayazilim.com', true, 1),
  ('Faturalandırma', 'fatura', 'Fatura, ödeme, iade talepleri ve hesap bakiyesi ile ilgili tüm finansal işlemler.', 'fatura@lumayazilim.com', true, 2),
  ('Satış', 'satis', 'Yeni hizmet satın alma, mevcut paket yükseltme, özel teklifler ve toplu alım fırsatları.', 'satis@lumayazilim.com', true, 3),
  ('Domain Yönetimi', 'domain', 'Domain kayıt, transfer, DNS yapılandırması, nameserver değişikliği ve WHOIS güncellemeleri.', 'domain@lumayazilim.com', true, 4),
  ('Güvenlik', 'guvenlik', 'SSL sertifikaları, güvenlik duvarı, DDoS koruma, hesap güvenliği ve malware temizleme.', 'guvenlik@lumayazilim.com', true, 5),
  ('Genel', 'genel', 'Yukarıdaki kategorilere uymayan genel sorular, öneriler ve geri bildirimler.', 'destek@lumayazilim.com', true, 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  email = EXCLUDED.email;
