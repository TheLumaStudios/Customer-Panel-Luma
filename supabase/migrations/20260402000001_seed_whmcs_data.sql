-- ============================================================================
-- Seed Data: WHMCS Automation Tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. System Settings (Otomasyon, Gecikme Faizi, SMTP)
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
  ('auto_invoice_enabled', 'true', 'boolean'),
  ('invoice_days_before_renewal', '14', 'number'),
  ('auto_suspend_enabled', 'true', 'boolean'),
  ('auto_suspend_days_overdue', '7', 'number'),
  ('auto_terminate_days_suspended', '30', 'number'),
  ('late_fee_enabled', 'false', 'boolean'),
  ('late_fee_type', 'percentage', 'string'),
  ('late_fee_amount', '5', 'number'),
  ('late_fee_grace_days', '3', 'number'),
  ('smtp_host', '', 'string'),
  ('smtp_port', '587', 'number'),
  ('smtp_user', '', 'string'),
  ('smtp_password', '', 'string'),
  ('smtp_from_email', '', 'string'),
  ('smtp_from_name', 'Luma Yazılım', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Cron Jobs
-- ---------------------------------------------------------------------------
INSERT INTO cron_jobs (job_name, description, schedule, is_active) VALUES
  ('auto_invoice', 'Yenileme tarihine yaklaşan hosting ve domain hizmetleri için otomatik fatura oluşturur.', '0 2 * * *', true),
  ('auto_suspend', 'Vadesi geçmiş ödenmemiş faturaları olan hosting hesaplarını otomatik askıya alır.', '0 3 * * *', true),
  ('auto_terminate', 'Uzun süredir askıda olan hosting hesaplarını otomatik sonlandırır ve kaynakları serbest bırakır.', '0 4 * * *', true),
  ('email_reminders', 'Vadesi yaklaşan ve geçen faturalar için müşterilere otomatik hatırlatma e-postaları gönderir.', '0 9 * * *', true),
  ('late_fees', 'Ödeme süresi geçen faturalara belirlenen oranda gecikme faizi uygular.', '0 1 * * *', true),
  ('provision_services', 'Ödeme tamamlanan yeni hizmetler için kurulum kuyruğunu işler (cPanel hesap açma, domain kayıt vb.).', '*/10 * * * *', true)
ON CONFLICT DO NOTHING;

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
    <p>Hesabınıza yeni bir fatura oluşturulmuştur. Fatura detayları aşağıda yer almaktadır:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background: #f7fafc;">
        <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Fatura No</td>
        <td style="padding: 12px; border: 1px solid #e2e8f0;">{{invoice_number}}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Tutar</td>
        <td style="padding: 12px; border: 1px solid #e2e8f0; font-size: 18px; color: #2d3748; font-weight: bold;">{{total}} {{currency}}</td>
      </tr>
      <tr style="background: #f7fafc;">
        <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Son Ödeme Tarihi</td>
        <td style="padding: 12px; border: 1px solid #e2e8f0; color: #e53e3e;">{{due_date}}</td>
      </tr>
    </table>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invoice_url}}" style="background: #667eea; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Faturayı Görüntüle ve Öde</a>
    </div>
    <p style="color: #718096; font-size: 13px;">Ödemenizi son ödeme tarihine kadar yapmanızı rica ederiz. Gecikmeli ödemelerde hizmetiniz askıya alınabilir.</p>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
    <p>Bu e-posta Luma Yazılım tarafından otomatik olarak gönderilmiştir.</p>
    <p>© 2026 Luma Yazılım - Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  '{customer_name,invoice_number,total,currency,due_date,invoice_url}',
  true
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
    <h1 style="color: white; margin: 0; font-size: 24px;">Luma Yazılım</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Ödeme Hatırlatması</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1a202c; margin-top: 0;">Sayın {{customer_name}},</h2>
    <p>Aşağıdaki faturanızın son ödeme tarihi yaklaşmaktadır. Hizmetlerinizin kesintisiz devam etmesi için ödemenizi zamanında yapmanızı rica ederiz.</p>
    <div style="background: #fffbeb; border: 1px solid #f6ad55; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #c05621;">⏰ Son Ödeme Tarihi: {{due_date}}</p>
      <p style="margin: 10px 0 0; color: #7b341e;">Fatura No: {{invoice_number}} | Tutar: {{total}} {{currency}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invoice_url}}" style="background: #ed8936; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Şimdi Öde</a>
    </div>
    <p style="color: #718096; font-size: 13px;">Ödemenizi zaten yaptıysanız bu hatırlatmayı dikkate almayınız.</p>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
    <p>© 2026 Luma Yazılım - Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  '{customer_name,invoice_number,total,currency,due_date,invoice_url}',
  true
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
    <h1 style="color: white; margin: 0; font-size: 24px;">Luma Yazılım</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Acil Ödeme Bildirimi</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1a202c; margin-top: 0;">Sayın {{customer_name}},</h2>
    <p>Aşağıdaki faturanızın vadesi <strong>geçmiştir</strong>. Ödeme yapılmaması durumunda hizmetleriniz askıya alınacaktır.</p>
    <div style="background: #fff5f5; border: 2px solid #e53e3e; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #c53030; font-size: 16px;">🚨 Vadesi Geçmiş Fatura</p>
      <p style="margin: 10px 0 0;">Fatura No: <strong>{{invoice_number}}</strong></p>
      <p style="margin: 5px 0 0;">Vade Tarihi: <strong style="color: #e53e3e;">{{due_date}}</strong></p>
      <p style="margin: 5px 0 0;">Tutar: <strong style="font-size: 20px;">{{total}} {{currency}}</strong></p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invoice_url}}" style="background: #e53e3e; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">Hemen Öde</a>
    </div>
    <div style="background: #f7fafc; border-radius: 8px; padding: 15px; margin-top: 20px;">
      <p style="margin: 0; font-size: 13px; color: #4a5568;"><strong>Ne olacak?</strong></p>
      <ul style="margin: 10px 0 0; padding-left: 20px; font-size: 13px; color: #718096;">
        <li>Ödeme yapılmazsa hosting hesabınız askıya alınacaktır</li>
        <li>Askıya alınan hesaplara web siteniz ve e-postalarınız erişilemez olur</li>
        <li>Uzun süreli askıda kalan hesaplar kalıcı olarak silinebilir</li>
      </ul>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
    <p>Sorun yaşıyorsanız destek ekibimizle iletişime geçin.</p>
    <p>© 2026 Luma Yazılım - Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  '{customer_name,invoice_number,total,currency,due_date,invoice_url}',
  true
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
    <h1 style="color: white; margin: 0; font-size: 24px;">Luma Yazılım</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Hizmet Durumu Bildirimi</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1a202c; margin-top: 0;">Sayın {{customer_name}},</h2>
    <p>Ödenmemiş fatura(lar) nedeniyle aşağıdaki hizmetiniz askıya alınmıştır:</p>
    <div style="background: #faf5ff; border: 1px solid #805ad5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #6b46c1;">Askıya Alınan Hizmet</p>
      <p style="margin: 10px 0 0; font-size: 20px; font-weight: bold; color: #322659;">{{service_name}}</p>
    </div>
    <p>Hizmetinizi yeniden aktifleştirmek için lütfen bekleyen ödemenizi tamamlayın. Ödeme onaylandıktan sonra hizmetiniz otomatik olarak aktifleştirilecektir.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invoice_url}}" style="background: #805ad5; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Ödeme Yap ve Aktifleştir</a>
    </div>
    <p style="color: #e53e3e; font-size: 13px; font-weight: bold;">⚠️ Uzun süreli askıda kalan hesaplar kalıcı olarak silinebilir. Lütfen en kısa sürede ödemenizi yapınız.</p>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
    <p>© 2026 Luma Yazılım - Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  '{customer_name,service_name,invoice_url}',
  true
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
    <h1 style="color: white; margin: 0; font-size: 24px;">Luma Yazılım</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Hizmet Aktifleştirme</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1a202c; margin-top: 0;">Sayın {{customer_name}},</h2>
    <div style="text-align: center; margin: 20px 0;">
      <span style="font-size: 48px;">✅</span>
    </div>
    <p style="text-align: center; font-size: 18px; color: #276749;">
      <strong>{{service_name}}</strong> hizmetiniz başarıyla aktifleştirilmiştir!
    </p>
    <p>Hizmetiniz artık sorunsuz çalışmaktadır. Web sitenize ve tüm hizmetlerinize normal şekilde erişebilirsiniz.</p>
    <div style="background: #f0fff4; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #276749;">💡 <strong>İpucu:</strong> Gelecekte hizmet kesintisi yaşamamak için otomatik ödeme yöntemini aktifleştirmeyi düşünebilirsiniz.</p>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
    <p>© 2026 Luma Yazılım - Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  '{customer_name,service_name}',
  true
),
(
  'welcome',
  'Hoş Geldiniz',
  'Luma Yazılım''a Hoş Geldiniz! 🎉',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Hoş Geldiniz! 🎉</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Luma Yazılım ailesine katıldığınız için teşekkürler</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1a202c; margin-top: 0;">Sayın {{customer_name}},</h2>
    <p>Hesabınız başarıyla oluşturulmuştur. Artık tüm hizmetlerimizden yararlanabilirsiniz.</p>
    <h3 style="color: #4a5568; margin-top: 25px;">🚀 Hemen Başlayın</h3>
    <div style="margin: 15px 0;">
      <div style="display: flex; align-items: center; padding: 12px; background: #f7fafc; border-radius: 8px; margin-bottom: 10px;">
        <span style="font-size: 24px; margin-right: 15px;">🌐</span>
        <div>
          <strong>Domain Kayıt</strong>
          <p style="margin: 2px 0 0; font-size: 13px; color: #718096;">Hayalinizdeki domain adını hemen kaydedin</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; padding: 12px; background: #f7fafc; border-radius: 8px; margin-bottom: 10px;">
        <span style="font-size: 24px; margin-right: 15px;">🖥️</span>
        <div>
          <strong>Web Hosting</strong>
          <p style="margin: 2px 0 0; font-size: 13px; color: #718096;">Hızlı ve güvenilir hosting paketlerimizi inceleyin</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; padding: 12px; background: #f7fafc; border-radius: 8px;">
        <span style="font-size: 24px; margin-right: 15px;">💬</span>
        <div>
          <strong>7/24 Destek</strong>
          <p style="margin: 2px 0 0; font-size: 13px; color: #718096;">Her türlü sorunuz için destek ekibimiz yanınızda</p>
        </div>
      </div>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{panel_url}}" style="background: #667eea; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Panelime Git</a>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
    <p>Sorularınız mı var? Destek ekibimize yazın: destek@lumayazilim.com</p>
    <p>© 2026 Luma Yazılım - Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  '{customer_name,panel_url}',
  true
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
    <h1 style="color: white; margin: 0; font-size: 24px;">Luma Yazılım</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Hizmet Kurulumu</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1a202c; margin-top: 0;">Sayın {{customer_name}},</h2>
    <div style="text-align: center; margin: 20px 0;">
      <span style="font-size: 48px;">🎉</span>
    </div>
    <p style="text-align: center; font-size: 18px;"><strong>{{service_name}}</strong> hizmetiniz başarıyla kurulmuştur!</p>
    <div style="background: #ebf8ff; border: 1px solid #4299e1; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #2b6cb0;">Erişim Bilgileriniz</p>
      <p style="margin: 10px 0 5px; font-size: 14px;">Kullanıcı Adı: <strong>{{username}}</strong></p>
      <p style="margin: 0; font-size: 14px;">Sunucu: <strong>{{server}}</strong></p>
    </div>
    <p style="color: #e53e3e; font-size: 13px;">🔒 Güvenliğiniz için şifrenizi ilk girişte değiştirmenizi öneriyoruz.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{panel_url}}" style="background: #4299e1; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Hizmeti Yönet</a>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
    <p>© 2026 Luma Yazılım - Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  '{customer_name,service_name,username,server,panel_url}',
  true
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
    <h1 style="color: white; margin: 0; font-size: 24px;">Luma Yazılım</h1>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1a202c; margin-top: 0;">Sayın {{customer_name}},</h2>
    <p>Hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reset_url}}" style="background: #667eea; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Şifremi Sıfırla</a>
    </div>
    <p style="color: #718096; font-size: 13px;">Bu bağlantı 1 saat süreyle geçerlidir. Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
    <p>© 2026 Luma Yazılım - Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  '{customer_name,reset_url}',
  true
),
(
  'domain_renewal_reminder',
  'Domain Yenileme Hatırlatması',
  'Domain Yenileme Hatırlatması: {{domain_name}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #38b2ac 0%, #319795 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Luma Yazılım</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Domain Yenileme</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1a202c; margin-top: 0;">Sayın {{customer_name}},</h2>
    <p><strong>{{domain_name}}</strong> alan adınızın süresi <strong>{{expiry_date}}</strong> tarihinde sona erecektir.</p>
    <div style="background: #e6fffa; border: 1px solid #38b2ac; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #285e61;">Kalan Süre</p>
      <p style="margin: 10px 0 0; font-size: 28px; font-weight: bold; color: #234e52;">{{days_remaining}} Gün</p>
    </div>
    <p>Domain adınızı kaybetmemek için lütfen zamanında yenileme yapınız. Süresi dolan domainler başkaları tarafından kaydedilebilir.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{renewal_url}}" style="background: #38b2ac; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Şimdi Yenile</a>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #a0aec0; font-size: 12px;">
    <p>© 2026 Luma Yazılım - Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  '{customer_name,domain_name,expiry_date,days_remaining,renewal_url}',
  true
)
ON CONFLICT (template_key) DO NOTHING;

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
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Knowledge Base Categories
-- ---------------------------------------------------------------------------
INSERT INTO kb_categories (name, slug, description, icon, sort_order, is_active) VALUES
  ('Başlangıç Rehberi', 'baslangic', 'Yeni müşteriler için temel bilgiler, hesap oluşturma ve ilk adımlar.', 'rocket', 1, true),
  ('Hosting Yönetimi', 'hosting', 'cPanel kullanımı, dosya yönetimi, veritabanları, e-posta hesapları ve sunucu ayarları.', 'server', 2, true),
  ('Domain İşlemleri', 'domain', 'Domain kayıt, transfer, DNS ayarları, nameserver yapılandırması ve WHOIS yönetimi.', 'globe', 3, true),
  ('E-posta Ayarları', 'eposta', 'E-posta hesabı oluşturma, istemci yapılandırması (Outlook, Thunderbird, mobil) ve sorun giderme.', 'mail', 4, true),
  ('SSL Sertifikaları', 'ssl', 'Ücretsiz ve ücretli SSL sertifikaları, kurulum ve yenileme işlemleri.', 'shield', 5, true),
  ('WordPress', 'wordpress', 'WordPress kurulumu, tema ve eklenti yönetimi, performans optimizasyonu ve güvenlik.', 'layout', 6, true),
  ('Faturalandırma', 'fatura', 'Fatura görüntüleme, ödeme yöntemleri, iade talepleri ve hesap bakiyesi yönetimi.', 'credit-card', 7, true),
  ('Sorun Giderme', 'sorun-giderme', 'Sık karşılaşılan hatalar, 500/403/404 hataları, bağlantı sorunları ve çözümleri.', 'wrench', 8, true),
  ('Güvenlik', 'guvenlik', 'Hesap güvenliği, iki faktörlü doğrulama, güçlü şifre oluşturma ve güvenlik önlemleri.', 'lock', 9, true),
  ('API ve Geliştirici', 'api', 'API kullanımı, webhook entegrasyonu ve geliştirici araçları.', 'code', 10, true)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Knowledge Base Articles
