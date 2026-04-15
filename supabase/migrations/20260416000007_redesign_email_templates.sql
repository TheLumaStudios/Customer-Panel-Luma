-- ============================================================================
-- Email Template Redesign - Luma Brand Identity
-- Tüm template'ler tutarlı indigo/slate marka kimliğiyle güncelleniyor
-- + Yeni büyüme motoru template'leri ekleniyor
-- ============================================================================

-- 1. invoice_created
UPDATE email_templates SET subject = '{{invoice_number}} Numaralı Faturanız Oluşturuldu', body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Yeni Fatura</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Faturanız hazırlandı, ödeme bekleniyor</p>
  </div>
  <!-- Body -->
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Hesabınıza yeni bir fatura oluşturulmuştur.</p>
    <!-- Info Card -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Fatura No</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1e293b;font-size:14px;">{{invoice_number}}</td></tr>
        <tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;font-size:13px;">Son Ödeme</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#dc2626;font-size:14px;">{{due_date}}</td></tr>
        <tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;font-size:13px;">Toplam</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#1e293b;font-size:20px;">{{total}} {{currency}}</td></tr>
      </table>
    </div>
    <!-- CTA -->
    <div style="text-align:center;margin:0 0 24px;">
      <a href="{{invoice_url}}" style="display:inline-block;background:#4F46E5;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Faturayı Görüntüle ve Öde</a>
    </div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">Ödemenizi son ödeme tarihine kadar yapmanızı rica ederiz.</p>
  </div>
  <!-- Footer -->
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0 0 4px;">Bu e-posta Luma Yazılım tarafından otomatik olarak gönderilmiştir.</p>
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>' WHERE template_key = 'invoice_created';

-- 2. invoice_reminder
UPDATE email_templates SET subject = 'Hatırlatma: {{invoice_number}} Faturanızın Vadesi Yaklaşıyor', body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Ödeme Hatırlatması</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Faturanızın son ödeme tarihi yaklaşıyor</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Aşağıdaki faturanızın son ödeme tarihi yaklaşmaktadır. Hizmetlerinizin kesintisiz devam etmesi için ödemenizi zamanında yapmanızı rica ederiz.</p>
    <div style="background:#fffbeb;border:1px solid #fbbf24;border-left:4px solid #f59e0b;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-weight:700;color:#92400e;font-size:15px;">Son Ödeme: {{due_date}}</p>
      <p style="margin:0;color:#78350f;font-size:13px;">Fatura No: {{invoice_number}} · Tutar: <strong>{{total}} {{currency}}</strong></p>
    </div>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="{{invoice_url}}" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Şimdi Öde</a>
    </div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">Ödemenizi zaten yaptıysanız bu hatırlatmayı dikkate almayınız.</p>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>' WHERE template_key = 'invoice_reminder';

-- 3. invoice_overdue
UPDATE email_templates SET subject = 'ACİL: {{invoice_number}} Faturanızın Vadesi Geçti!', body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Vadesi Geçmiş Fatura</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Acil ödeme yapmanız gerekmektedir</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Aşağıdaki faturanızın vadesi <strong>geçmiştir</strong>. Ödeme yapılmaması durumunda hizmetleriniz askıya alınacaktır.</p>
    <div style="background:#fef2f2;border:2px solid #ef4444;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#991b1b;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Vadesi Geçmiş</p>
      <p style="margin:0 0 8px;font-size:28px;font-weight:800;color:#1e293b;">{{total}} {{currency}}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">Fatura: {{invoice_number}} · Vade: {{due_date}}</p>
    </div>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="{{invoice_url}}" style="display:inline-block;background:#ef4444;color:#fff;padding:14px 48px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Hemen Öde</a>
    </div>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:0 0 8px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1e293b;">Ödenmezse ne olur?</p>
      <ul style="margin:0;padding:0 0 0 16px;font-size:12px;color:#64748b;line-height:1.8;">
        <li>Hosting hesabınız askıya alınır</li>
        <li>Web siteniz ve e-postalarınız erişilemez olur</li>
        <li>Uzun süreli askıda kalan hesaplar kalıcı olarak silinebilir</li>
      </ul>
    </div>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0 0 4px;">Sorun yaşıyorsanız destek@lumayazilim.com adresinden bize ulaşın.</p>
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>' WHERE template_key = 'invoice_overdue';

-- 4. service_suspended
UPDATE email_templates SET subject = 'Hizmetiniz Askıya Alındı - {{service_name}}', body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Hizmet Askıya Alındı</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Ödenmemiş fatura nedeniyle aşağıdaki hizmetiniz askıya alınmıştır:</p>
    <div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#6d28d9;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Askıya Alınan Hizmet</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#1e293b;">{{service_name}}</p>
    </div>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Hizmetinizi yeniden aktifleştirmek için bekleyen ödemenizi tamamlayın. Ödeme sonrası hizmetiniz otomatik aktifleşir.</p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="{{invoice_url}}" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Ödeme Yap ve Aktifleştir</a>
    </div>
    <p style="font-size:12px;color:#ef4444;font-weight:500;text-align:center;margin:0;">Uzun süreli askıda kalan hesaplar kalıcı olarak silinebilir.</p>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>' WHERE template_key = 'service_suspended';

