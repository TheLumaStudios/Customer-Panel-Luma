import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Shield } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950">
      <LandingHeader />

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <Shield className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Gizlilik Politikası</h1>
              <p className="text-sm text-slate-500">Son güncelleme: 15 Nisan 2026</p>
            </div>
          </div>

          <div className="prose-dark space-y-8 text-slate-300 leading-relaxed">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <p>
                Luma Yazılım - Enes POYRAZ ("Luma", "biz", "şirket") olarak kişisel verilerinizin korunmasına büyük önem veriyoruz. Bu Gizlilik Politikası, hizmetlerimizi kullanırken hangi bilgileri topladığımızı, nasıl kullandığımızı ve koruduğumuzu açıklamaktadır.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">1. Toplanan Bilgiler</h2>
              <p className="mb-3">Hizmetlerimizi kullanmanız sırasında aşağıdaki bilgileri toplayabiliriz:</p>
              <h3 className="text-base font-medium text-slate-200 mb-2">1.1 Kimlik Bilgileri</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-400 mb-4">
                <li>Ad, soyad, TC kimlik numarası</li>
                <li>Şirket unvanı, vergi kimlik numarası, vergi dairesi</li>
                <li>E-posta adresi, telefon numarası</li>
                <li>Fatura ve teslimat adresi</li>
              </ul>
              <h3 className="text-base font-medium text-slate-200 mb-2">1.2 Teknik Bilgiler</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-400 mb-4">
                <li>IP adresi, tarayıcı türü ve sürümü</li>
                <li>İşletim sistemi bilgileri</li>
                <li>Erişim tarihi ve saatleri</li>
                <li>Çerez verileri ve oturum bilgileri</li>
              </ul>
              <h3 className="text-base font-medium text-slate-200 mb-2">1.3 Ödeme Bilgileri</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Kredi kartı bilgileri (iyzico altyapısı üzerinden işlenir, tarafımızca saklanmaz)</li>
                <li>Banka hesap bilgileri (havale/EFT için)</li>
                <li>Fatura geçmişi ve ödeme kayıtları</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">2. Bilgilerin Kullanım Amacı</h2>
              <p className="mb-3">Toplanan kişisel veriler aşağıdaki amaçlarla kullanılmaktadır:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Hosting, sunucu ve alan adı hizmetlerinin sağlanması</li>
                <li>Müşteri hesaplarının oluşturulması ve yönetimi</li>
                <li>Faturalandırma, ödeme işlemleri ve muhasebe</li>
                <li>Teknik destek hizmetlerinin sunulması</li>
                <li>5651 sayılı Kanun kapsamında yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Hizmet kalitesinin iyileştirilmesi ve güvenlik önlemlerinin alınması</li>
                <li>Yasal düzenlemelere uyum sağlanması</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">3. Bilgilerin Paylaşımı</h2>
              <p className="mb-3">Kişisel verileriniz aşağıdaki durumlar dışında üçüncü taraflarla paylaşılmaz:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li><strong className="text-slate-200">Ödeme hizmet sağlayıcıları:</strong> AkÖDE (Tosla - Akbank iştiraki), Tami (Garanti BBVA iştiraki) ve iyzico. Ödeme işlemleri için ad-soyad, e-posta, telefon, fatura adresi, IP adresi ve kart bilgileri bu kuruluşların PCI DSS uyumlu güvenli altyapılarına aktarılır. Kart bilgileri Luma tarafından saklanmaz.</li>
                <li><strong className="text-slate-200">Alan adı kayıt kuruluşları:</strong> Domain tescil işlemleri için WHOIS bilgileri</li>
                <li><strong className="text-slate-200">BTK:</strong> 5651 sayılı Kanun kapsamında yer sağlayıcı yükümlülükleri gereği müşteri kimlik ve alan adı bilgileri</li>
                <li><strong className="text-slate-200">Yasal merciler:</strong> Mahkeme kararı, savcılık talebi veya yasal zorunluluk halinde</li>
                <li><strong className="text-slate-200">SMS hizmet sağlayıcısı:</strong> Bildirim ve doğrulama SMS'leri için telefon numarası</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">4. Veri Güvenliği</h2>
              <p className="text-slate-400">
                Kişisel verilerinizi korumak için endüstri standardı güvenlik önlemleri uygulamaktayız. Tüm veri iletişimi SSL/TLS şifreleme ile korunmaktadır. Sunucularımız DDoS koruması, güvenlik duvarları ve izleme sistemleri ile güvence altındadır. Ödeme bilgileriniz PCI DSS uyumlu iyzico altyapısı üzerinden işlenmekte olup tarafımızca saklanmamaktadır.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">5. Veri Saklama Süresi</h2>
              <p className="text-slate-400">
                Kişisel verileriniz, hizmet ilişkisi süresince ve yasal saklama yükümlülüklerimiz çerçevesinde muhafaza edilir. Türk Ticaret Kanunu gereği ticari defterler ve faturalar 10 yıl, 5651 sayılı Kanun gereği trafik kayıtları en az 2 yıl saklanır. Hizmet ilişkisinin sona ermesinden sonra yasal yükümlülükler dışında kalan veriler makul süre içinde silinir veya anonim hale getirilir.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">6. Haklarınız</h2>
              <p className="mb-3">6698 sayılı KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmişse bilgi talep etme</li>
                <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                <li>Eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme</li>
                <li>KVKK'nın 7. maddesindeki şartlar çerçevesinde silinmesini/yok edilmesini isteme</li>
                <li>Otomatik sistemler vasıtasıyla aleyhine bir sonucun ortaya çıkmasına itiraz etme</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">7. İletişim</h2>
              <p className="text-slate-400">
                Gizlilik politikamız hakkında sorularınız için <a href="mailto:info@lumayazilim.com" className="text-indigo-400 hover:text-indigo-300 underline">info@lumayazilim.com</a> adresinden bize ulaşabilirsiniz. (Luma Yazılım - Enes POYRAZ, VKN: 7330923351, Adres: Üçevler Mah. Dumlupınar Cd. No:5/A Nilüfer/Bursa, Tel: 0544 979 62 57)
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