-- ---------------------------------------------------------------------------
INSERT INTO kb_articles (category_id, title, slug, content, excerpt, tags, views, status) VALUES

-- Başlangıç Rehberi
((SELECT id FROM kb_categories WHERE slug = 'baslangic'),
'Müşteri Paneline İlk Giriş',
'musteri-paneline-ilk-giris',
'<h2>Müşteri Paneline Nasıl Giriş Yapılır?</h2>
<p>Luma Yazılım müşteri panelinize giriş yapmak için aşağıdaki adımları izleyebilirsiniz:</p>
<ol>
<li><strong>Giriş sayfasına gidin:</strong> Tarayıcınızda panel adresimizi açın.</li>
<li><strong>E-posta adresinizi girin:</strong> Kayıt sırasında kullandığınız e-posta adresini yazın.</li>
<li><strong>Şifrenizi girin:</strong> Hesabınıza ait şifreyi girin.</li>
<li><strong>"Giriş Yap" butonuna tıklayın.</strong></li>
</ol>
<h3>Şifremi Unuttum</h3>
<p>Şifrenizi unuttuysanız, giriş sayfasındaki "Şifremi Unuttum" bağlantısına tıklayarak e-posta adresinize sıfırlama bağlantısı gönderebilirsiniz.</p>
<h3>Güvenlik Önerileri</h3>
<ul>
<li>En az 8 karakter uzunluğunda, büyük/küçük harf, rakam ve özel karakter içeren şifreler kullanın.</li>
<li>Şifrenizi kimseyle paylaşmayın.</li>
<li>Düzenli aralıklarla şifrenizi değiştirin.</li>
</ul>',
'Müşteri paneline ilk giriş yapma, şifre sıfırlama ve güvenlik önerileri.',
'{başlangıç,giriş,şifre,panel}',
42, 'published'),