-- 5. service_activated
UPDATE email_templates SET subject = 'Hizmetiniz Aktif! {{service_name}}', body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Hizmet Aktif!</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <div style="text-align:center;margin:0 0 20px;"><span style="font-size:48px;">&#9989;</span></div>
    <p style="text-align:center;font-size:18px;color:#059669;font-weight:700;margin:0 0 8px;">{{service_name}}</p>
    <p style="text-align:center;font-size:14px;color:#475569;margin:0 0 24px;">hizmetiniz başarıyla aktifleştirilmiştir!</p>
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px 16px;margin:0 0 24px;">
      <p style="margin:0;font-size:13px;color:#065f46;">Hizmetiniz artık sorunsuz çalışmaktadır. Gelecekte kesinti yaşamamak için cüzdanınıza bakiye yükleyebilirsiniz.</p>
    </div>
    <div style="text-align:center;">
      <a href="{{panel_url}}" style="display:inline-block;background:#10b981;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Panele Git</a>
    </div>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>',
variables = '{customer_name,service_name,panel_url}'
WHERE template_key = 'service_activated';

-- 6. welcome
UPDATE email_templates SET subject = 'Luma''ya Hoş Geldiniz!', body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);border-radius:16px 16px 0 0;padding:48px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:26px;font-weight:700;margin:0;">Hoş Geldiniz!</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:10px 0 0;">Luma ailesine katıldığınız için teşekkür ederiz</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Hesabınız başarıyla oluşturuldu. Artık tüm hizmetlerimizden yararlanabilirsiniz.</p>
    <p style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 16px;">Hemen Başlayın</p>
    <!-- Feature cards -->
    <div style="margin:0 0 8px;background:#f8fafc;border-radius:10px;padding:14px 16px;border:1px solid #e2e8f0;">
      <table style="width:100%;"><tr>
        <td style="width:36px;vertical-align:top;"><span style="font-size:22px;">&#127760;</span></td>
        <td><strong style="font-size:13px;color:#1e293b;">Domain Kayıt</strong><br><span style="font-size:12px;color:#64748b;">Hayalinizdeki alan adını hemen kaydedin</span></td>
      </tr></table>
    </div>
    <div style="margin:0 0 8px;background:#f8fafc;border-radius:10px;padding:14px 16px;border:1px solid #e2e8f0;">
      <table style="width:100%;"><tr>
        <td style="width:36px;vertical-align:top;"><span style="font-size:22px;">&#128421;</span></td>
        <td><strong style="font-size:13px;color:#1e293b;">Web Hosting</strong><br><span style="font-size:12px;color:#64748b;">Yüksek performanslı hosting paketlerimizi inceleyin</span></td>
      </tr></table>
    </div>
    <div style="margin:0 0 8px;background:#f8fafc;border-radius:10px;padding:14px 16px;border:1px solid #e2e8f0;">
      <table style="width:100%;"><tr>
        <td style="width:36px;vertical-align:top;"><span style="font-size:22px;">&#128176;</span></td>
        <td><strong style="font-size:13px;color:#1e293b;">%50 Bonus Bakiye</strong><br><span style="font-size:12px;color:#64748b;">Cüzdanınıza 1000&#8378; yükleyin, 1500&#8378; kullanın</span></td>
      </tr></table>
    </div>
    <div style="margin:0 0 24px;background:#f8fafc;border-radius:10px;padding:14px 16px;border:1px solid #e2e8f0;">
      <table style="width:100%;"><tr>
        <td style="width:36px;vertical-align:top;"><span style="font-size:22px;">&#128172;</span></td>
        <td><strong style="font-size:13px;color:#1e293b;">7/24 Destek</strong><br><span style="font-size:12px;color:#64748b;">Her türlü sorunuz için destek ekibimiz yanınızda</span></td>
      </tr></table>
    </div>
    <div style="text-align:center;margin:0 0 16px;">
      <a href="{{panel_url}}" style="display:inline-block;background:#4F46E5;color:#fff;padding:14px 48px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Panelime Git</a>
    </div>
    <!-- Referral -->
    <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:16px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#4338ca;">Arkadaşını Getir, Kazan!</p>
      <p style="margin:0;font-size:12px;color:#6366f1;">Referans linkinizi paylaşın, arkadaşınızın her ödemesinden %10 cüzdanınıza iade edilsin.</p>
    </div>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0 0 4px;">Sorularınız mı var? destek@lumayazilim.com</p>
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>' WHERE template_key = 'welcome';

