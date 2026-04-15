import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Lock } from 'lucide-react'

export default function KVKK() {
  return (
    <div className="min-h-screen bg-slate-950">
      <LandingHeader />

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <Lock className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">KVKK Aydınlatma Metni</h1>
              <p className="text-sm text-slate-500">6698 Sayılı Kişisel Verilerin Korunması Kanunu</p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <p>
                Luma Yazılım - Enes POYRAZ ("Veri Sorumlusu") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında kişisel verilerinizin işlenmesine ilişkin sizi bilgilendirmek amacıyla işbu aydınlatma metnini hazırlamış bulunmaktayız.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">1. Veri Sorumlusu</h2>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-sm text-slate-400 space-y-1">
                <p><strong className="text-slate-200">Unvan:</strong> Luma Yazılım - Enes POYRAZ</p>
                <p><strong className="text-slate-200">VKN:</strong> 7330923351</p>
                <p><strong className="text-slate-200">Adres:</strong> Üçevler Mah. Dumlupınar Cd. No:5/A Nilüfer/Bursa</p>
                <p><strong className="text-slate-200">E-posta:</strong> <a href="mailto:info@lumayazilim.com" className="text-indigo-400 hover:text-indigo-300">info@lumayazilim.com</a></p>
                <p><strong className="text-slate-200">Telefon:</strong> 0544 979 62 57</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">2. İşlenen Kişisel Veriler</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Kimlik Verileri', items: ['Ad, soyad', 'TC kimlik numarası', 'Vergi kimlik numarası', 'Şirket unvanı'] },
                  { title: 'İletişim Verileri', items: ['E-posta adresi', 'Telefon numarası', 'Fatura adresi', 'Teslimat adresi'] },
                  { title: 'Finansal Veriler', items: ['Banka hesap bilgileri', 'Fatura bilgileri', 'Ödeme geçmişi', 'Bakiye bilgileri'] },
                  { title: 'Teknik Veriler', items: ['IP adresi', 'Log kayıtları', 'Çerez verileri', 'Cihaz bilgileri'] },
                ].map((cat) => (
                  <div key={cat.title} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-200 mb-2">{cat.title}</h4>
                    <ul className="space-y-1 text-sm text-slate-400">
                      {cat.items.map(item => <li key={item} className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-indigo-500" />{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">3. Kişisel Verilerin İşlenme Amaçları</h2>
              <p className="text-slate-400 mb-3">Kişisel verileriniz KVKK'nın 5. ve 6. maddelerinde belirtilen hukuki sebeplere dayalı olarak aşağıdaki amaçlarla işlenmektedir:</p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li>Hosting, sunucu ve alan adı hizmetlerinin sağlanması ve yürütülmesi</li>
                <li>Sözleşme süreçlerinin yürütülmesi</li>
                <li>Faturalandırma ve ödeme işlemlerinin gerçekleştirilmesi</li>
                <li>Müşteri ilişkileri yönetimi ve teknik destek sağlanması</li>
                <li>5651 sayılı Kanun kapsamında yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Bilgi güvenliği süreçlerinin yürütülmesi</li>
                <li>Yetkili kurum ve kuruluşlara bilgi verilmesi (BTK, mahkeme vb.)</li>
                <li>Hukuki uyuşmazlıkların çözümlenmesi</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">4. Hukuki Sebepler</h2>
              <p className="text-slate-400 mb-3">Kişisel verileriniz aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:</p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li><strong className="text-slate-200">Kanunlarda açıkça öngörülmesi:</strong> 5651 sayılı Kanun, Türk Ticaret Kanunu, Vergi Usul Kanunu</li>
                <li><strong className="text-slate-200">Sözleşmenin ifası:</strong> Hosting ve sunucu hizmet sözleşmesinin yerine getirilmesi</li>
                <li><strong className="text-slate-200">Hukuki yükümlülük:</strong> Faturalandırma, vergi ve muhasebe yükümlülükleri</li>
                <li><strong className="text-slate-200">Meşru menfaat:</strong> Hizmet kalitesinin iyileştirilmesi, güvenlik önlemleri</li>
                <li><strong className="text-slate-200">Açık rıza:</strong> Pazarlama ve tanıtım faaliyetleri (yalnızca onay verilmesi halinde)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">5. Kişisel Verilerin Aktarımı</h2>
              <p className="text-slate-400 mb-3">Kişisel verileriniz, KVKK'nın 8. ve 9. maddelerinde belirtilen şartlara uygun olarak aşağıdaki alıcı gruplarına aktarılabilmektedir:</p>

              <h3 className="text-base font-medium text-slate-200 mb-2 mt-4">5.1 Ödeme Hizmet Sağlayıcıları</h3>
              <p className="text-sm text-slate-400 mb-3">
                Kredi kartı ile yapılan ödemelerde müşterinin ad-soyad, e-posta, telefon, fatura adresi, IP adresi ve kart bilgileri, ödeme işleminin gerçekleştirilmesi amacıyla aşağıdaki lisanslı ödeme kuruluşlarına aktarılmaktadır:
              </p>
              <div className="space-y-3 mb-4">
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-1">AkÖde Elektronik Para ve Ödeme Hizmetleri A.Ş. (Tosla)</h4>
                  <p className="text-xs text-slate-500">Akbank iştiraki | BDDK lisanslı elektronik para kuruluşu | 6493 sayılı Kanun kapsamında</p>
                  <p className="text-xs text-slate-500 mt-1"><strong className="text-slate-400">Aktarılan veriler:</strong> Ad-soyad, e-posta, telefon, fatura adresi, IP adresi, ödeme tutarı</p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-1">Garanti Ödeme ve Elektronik Para Hizmetleri A.Ş. (Tami)</h4>
                  <p className="text-xs text-slate-500">Garanti BBVA iştiraki (%81) | 6493 sayılı Kanun kapsamında lisanslı</p>
                  <p className="text-xs text-slate-500">Adres: Nisbetiye Mah. Barbaros Bul. Çiftçi Kule No:96/1 Beşiktaş/İstanbul | VD: Beşiktaş 3891723257</p>
                  <p className="text-xs text-slate-500 mt-1"><strong className="text-slate-400">Aktarılan veriler:</strong> Ad-soyad, e-posta, telefon, fatura adresi, IP adresi, ödeme tutarı</p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-1">iyzi Ödeme ve Elektronik Para Hizmetleri A.Ş. (iyzico)</h4>
                  <p className="text-xs text-slate-500">TCMB denetiminde | PCI DSS uyumlu | Ticari Sicil: 867612 | VD: Üsküdar 4830343157</p>
                  <p className="text-xs text-slate-500">Adres: Altunizade Mah. İnci Çıkmazı Sok. No:3 Üsküdar/İstanbul</p>
                  <p className="text-xs text-slate-500 mt-1"><strong className="text-slate-400">Aktarılan veriler:</strong> Ad-soyad, e-posta, telefon, fatura adresi, IP adresi, kart bilgileri, ödeme tutarı</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Kart bilgileri (kart numarası, son kullanma tarihi, CVV) yalnızca ilgili ödeme kuruluşunun PCI DSS uyumlu güvenli altyapısı üzerinden işlenmekte olup Luma tarafından saklanmamaktadır.
              </p>

              <h3 className="text-base font-medium text-slate-200 mb-2">5.2 Diğer Alıcı Grupları</h3>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li><strong className="text-slate-300">BTK</strong> - 5651 sayılı Kanun kapsamında yer sağlayıcı bildirimi (alan adı, müşteri kimlik ve iletişim bilgileri)</li>
                <li><strong className="text-slate-300">Alan adı kayıt kuruluşları</strong> - Domain tescil işlemleri için gerekli WHOIS bilgileri (ad-soyad, e-posta, adres, telefon)</li>
                <li><strong className="text-slate-300">Yasal merciler</strong> - Mahkeme kararı, savcılık talebi veya yasal zorunluluk halinde (kimlik, iletişim, log kayıtları)</li>
                <li><strong className="text-slate-300">Altyapı sağlayıcıları</strong> - Veri merkezi ve sunucu operasyonları için gerekli minimum teknik bilgiler</li>
                <li><strong className="text-slate-300">SMS hizmet sağlayıcısı</strong> - Bildirim ve doğrulama SMS'leri için telefon numarası</li>
              </ul>
              <p className="text-slate-400 mt-3">
                Yurt dışına veri aktarımı yapılması halinde KVKK'nın 9. maddesindeki şartlara uyulur. Veri aktarımı yapılan tüm taraflarla gerekli güvenlik önlemleri alınır.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">6. Veri Saklama Süreleri</h2>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/40">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Veri Kategorisi</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Saklama Süresi</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Dayanak</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-400">
                    <tr className="border-b border-slate-800"><td className="py-3 px-4">Ticari defterler ve faturalar</td><td className="py-3 px-4">10 yıl</td><td className="py-3 px-4">TTK md. 82</td></tr>
                    <tr className="border-b border-slate-800"><td className="py-3 px-4">Trafik kayıtları (log)</td><td className="py-3 px-4">2 yıl</td><td className="py-3 px-4">5651 s.K. md. 5</td></tr>
                    <tr className="border-b border-slate-800"><td className="py-3 px-4">Sözleşme verileri</td><td className="py-3 px-4">Sözleşme + 10 yıl</td><td className="py-3 px-4">TBK md. 146</td></tr>
                    <tr><td className="py-3 px-4">Pazarlama verileri</td><td className="py-3 px-4">Rıza geri alınana kadar</td><td className="py-3 px-4">KVKK md. 5/1</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">7. İlgili Kişinin Hakları (KVKK md. 11)</h2>
              <p className="text-slate-400 mb-3">KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
              <div className="grid gap-2">
                {[
                  'Kişisel verilerinizin işlenip işlenmediğini öğrenme',
                  'İşlenmişse buna ilişkin bilgi talep etme',
                  'İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme',
                  'Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme',
                  'Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme',
                  'KVKK md. 7 çerçevesinde silinmesini veya yok edilmesini isteme',
                  'Düzeltme ve silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme',
                  'İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme',
                  'Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme',
                ].map((right, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-indigo-400 font-semibold shrink-0 mt-0.5">{String.fromCharCode(97 + i)})</span>
                    {right}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">8. Başvuru Yöntemi</h2>
              <p className="text-slate-400 mb-3">
                Yukarıda belirtilen haklarınızı kullanmak için aşağıdaki yöntemlerden biriyle bize başvurabilirsiniz:
              </p>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2 text-sm text-slate-400">
                <p><strong className="text-slate-200">E-posta:</strong> <a href="mailto:info@lumayazilim.com" className="text-indigo-400 hover:text-indigo-300">info@lumayazilim.com</a> (kayıtlı e-posta adresinizden)</p>
                <p><strong className="text-slate-200">Posta:</strong> Üçevler Mah. Dumlupınar Cd. No:5/A Nilüfer/Bursa (noter tebligatı veya iadeli taahhütlü mektup ile)</p>
              </div>
              <p className="text-slate-500 text-sm mt-3">
                Başvurularınız en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. İşlemin ayrıca bir maliyet gerektirmesi halinde Kurul tarafından belirlenen tarife üzerinden ücret alınabilir.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