-- Hosting Yönetimi
((SELECT id FROM kb_categories WHERE slug = 'hosting'),
'cPanel''e Giriş ve Temel Kullanım',
'cpanel-giris-temel-kullanim',
'<h2>cPanel Nedir?</h2>
<p>cPanel, web hosting hesabınızı yönetmenizi sağlayan web tabanlı bir kontrol panelidir. Dosya yönetimi, veritabanı oluşturma, e-posta hesapları ve daha birçok işlemi kolayca yapabilirsiniz.</p>
<h3>cPanel''e Nasıl Giriş Yapılır?</h3>
<ol>
<li>Müşteri panelinizden "Hostingim" sayfasına gidin.</li>
<li>İlgili hosting paketinin yanındaki "Detaylar" butonuna tıklayın.</li>
<li>Sunucu bilgilerini (IP, kullanıcı adı, şifre) kopyalayın.</li>
<li>Tarayıcınızda <code>https://sunucu-ip:2083</code> adresine gidin.</li>
<li>Kullanıcı adı ve şifrenizle giriş yapın.</li>
</ol>
<h3>cPanel Ana Ekranı</h3>
<p>cPanel ana ekranında sık kullanılan araçlar şunlardır:</p>
<ul>
<li><strong>Dosya Yöneticisi:</strong> Web sitenizin dosyalarını yükleyin, düzenleyin ve yönetin.</li>
<li><strong>MySQL Veritabanları:</strong> Veritabanı oluşturun ve yönetin.</li>
<li><strong>E-posta Hesapları:</strong> Profesyonel e-posta adresleri oluşturun.</li>
<li><strong>Yedekler:</strong> Hosting hesabınızın yedeğini alın.</li>
<li><strong>SSL/TLS:</strong> SSL sertifikası yönetimi yapın.</li>
</ul>',
'cPanel giriş yöntemleri, temel özellikleri ve ilk yapılması gereken ayarlar.',
'{cpanel,hosting,giriş,dosya yönetimi,veritabanı}',
156, 'published'),