-- 7. service_provisioned
UPDATE email_templates SET subject = 'Hizmetiniz Hazır! {{service_name}}', body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Kurulum Tamamlandı!</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <div style="text-align:center;margin:0 0 20px;"><span style="font-size:48px;">&#127881;</span></div>
    <p style="text-align:center;font-size:18px;font-weight:700;color:#1e293b;margin:0 0 24px;">{{service_name}} hizmetiniz hazır!</p>
    <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 12px;font-weight:600;color:#1d4ed8;font-size:14px;">Erişim Bilgileriniz</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Kullanıcı Adı</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1e293b;font-family:monospace;">{{username}}</td></tr>
        <tr style="border-top:1px solid #bfdbfe;"><td style="padding:6px 0;color:#64748b;font-size:13px;">Sunucu</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1e293b;font-family:monospace;">{{server}}</td></tr>
      </table>
    </div>
    <p style="font-size:12px;color:#ef4444;text-align:center;margin:0 0 24px;">Güvenliğiniz için şifrenizi ilk girişte değiştirmenizi öneriyoruz.</p>
    <div style="text-align:center;">
      <a href="{{panel_url}}" style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Hizmeti Yönet</a>
    </div>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>' WHERE template_key = 'service_provisioned';

-- 8. password_reset
UPDATE email_templates SET subject = 'Şifre Sıfırlama Talebi', body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Şifre Sıfırlama</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="{{reset_url}}" style="display:inline-block;background:#4F46E5;color:#fff;padding:14px 48px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Şifremi Sıfırla</a>
    </div>
    <div style="background:#f8fafc;border-radius:8px;padding:14px 16px;margin:0 0 8px;">
      <p style="margin:0;font-size:12px;color:#64748b;">Bu bağlantı 1 saat süreyle geçerlidir. Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
    </div>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>' WHERE template_key = 'password_reset';

-- 9. domain_renewal_reminder
UPDATE email_templates SET subject = 'Domain Yenileme: {{domain_name}} süresi doluyor!', body_html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#14b8a6 0%,#0d9488 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Domain Yenileme</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;"><strong>{{domain_name}}</strong> alan adınızın süresi <strong>{{expiry_date}}</strong> tarihinde sona erecektir.</p>
    <div style="background:#f0fdfa;border:1px solid #5eead4;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#0d9488;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Kalan Süre</p>
      <p style="margin:0;font-size:36px;font-weight:800;color:#1e293b;">{{days_remaining}} gün</p>
    </div>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Domain adınızı kaybetmemek için lütfen zamanında yenileme yapınız. Süresi dolan domainler başkaları tarafından kaydedilebilir.</p>
    <div style="text-align:center;">
      <a href="{{renewal_url}}" style="display:inline-block;background:#14b8a6;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Şimdi Yenile</a>
    </div>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>' WHERE template_key = 'domain_renewal_reminder';

-- ============================================================================
-- Yeni büyüme motoru template'leri
-- ============================================================================