-- Hosting Yönetimi - FTP
((SELECT id FROM kb_categories WHERE slug = 'hosting'),
'FTP ile Dosya Yükleme',
'ftp-ile-dosya-yukleme',
'<h2>FTP Nedir ve Neden Kullanılır?</h2>
<p>FTP (File Transfer Protocol), bilgisayarınızdaki dosyaları hosting sunucunuza aktarmanın en yaygın yoludur. Özellikle büyük dosyalar veya çok sayıda dosya yüklerken idealdir.</p>
<h3>FTP Bağlantı Bilgileri</h3>
<table>
<tr><th>Alan</th><th>Değer</th></tr>
<tr><td>Sunucu</td><td>Hosting IP adresiniz veya ftp.alanadi.com</td></tr>
<tr><td>Kullanıcı Adı</td><td>cPanel kullanıcı adınız</td></tr>
<tr><td>Şifre</td><td>cPanel şifreniz</td></tr>
<tr><td>Port</td><td>21 (FTP) veya 22 (SFTP)</td></tr>
</table>
<h3>FileZilla ile Bağlantı</h3>
<ol>
<li><a href="https://filezilla-project.org/">FileZilla</a>''yı indirin ve kurun.</li>
<li>Üst kısımdaki hızlı bağlantı çubuğuna bilgilerinizi girin.</li>
<li>"Hızlı Bağlan" butonuna tıklayın.</li>
<li>Sol panelde bilgisayarınız, sağ panelde sunucunuz görünecektir.</li>
<li>Dosyaları sürükle-bırak ile aktarın.</li>
</ol>
<h3>Önemli Notlar</h3>
<ul>
<li>Web sitenizin dosyalarını <code>public_html</code> klasörüne yükleyin.</li>
<li>Mümkünse SFTP (port 22) kullanın - daha güvenlidir.</li>
<li>Yükleme sırasında bağlantıyı kesmemeye dikkat edin.</li>
</ul>',
'FileZilla ve diğer FTP istemcileri ile hosting hesabınıza dosya yükleme rehberi.',
'{ftp,sftp,filezilla,dosya yükleme,hosting}',
89, 'published'),

-- Domain İşlemleri
((SELECT id FROM kb_categories WHERE slug = 'domain'),
'DNS Kayıtları Nasıl Yönetilir?',
'dns-kayitlari-nasil-yonetilir',
'<h2>DNS Nedir?</h2>
<p>DNS (Domain Name System), alan adlarını IP adreslerine çeviren sistemdir. DNS kayıtlarınızı doğru yapılandırarak web sitenizi, e-postalarınızı ve diğer hizmetlerinizi yönlendirebilirsiniz.</p>
<h3>Yaygın DNS Kayıt Türleri</h3>
<table>
<tr><th>Kayıt Türü</th><th>Açıklama</th><th>Örnek</th></tr>
<tr><td><strong>A</strong></td><td>Alan adını IPv4 adresine yönlendirir</td><td>@ → 185.230.100.50</td></tr>
<tr><td><strong>AAAA</strong></td><td>Alan adını IPv6 adresine yönlendirir</td><td>@ → 2001:db8::1</td></tr>
<tr><td><strong>CNAME</strong></td><td>Bir alan adını başka bir alan adına yönlendirir</td><td>www → alanadi.com</td></tr>
<tr><td><strong>MX</strong></td><td>E-posta sunucusunu belirler</td><td>@ → mail.alanadi.com (öncelik: 10)</td></tr>
<tr><td><strong>TXT</strong></td><td>Metin bilgisi saklar (SPF, DKIM vb.)</td><td>@ → v=spf1 include:_spf.google.com ~all</td></tr>
<tr><td><strong>NS</strong></td><td>Nameserver''ları belirler</td><td>@ → ns1.thelumastudios.com</td></tr>
</table>
<h3>DNS Kayıtlarını Değiştirme</h3>
<ol>
<li>Müşteri panelinizde "Domainlerim" sayfasına gidin.</li>
<li>İlgili domainin yanındaki "DNS Yönetimi" butonuna tıklayın.</li>
<li>Mevcut kayıtları düzenleyin veya yeni kayıt ekleyin.</li>
<li>Değişikliklerin yayılması 24-48 saat sürebilir (propagasyon).</li>
</ol>',
'DNS kayıt türleri (A, AAAA, CNAME, MX, TXT) ve yönetim rehberi.',
'{dns,domain,nameserver,a kaydı,mx,cname,txt}',
203, 'published'),