-- 10. referral_reward - Referans ödülü bildirimi
INSERT INTO email_templates (template_key, name, subject, body_html, variables, is_active) VALUES
('referral_reward', 'Referans Ödülü', 'Referans ödülünüz cüzdanınıza eklendi!', '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Referans Ödülü!</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Davet ettiğiniz kişi ödeme yaptı</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Referans programı aracılığıyla davet ettiğiniz kişi bir ödeme yaptı ve sizin için ödül kazandınız!</p>
    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#059669;text-transform:uppercase;font-weight:600;">Cüzdanınıza Eklendi</p>
      <p style="margin:0;font-size:32px;font-weight:800;color:#059669;">+{{reward_amount}} &#8378;</p>
      <p style="margin:8px 0 0;font-size:12px;color:#64748b;">Fatura tutarının %10''u</p>
    </div>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Daha fazla kazanmak için referans linkinizi paylaşmaya devam edin!</p>
    <div style="text-align:center;">
      <a href="{{referral_url}}" style="display:inline-block;background:#4F46E5;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Referans Sayfam</a>
    </div>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>', '{customer_name,reward_amount,referral_url}', true)
ON CONFLICT (template_key) DO UPDATE SET body_html = EXCLUDED.body_html, subject = EXCLUDED.subject;

-- 11. wallet_topup - Bakiye yükleme onayı
INSERT INTO email_templates (template_key, name, subject, body_html, variables, is_active) VALUES
('wallet_topup', 'Bakiye Yükleme Onayı', 'Bakiyeniz başarıyla yüklendi!', '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Bakiye Yüklendi</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Cüzdan bakiyeniz başarıyla güncellendi.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Yüklenen</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1e293b;">{{amount}} &#8378;</td></tr>
        <tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;font-size:13px;">Bonus</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#10b981;">+{{bonus_amount}} &#8378;</td></tr>
        <tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;font-size:13px;">Yeni Bakiye</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#1e293b;font-size:18px;">{{new_balance}} &#8378;</td></tr>
      </table>
    </div>
    <div style="text-align:center;">
      <a href="{{wallet_url}}" style="display:inline-block;background:#4F46E5;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Cüzdanıma Git</a>
    </div>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>', '{customer_name,amount,bonus_amount,new_balance,wallet_url}', true)
ON CONFLICT (template_key) DO UPDATE SET body_html = EXCLUDED.body_html, subject = EXCLUDED.subject;

-- 12. cashback_earned - Cashback bildirimi
INSERT INTO email_templates (template_key, name, subject, body_html, variables, is_active) VALUES
('cashback_earned', 'Cashback Kazanıldı', 'Ödemenizden %{{cashback_rate}} cashback kazandınız!', '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Cashback Kazandınız!</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">Ödemeniz başarıyla tamamlandı ve cashback ödülünüz cüzdanınıza eklendi!</p>
    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#059669;text-transform:uppercase;font-weight:600;">Cashback</p>
      <p style="margin:0;font-size:28px;font-weight:800;color:#059669;">+{{cashback_amount}} &#8378;</p>
      <p style="margin:8px 0 0;font-size:12px;color:#64748b;">{{invoice_total}} &#8378; ödemenin %{{cashback_rate}}''i</p>
    </div>
    <p style="font-size:13px;color:#64748b;text-align:center;margin:0 0 24px;">Luma''da her ödemenizde otomatik cashback kazanırsınız. Kazandığınız bakiye bir sonraki faturanızda kullanılabilir.</p>
    <div style="text-align:center;">
      <a href="{{wallet_url}}" style="display:inline-block;background:#10b981;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Cüzdanıma Git</a>
    </div>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>', '{customer_name,cashback_amount,cashback_rate,invoice_total,wallet_url}', true)
ON CONFLICT (template_key) DO UPDATE SET body_html = EXCLUDED.body_html, subject = EXCLUDED.subject;

-- 13. ticket_reply - Destek talebi yanıtı
INSERT INTO email_templates (template_key, name, subject, body_html, variables, is_active) VALUES
('ticket_reply', 'Destek Yanıtı', 'Destek Talebinize Yanıt: #{{ticket_id}}', '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Destek Yanıtı</h1>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px;"><strong>{{ticket_subject}}</strong> konulu destek talebinize yeni bir yanıt verildi.</p>
    <div style="background:#f8fafc;border-left:4px solid #4F46E5;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6;white-space:pre-line;">{{reply_message}}</p>
      <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">{{reply_author}} · {{reply_date}}</p>
    </div>
    <div style="text-align:center;">
      <a href="{{ticket_url}}" style="display:inline-block;background:#4F46E5;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Talebi Görüntüle</a>
    </div>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>', '{customer_name,ticket_id,ticket_subject,reply_message,reply_author,reply_date,ticket_url}', true)
ON CONFLICT (template_key) DO UPDATE SET body_html = EXCLUDED.body_html, subject = EXCLUDED.subject;

-- 14. service_termination_warning - Hizmet sonlandırma uyarısı
INSERT INTO email_templates (template_key, name, subject, body_html, variables, is_active) VALUES
('service_termination_warning', 'Hizmet Sonlandırma Uyarısı', 'SON UYARI: {{service_name}} hizmetiniz silinecek!', '<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
      <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Luma</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Son Uyarı!</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Hizmetiniz kalıcı olarak silinmek üzere</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Sayın <strong>{{customer_name}}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;"><strong>{{service_name}}</strong> hizmetiniz uzun süredir askıda olduğundan <strong style="color:#dc2626;">{{termination_date}}</strong> tarihinde kalıcı olarak silinecektir.</p>
    <div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#dc2626;">Bu işlem geri alınamaz!</p>
      <p style="margin:0;font-size:13px;color:#7f1d1d;">Tüm verileriniz (web sitesi, e-postalar, veritabanları) kalıcı olarak silinecektir.</p>
    </div>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="{{invoice_url}}" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 48px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Ödeme Yap ve Kurtar</a>
    </div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">Sorun yaşıyorsanız destek@lumayazilim.com adresinden bize ulaşın.</p>
  </div>
  <div style="padding:24px 32px;text-align:center;border-radius:0 0 16px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">© 2026 Luma Yazılım · lumayazilim.com</p>
  </div>
</div>
</body></html>', '{customer_name,service_name,termination_date,invoice_url}', true)
ON CONFLICT (template_key) DO UPDATE SET body_html = EXCLUDED.body_html, subject = EXCLUDED.subject;