-- E-posta Ayarları
((SELECT id FROM kb_categories WHERE slug = 'eposta'),
'Outlook''ta E-posta Hesabı Kurulumu',
'outlook-eposta-kurulumu',
'<h2>Microsoft Outlook E-posta Yapılandırması</h2>
<p>Hosting hesabınızda oluşturduğunuz e-posta adresini Microsoft Outlook ile kullanmak için aşağıdaki adımları izleyin.</p>
<h3>Gerekli Bilgiler</h3>
<table>
<tr><th>Ayar</th><th>Değer</th></tr>
<tr><td>Gelen Sunucu (IMAP)</td><td>mail.alanadi.com</td></tr>
<tr><td>Gelen Port (IMAP)</td><td>993 (SSL)</td></tr>
<tr><td>Giden Sunucu (SMTP)</td><td>mail.alanadi.com</td></tr>
<tr><td>Giden Port (SMTP)</td><td>465 (SSL) veya 587 (TLS)</td></tr>
<tr><td>Kullanıcı Adı</td><td>info@alanadi.com (tam e-posta adresi)</td></tr>
<tr><td>Şifre</td><td>cPanel''den oluşturduğunuz e-posta şifresi</td></tr>
</table>
<h3>Outlook Kurulum Adımları</h3>
<ol>
<li>Outlook''u açın ve <strong>Dosya → Hesap Ekle</strong> yolunu izleyin.</li>
<li>"Gelişmiş seçenekler" bağlantısına tıklayın.</li>
<li>"Hesabımı el ile ayarlayalım" seçeneğini işaretleyin.</li>
<li>Hesap türü olarak <strong>IMAP</strong> seçin.</li>
<li>Yukarıdaki sunucu bilgilerini girin.</li>
<li>"Bağlan" butonuna tıklayın ve şifrenizi girin.</li>
</ol>
<h3>Sorun Giderme</h3>
<ul>
<li>Bağlantı hatası alıyorsanız SSL/TLS ayarlarını kontrol edin.</li>
<li>Şifrenizin doğru olduğundan emin olun.</li>
<li>Güvenlik duvarının 993 ve 465 portlarını engellemediğini kontrol edin.</li>
</ul>',
'Microsoft Outlook''ta hosting e-posta hesabınızı IMAP/SMTP ile yapılandırma adımları.',
'{outlook,e-posta,imap,smtp,kurulum}',
178, 'published'),

-- SSL Sertifikaları
((SELECT id FROM kb_categories WHERE slug = 'ssl'),
'Ücretsiz SSL Sertifikası Kurulumu (Let''s Encrypt)',
'ucretsiz-ssl-lets-encrypt',
'<h2>Let''s Encrypt Ücretsiz SSL Sertifikası</h2>
<p>Tüm hosting paketlerimizde Let''s Encrypt ücretsiz SSL sertifikası dahildir. cPanel üzerinden birkaç tıklama ile aktifleştirebilirsiniz.</p>
<h3>SSL Aktifleştirme Adımları</h3>
<ol>
<li>cPanel''e giriş yapın.</li>
<li><strong>Güvenlik</strong> bölümünde <strong>"SSL/TLS Status"</strong> seçeneğine tıklayın.</li>
<li>SSL sertifikası yüklemek istediğiniz domain''i seçin.</li>
<li><strong>"Run AutoSSL"</strong> butonuna tıklayın.</li>
<li>İşlem birkaç dakika sürebilir. Tamamlandığında yeşil kilit ikonu görünecektir.</li>
</ol>
<h3>HTTPS Yönlendirmesi</h3>
<p>SSL aktif olduktan sonra HTTP trafiğini HTTPS''ye yönlendirmek için <code>.htaccess</code> dosyanıza şu kuralları ekleyin:</p>
<pre><code>RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]</code></pre>
<h3>Otomatik Yenileme</h3>
<p>Let''s Encrypt sertifikaları 90 günlük sürelerle verilir ancak sunucumuz otomatik yenileme yapar. Manuel işlem gerekmez.</p>',
'Let''s Encrypt ücretsiz SSL sertifikası kurulumu ve HTTPS yönlendirme ayarları.',
'{ssl,https,lets encrypt,güvenlik,sertifika}',
134, 'published'),

-- WordPress
((SELECT id FROM kb_categories WHERE slug = 'wordpress'),
'WordPress Hızlandırma ve Optimizasyon',
'wordpress-hizlandirma-optimizasyon',
'<h2>WordPress Sitenizi Hızlandırın</h2>
<p>Yavaş bir web sitesi ziyaretçi kaybına ve SEO sıralamanızın düşmesine neden olur. Aşağıdaki adımlarla WordPress sitenizi önemli ölçüde hızlandırabilirsiniz.</p>
<h3>1. Önbellek (Cache) Kullanın</h3>
<p>Bir önbellek eklentisi kurarak sayfa yüklenme sürelerini büyük ölçüde azaltabilirsiniz:</p>
<ul>
<li><strong>LiteSpeed Cache:</strong> Sunucumuzla en uyumlu eklenti (önerilen)</li>
<li><strong>WP Super Cache:</strong> Basit ve etkili</li>
<li><strong>W3 Total Cache:</strong> Gelişmiş ayarlar için</li>
</ul>
<h3>2. Görselleri Optimize Edin</h3>
<ul>
<li>Görselleri yüklemeden önce sıkıştırın (TinyPNG, ShortPixel)</li>
<li>WebP formatını destekleyen bir eklenti kullanın</li>
<li>Lazy Loading aktifleştirin (WordPress 5.5+ varsayılan olarak destekler)</li>
</ul>
<h3>3. Gereksiz Eklentileri Kaldırın</h3>
<p>Her eklenti sitenizi yavaşlatır. Kullanmadığınız eklentileri sadece devre dışı bırakmak yetmez, tamamen silin.</p>
<h3>4. PHP Sürümünü Güncelleyin</h3>
<p>cPanel → "MultiPHP Manager" bölümünden PHP 8.2 veya üstünü seçin. Yeni PHP sürümleri %20-30 daha hızlıdır.</p>
<h3>5. Veritabanını Optimize Edin</h3>
<p>phpMyAdmin veya WP-Optimize eklentisi ile veritabanınızdaki gereksiz verileri temizleyin (post revisions, spam yorumlar, transients).</p>',
'WordPress performans optimizasyonu: önbellek, görsel sıkıştırma, PHP güncellemesi ve veritabanı temizliği.',
'{wordpress,hız,optimizasyon,cache,önbellek,performans}',
267, 'published'),

-- Sorun Giderme
((SELECT id FROM kb_categories WHERE slug = 'sorun-giderme'),
'500 Internal Server Error Çözümü',
'500-internal-server-error-cozumu',
'<h2>500 Internal Server Error Nedir?</h2>
<p>500 hatası, sunucu tarafında bir sorun olduğunu gösterir. Birçok farklı nedeni olabilir ancak çoğu kolayca çözülebilir.</p>
<h3>Yaygın Nedenler ve Çözümleri</h3>
<h4>1. Bozuk .htaccess Dosyası</h4>
<p>En yaygın neden budur. Çözüm:</p>
<ol>
<li>cPanel → Dosya Yöneticisi''ne gidin.</li>
<li><code>.htaccess</code> dosyasını bulun (<code>public_html</code> içinde).</li>
<li>Dosyayı <code>.htaccess_backup</code> olarak yeniden adlandırın.</li>
<li>Sitenizi yenileyin. Çalışıyorsa sorun .htaccess dosyasındadır.</li>
<li>Yeni bir .htaccess dosyası oluşturun veya mevcut olanı düzeltin.</li>
</ol>
<h4>2. PHP Bellek Limiti</h4>
<p><code>wp-config.php</code> dosyasına şu satırı ekleyin:</p>
<pre><code>define(''WP_MEMORY_LIMIT'', ''256M'');</code></pre>
<h4>3. Eklenti Çakışması</h4>
<ol>
<li>cPanel → Dosya Yöneticisi''nden <code>wp-content/plugins</code> klasörüne gidin.</li>
<li>Klasörün adını <code>plugins_disabled</code> olarak değiştirin.</li>
<li>Site çalışıyorsa eklentileri teker teker aktifleştirerek sorunu bulun.</li>
</ol>
<h4>4. Hatalı Dosya İzinleri</h4>
<ul>
<li>Klasörler: <strong>755</strong></li>
<li>Dosyalar: <strong>644</strong></li>
<li>wp-config.php: <strong>600</strong></li>
</ul>
<p>Bu adımlar sorununuzu çözmediyse lütfen destek ekibimizle iletişime geçin.</p>',
'500 Internal Server Error hatasının nedenleri ve adım adım çözüm yöntemleri.',
'{500 hatası,server error,htaccess,php,sorun giderme}',
312, 'published'),

-- Faturalandırma
((SELECT id FROM kb_categories WHERE slug = 'fatura'),
'Ödeme Yöntemleri ve Fatura İşlemleri',
'odeme-yontemleri-fatura-islemleri',
'<h2>Desteklenen Ödeme Yöntemleri</h2>
<p>Luma Yazılım olarak çeşitli ödeme yöntemlerini destekliyoruz:</p>
<h3>Kredi/Banka Kartı (iyzico)</h3>
<p>Visa, Mastercard, Troy kartlarınızla güvenli ödeme yapabilirsiniz. Taksit seçenekleri mevcuttur.</p>
<ol>
<li>Fatura detay sayfasına gidin.</li>
<li>"Kredi Kartı ile Öde" butonuna tıklayın.</li>
<li>iyzico güvenli ödeme sayfasında kart bilgilerinizi girin.</li>
<li>Ödeme onaylandıktan sonra faturanız otomatik olarak "Ödendi" durumuna geçer.</li>
</ol>
<h3>Havale / EFT</h3>
<p>Banka hesaplarımıza havale yaparak ödeme yapabilirsiniz:</p>
<ol>
<li>Fatura detay sayfasındaki banka hesap bilgilerini kullanarak havale yapın.</li>
<li>Açıklama kısmına fatura numaranızı yazın.</li>
<li>"Havale Bildirimi" formunu doldurun ve dekont yükleyin.</li>
<li>Onay sonrası faturanız "Ödendi" olarak güncellenir (1-2 iş günü).</li>
</ol>
<h3>Bakiye ile Ödeme</h3>
<p>Hesabınızda yeterli bakiye varsa tek tıkla ödeme yapabilirsiniz.</p>
<h3>Otomatik Fatura</h3>
<p>Hosting ve domain yenileme faturaları, hizmet bitiş tarihinden 14 gün önce otomatik olarak oluşturulur. Son ödeme tarihine kadar ödeme yapılmazsa hizmetiniz askıya alınabilir.</p>',
'Kredi kartı, havale/EFT, bakiye ile ödeme yöntemleri ve fatura süreçleri hakkında bilgi.',
'{ödeme,fatura,iyzico,havale,kredi kartı,bakiye}',
95, 'published')

ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Announcements (Örnek duyurular)
-- ---------------------------------------------------------------------------
INSERT INTO announcements (title, content, type, is_active, show_on_login, starts_at, ends_at) VALUES
(
  'Yeni Müşteri Paneli Kullanıma Açıldı!',
  'Müşteri panelimiz tamamen yenilendi! Yeni arayüzümüzle hizmetlerinizi daha kolay yönetebilir, faturalarınızı takip edebilir ve destek talebi oluşturabilirsiniz. Bilgi bankamızda detaylı kullanım rehberlerini bulabilirsiniz.',
  'info',
  true,
  true,
  now(),
  now() + interval '30 days'
),
(
  'Planlı Bakım Çalışması - 10 Nisan 2026',
  'Altyapı geliştirme çalışmalarımız kapsamında 10 Nisan 2026 tarihinde saat 03:00-05:00 arasında sunucularımızda kısa süreli kesintiler yaşanabilir. Bu süre zarfında web siteleriniz ve e-posta hizmetleriniz geçici olarak erişilemez olabilir. Anlayışınız için teşekkür ederiz.',
  'maintenance',
  true,
  false,
  now(),
  '2026-04-11T05:00:00Z'
)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Server Status (Mevcut sunuculardan örnek)
-- ---------------------------------------------------------------------------
INSERT INTO server_status (server_name, status, message, updated_at)
SELECT
  s.hostname,
  'operational',
  'Tüm hizmetler sorunsuz çalışmaktadır.',
  now()
FROM servers s
WHERE NOT EXISTS (
  SELECT 1 FROM server_status ss WHERE ss.server_name = s.hostname
)
LIMIT 10;

-- Eğer servers tablosu boşsa varsayılan sunucular ekle
INSERT INTO server_status (server_name, status, message, updated_at) VALUES
  ('web1.lumayazilim.com', 'operational', 'Tüm hizmetler sorunsuz çalışmaktadır.', now()),
  ('web2.lumayazilim.com', 'operational', 'Tüm hizmetler sorunsuz çalışmaktadır.', now()),
  ('mail.lumayazilim.com', 'operational', 'E-posta hizmetleri aktif.', now()),
  ('dns1.lumayazilim.com', 'operational', 'DNS çözümleme hizmeti aktif.', now()),
  ('dns2.lumayazilim.com', 'operational', 'DNS çözümleme hizmeti aktif.', now()),
  ('db1.lumayazilim.com', 'operational', 'Veritabanı sunucusu aktif.', now())
ON CONFLICT DO NOTHING;
