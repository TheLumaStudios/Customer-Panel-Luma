import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { FileText } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950">
      <LandingHeader />

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <FileText className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Kullanım Koşulları</h1>
              <p className="text-sm text-slate-500">Son güncelleme: 15 Nisan 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <p>
                Bu Kullanım Koşulları, Luma Yazılım - Enes POYRAZ ("Luma") tarafından sunulan hosting, sunucu, alan adı ve ilgili hizmetlerin kullanım şartlarını düzenler. Hizmetlerimize erişerek veya kullanarak bu koşulları kabul etmiş sayılırsınız.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">1. Hizmet Tanımı</h2>
              <p className="text-slate-400 mb-3">Luma aşağıdaki hizmetleri sunmaktadır:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Paylaşımlı web hosting (Linux, WordPress, Plesk, Reseller)</li>
                <li>Sanal özel sunucu (VPS/VDS)</li>
                <li>Dedicated (fiziksel) sunucu kiralama</li>
                <li>Alan adı tescil ve yönetimi</li>
                <li>SSL sertifikası, CDN ve ek hizmetler</li>
                <li>Oyun sunucusu barındırma</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">2. Hesap Oluşturma ve Güvenlik</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Hizmetlerimizi kullanmak için geçerli ve doğru bilgilerle hesap oluşturmanız gerekmektedir.</li>
                <li>Hesap güvenliğiniz sizin sorumluluğunuzdadır. Şifrenizi üçüncü kişilerle paylaşmayınız.</li>
                <li>Hesabınız üzerinden gerçekleştirilen tüm işlemlerden siz sorumlusunuz.</li>
                <li>5651 sayılı Kanun kapsamında kimlik doğrulaması (KYC) istenmesi halinde gerekli belgeleri sağlamanız zorunludur.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">3. Ödeme Koşulları ve Ödeme Hizmet Sağlayıcıları</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Tüm fiyatlar aksi belirtilmedikçe KDV hariçtir.</li>
                <li>Ödemeler kredi kartı, havale/EFT veya bakiye ile yapılabilir.</li>
                <li>Faturalar hizmet döneminin başında kesilir. Ödeme vadesi fatura tarihinden itibaren 7 gündür.</li>
                <li>Vadesi geçmiş ödemelerde hizmet askıya alınabilir. 15 gün içinde ödeme yapılmaması halinde hesap sonlandırılabilir.</li>
                <li>Dijital hizmetlerin doğası gereği, teslim edilen hizmetlerde iade yapılmaz. Detaylar madde 11'de belirtilmiştir.</li>
              </ul>

              <div className="mt-5 bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-200 mb-3">Ödeme Hizmet Sağlayıcıları</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Kredi kartı ile yapılan ödemelerde kart bilgileri doğrudan aşağıdaki lisanslı ödeme kuruluşlarına iletilir ve Luma tarafından saklanmaz. <strong className="text-slate-200">Müşteri, işbu sözleşmeyi kabul etmekle birlikte aşağıdaki ödeme hizmet sağlayıcılarının kullanım şartlarını ve gizlilik politikalarını da okuduğunu, anladığını ve kabul ettiğini beyan eder.</strong>
                </p>

                <div className="space-y-4">
                  <div className="border-l-2 border-indigo-500/50 pl-4">
                    <h4 className="text-sm font-semibold text-white mb-1">AkÖDE (Tosla)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      AkÖde Elektronik Para ve Ödeme Hizmetleri A.Ş., Akbank iştiraki olup BDDK'nın 4 Ekim 2018 tarih ve 8027 sayılı Kurul Kararı ile elektronik para kuruluşu olarak faaliyette bulunma izni almıştır. 6493 sayılı Kanun kapsamında lisanslı ödeme ve elektronik para kuruluşudur.
                    </p>
                  </div>

                  <div className="border-l-2 border-emerald-500/50 pl-4">
                    <h4 className="text-sm font-semibold text-white mb-1">Tami (Garanti BBVA İştiraki)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">
                      Garanti Ödeme ve Elektronik Para Hizmetleri A.Ş. (%81 Garanti BBVA, %19 Garanti Ödeme Sistemleri A.Ş.), 6493 sayılı Kanun kapsamında lisanslı Ödeme ve Elektronik Para Kuruluşudur.
                    </p>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>Adres: Nisbetiye Mah. Barbaros Bul. Çiftçi Kule 1. Kule No:96/1 İç Kapı No:1083 Beşiktaş/İstanbul</p>
                      <p>Tel: 0212 318 18 18 | Ticari Sicil No: 377684-5 | VD: Beşiktaş 3891723257</p>
                      <p>Mersis: 0389172325700001 | KEP: gohas@hs03.kep.tr</p>
                    </div>
                  </div>

                  <div className="border-l-2 border-violet-500/50 pl-4">
                    <h4 className="text-sm font-semibold text-white mb-1">iyzico</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">
                      iyzi Ödeme ve Elektronik Para Hizmetleri A.Ş., Türkiye Cumhuriyet Merkez Bankası (TCMB) denetiminde faaliyet gösteren lisanslı ödeme kuruluşudur. PCI DSS uyumlu altyapı ile kart bilgileri güvenli şekilde işlenir.
                    </p>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>Adres: Altunizade Mah. İnci Çıkmazı Sok. No:3 İç Kapı No:10 Üsküdar/İstanbul</p>
                      <p>Tel: +90 216 599 01 00 | E-posta: destek@iyzico.com</p>
                      <p>Ticari Sicil No: 867612 | VD: Üsküdar 4830343157 | Mersis: 0483034315700019</p>
                      <p>Denetleyici: TCMB - Hacı Bayram Mah. İstiklal Cad. No:10 06050 Ulus Altındağ/Ankara</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">4. Kabul Edilebilir Kullanım</h2>
              <p className="text-slate-400 mb-3">Hizmetlerimizi kullanırken aşağıdaki faaliyetler kesinlikle yasaktır:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Yasa dışı içerik barındırma veya dağıtma</li>
                <li>Spam, phishing veya zararlı yazılım dağıtımı</li>
                <li>DDoS saldırıları düzenleme veya bunlara katılma</li>
                <li>Telif hakkı ihlali içeren materyallerin paylaşılması</li>
                <li>Sunucu kaynaklarının kötüye kullanımı (crypto mining vb.)</li>
                <li>Diğer kullanıcıların hizmetlerini olumsuz etkileyen faaliyetler</li>
                <li>Türk Ceza Kanunu ve ilgili mevzuata aykırı her türlü faaliyet</li>
              </ul>
              <p className="text-slate-400 mt-3">
                Bu kuralların ihlali halinde hizmet uyarı yapılmaksızın askıya alınabilir veya sonlandırılabilir.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">5. Hizmet Seviyesi Taahhüdü (SLA)</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Paylaşımlı hosting ve VPS/VDS hizmetleri için %99.9 uptime garantisi sunulmaktadır.</li>
                <li>Planlı bakım çalışmaları en az 24 saat önceden bildirilir ve SLA hesaplamasına dahil edilmez.</li>
                <li>SLA ihlali durumunda, kesinti süresine orantılı olarak hizmet bedeli iade veya uzatma şeklinde telafi edilir.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">6. Yedekleme</h2>
              <p className="text-slate-400">
                Luma, paylaşımlı hosting hizmetlerinde günlük otomatik yedekleme yapmaktadır. Ancak yedekleme, ek bir hizmet olarak sunulmakta olup verilerinizin güvenliğinden nihai olarak siz sorumlusunuz. Kendi yedeklerinizi düzenli olarak almanızı önemle tavsiye ederiz. VPS/VDS ve dedicated sunucularda yedekleme müşterinin sorumluluğundadır.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">7. Fikri Mülkiyet</h2>
              <p className="text-slate-400">
                Luma markası, logosu, web sitesi tasarımı ve yazılımı Luma'ya aittir. Müşteri tarafından barındırılan içerikler üzerindeki fikri mülkiyet hakları müşteriye aittir. Luma, barındırdığı içerikler üzerinde herhangi bir hak iddia etmez.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">8. İçerik Sorumluluğu ve Sorumluluk Reddi</h2>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-4">
                <p className="text-sm text-red-300 font-medium mb-2">Sorumluluk Reddi Beyanı</p>
                <p className="text-sm text-slate-400">
                  Luma, yer sağlayıcı sıfatıyla hareket etmekte olup, 5651 sayılı Kanun'un 5. maddesi uyarınca barındırdığı içerikleri kontrol etmek veya hukuka aykırı bir faaliyetin söz konusu olup olmadığını araştırmakla yükümlü değildir.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li><strong className="text-slate-200">Müşteri tarafından barındırılan, yayınlanan, iletilen veya depolanan tüm içeriklerden münhasıran müşteri sorumludur.</strong> Luma, müşterinin sunucu/hosting üzerinde barındırdığı web sitesi, uygulama, veritabanı, dosya ve her türlü dijital içerikten hiçbir şekilde sorumlu tutulamaz.</li>
                <li>Müşterinin sunucu üzerinde gerçekleştirdiği yasa dışı faaliyetler (dolandırıcılık, kara para aklama, terör propagandası, müstehcen içerik, fikri mülkiyet ihlali, kişisel verilerin hukuka aykırı işlenmesi vb.) nedeniyle doğacak her türlü hukuki, cezai ve mali sorumluluk tamamen müşteriye aittir.</li>
                <li>Müşterinin sunucu üzerinden üçüncü kişilere verdiği zararlardan Luma sorumlu tutulamaz. Bu tür durumlarda Luma'nın müşteriye rücu hakkı saklıdır.</li>
                <li>Müşteri, sunucu/hosting kaynakları üzerinden gerçekleştirilen DDoS saldırıları, spam gönderimi, port tarama, brute force saldırıları ve benzeri kötü niyetli faaliyetlerden sorumludur. Bu tür faaliyetler tespit edildiğinde hizmet derhal ve uyarısız sonlandırılır, ücret iadesi yapılmaz.</li>
                <li>Luma, yetkili mercilerden (mahkeme, savcılık, BTK, TİB, kolluk kuvvetleri) gelen talep ve kararlar doğrultusunda müşteriye ait verileri paylaşmak, içeriği kaldırmak veya hizmeti durdurmakla yükümlüdür. Bu işlemler nedeniyle müşteri Luma'dan herhangi bir tazminat talep edemez.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">9. Kişisel Verilerin İşlenmesi</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Müşteri, hizmetlerimizden yararlanmak için sağladığı kimlik bilgileri (TC kimlik no, VKN, ad-soyad, adres, telefon, e-posta), kimlik belgesi görselleri ve ödeme bilgilerinin, hizmetin ifası ve yasal yükümlülüklerin yerine getirilmesi amacıyla işleneceğini kabul eder.</li>
                <li>5651 sayılı Kanun kapsamında BTK'ya bildirim yükümlülüğümüz gereği, müşteriye ait kimlik ve iletişim bilgileri ile barındırılan alan adı bilgileri düzenli olarak BTK'ya raporlanır.</li>
                <li>Müşterinin IP adresi, erişim logları ve trafik verileri yasal saklama süreleri boyunca (en az 2 yıl) muhafaza edilir ve yasal mercilerin talebi halinde paylaşılır.</li>
                <li>Kimlik doğrulama (KYC) sürecinde yüklenen kimlik belgesi görselleri güvenli ortamda saklanır ve yalnızca yasal yükümlülükler çerçevesinde kullanılır.</li>
                <li>Detaylı bilgi için <a href="/kvkk" className="text-indigo-400 hover:text-indigo-300 underline">KVKK Aydınlatma Metni</a>'ni inceleyiniz.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">10. Sorumluluk Sınırlaması</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Luma'nın herhangi bir nedenle doğacak toplam sorumluluğu, ilgili hizmet için son 12 ayda müşteri tarafından ödenen toplam bedelle sınırlıdır.</li>
                <li><strong className="text-slate-200">Luma hiçbir koşulda kar kaybı, iş kaybı, itibar kaybı, veri kaybı, dolaylı zarar, özel zarar veya cezai tazminattan sorumlu tutulamaz.</strong></li>
                <li>Donanım arızası, yazılım hatası, ağ kesintisi, veri merkezi kaynaklı sorunlar, üçüncü taraf hizmet sağlayıcılarından kaynaklanan aksaklıklar nedeniyle oluşan zararlardan sorumluluk kabul edilmez.</li>
                <li>Mücbir sebepler (doğal afet, savaş, terör, salgın hastalık, yasal düzenleme değişiklikleri, devlet müdahalesi, enerji kesintisi, internet altyapısı sorunları) nedeniyle oluşan aksaklıklardan sorumluluk kabul edilmez.</li>
                <li>Müşterinin zayıf şifre kullanımı, güvenlik açığı bulunan yazılım kullanımı veya güvenlik önlemlerini ihmal etmesi nedeniyle gerçekleşen hack, veri sızıntısı veya yetkisiz erişim olaylarından Luma sorumlu tutulamaz.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">11. İade ve Cayma Hakkı Kısıtlamaları</h2>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-4">
                <p className="text-sm text-red-300 font-medium">Dijital hizmetlerin doğası gereği, teslim edilen hiçbir hizmette iade yapılmaz.</p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li><strong className="text-slate-200">Tüm hizmetlerde:</strong> Hizmet aktivasyonu ve erişim bilgilerinin iletilmesiyle birlikte hizmet teslim edilmiş sayılır. Dijital hizmetlerin doğası gereği, teslim edilen hizmetlerde iade yapılmaz.</li>
                <li><strong className="text-slate-200">VPS/VDS sunucularda:</strong> Sunucu kurulumu tamamlandıktan ve erişim bilgileri iletildikten sonra hizmet teslim edilmiş sayılır. İade yapılmaz.</li>
                <li><strong className="text-slate-200">Dedicated sunucularda:</strong> Fiziksel donanım tahsisi ve kurulum yapıldıktan sonra iade yapılmaz. Donanımın hazırlanması, BIOS/firmware konfigürasyonu ve ağ yapılandırması geri dönüşü olmayan işlemlerdir.</li>
                <li><strong className="text-slate-200">Alan adı tescil ve transferlerinde:</strong> Kayıt kuruluşuna iletilmiş siparişlerde iade yapılmaz. Alan adı tescili geri alınamaz bir işlemdir.</li>
                <li><strong className="text-slate-200">SSL sertifikalarında:</strong> Aktive edilmiş sertifikalarda iade yapılmaz.</li>
                <li>Kullanım koşulları ihlali nedeniyle sonlandırılan hizmetlerde iade yapılmaz.</li>
                <li>Yasa dışı faaliyet nedeniyle askıya alınan veya sonlandırılan hizmetlerde iade yapılmaz.</li>
                <li>Kısmi dönem iadeleri yapılmaz. İade, tam aylık dönem bazında hesaplanır.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">12. Hizmet Askıya Alma ve Sonlandırma</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Luma, aşağıdaki durumlarda hizmeti önceden bildirim yapmaksızın askıya alma veya sonlandırma hakkını saklı tutar:
                  <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                    <li>Kullanım koşullarının ihlali</li>
                    <li>Yasa dışı faaliyet tespiti veya şüphesi</li>
                    <li>Aşırı kaynak kullanımı (CPU, RAM, bandwidth) ile diğer müşterilerin etkilenmesi</li>
                    <li>Ödeme yükümlülüklerinin yerine getirilmemesi</li>
                    <li>Yetkili mercilerden gelen kapatma/erişim engelleme kararı</li>
                    <li>Sunucu güvenliğini tehdit eden faaliyetler</li>
                  </ul>
                </li>
                <li>Askıya alınan hizmetlerde veriler 15 gün süreyle saklanır. Bu süre içinde sorun giderilmezse hesap sonlandırılır.</li>
                <li>Sonlandırılan hesaplardaki veriler 30 gün içinde kalıcı olarak silinir. Silinen verilerin kurtarılması mümkün değildir.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">13. Tazminat ve Rücu</h2>
              <p className="text-slate-400">
                Müşteri, Luma hizmetlerini kullanırken üçüncü kişilerin haklarını ihlal etmesi, yasa dışı faaliyet yürütmesi veya bu koşulları ihlal etmesi nedeniyle Luma'nın maruz kalacağı her türlü dava, talep, zarar, ceza, avukatlık ücreti ve masrafı karşılamayı kabul ve taahhüt eder. Luma'nın müşteriye rücu hakkı her durumda saklıdır.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">14. Fesih</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Müşteri, hizmetini istediği zaman müşteri paneli üzerinden iptal edebilir.</li>
                <li>Ön ödemeli dönemin kalan kısmı için iade yapılmaz (madde 11'deki istisnalar hariç).</li>
                <li>Luma, kullanım koşullarının ihlali halinde hizmeti derhal sonlandırma hakkını saklı tutar.</li>
                <li>Hesap sonlandırıldığında veriler 30 gün içinde kalıcı olarak silinir.</li>
                <li>Fesih, tarafların fesih tarihinden önce doğmuş hak ve yükümlülüklerini ortadan kaldırmaz.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">15. Sunucu Üzerinden Dış Saldırı ve Suç Faaliyetleri</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Müşteriye tahsis edilen IP adresleri ve sunucular müşteri adına kayıt altına alınmaktadır. Kimlik bilgileri dahil olmak üzere tüm kayıtlar en az 5 yıl süreyle saklanır.</li>
                <li>Müşteriye ait IP adreslerinden gerçekleştirilen DDoS saldırıları, port tarama, brute force, spam, phishing, zararlı yazılım dağıtımı ve benzeri kötü amaçlı faaliyetlerde, IP adresinin kiralandığı tarih aralığına bakılarak müşterinin kimlik bilgileri üzerinden yasal işlem başlatılabilir.</li>
                <li>Tüm ağ kayıtları (network logları) aktif olarak veritabanında tutulmaktadır. Yetkili mercilerin başvurusu dahilinde gerekli kayıtlar incelenerek paylaşılır.</li>
                <li>Müşteri, sunucusu üzerinden gerçekleştirilen tüm faaliyetlerden hukuki ve cezai olarak sorumludur.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">16. Yasaklı İçerik ve Kötüye Kullanım Detayları</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Sunucular üzerinde pornografik, müstehcen, çocuk istismarı içeren, terör propagandası yapan, ırkçılık içeren veya Türk hukukuna aykırı her türlü içerik barındırılması kesinlikle yasaktır.</li>
                <li>Crack (korsan yazılım), nulled script, virüslü dosya, ransomware veya benzeri zararlı yazılım bulundurulması halinde hizmet derhal sonlandırılır ve iade yapılmaz.</li>
                <li>Hosting hizmetleri yalnızca web sitesi barındırma amacıyla kullanılabilir. Dosya depolama, torrent, streaming veya hosting amacı dışında kullanım tespit edildiğinde hizmet sonlandırılabilir.</li>
                <li>Oyun sunucusu hizmetleri yalnızca seçilen kategorideki oyunu çalıştırmak amacıyla kullanılabilir. Farklı amaçla kullanım tespit edildiğinde hizmet sonlandırılır.</li>
                <li>İşlemciyi kasıtlı olarak yük altına alan programlar (crypto mining, stress test vb.) çalıştırılması halinde hizmet limitlenebilir veya sonlandırılabilir, iade yapılmaz.</li>
                <li>Yasaklı içerik ve kötüye kullanım bildirimleri destek sistemi üzerinden yapılabilir, en geç 15 iş günü içinde değerlendirilir.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">17. IP Adresi ve Lokasyon</h2>
              <p className="text-slate-400">
                Müşteriye atanan IPv4/IPv6 adresinin organizasyon, ülke ve şehir tanımları veri merkezi lokasyonu ile aynı veya farklı olabilir. IP lokasyon bilgisinin farklı olması iade veya cayma hakkı kapsamına girmez. Tüm hizmetler belirtilen veri merkezlerinde bulunan sunucular üzerinden sağlanmaktadır.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">18. Fiyat Değişikliği</h2>
              <p className="text-slate-400">
                Luma, kur dalgalanmaları, maliyet artışları veya piyasa koşulları nedeniyle fiyat değişikliğine gitme hakkını saklı tutar. Fiyat değişikliği yapıldığında mevcut müşterilere bir sonraki fatura dönemine kadar mevcut fiyat garantisi verilir. Yeni siparişler güncel fiyatlar üzerinden işleme alınır.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">19. Hesaplar Arası Transfer</h2>
              <p className="text-slate-400">
                Müşteriler arası kredi, bakiye veya hizmet satışı/transferi kesinlikle mümkün değildir. Hesabınızı başka kişilerle paylaşmanız halinde bu kişilerin yapacağı tüm işlemlerden siz sorumlusunuz. Üçüncü kişilerden kredi veya hizmet alarak dolandırılan müşterilerin hakları Luma sorumluluğunda değildir.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">20. DDoS Koruması</h2>
              <p className="text-slate-400">
                Luma tarafından sunulan DDoS koruması %100 oranında değildir ve %100 koruma garantisi bulunmamaktadır. İnternet altyapısının desteklediği ölçüde DDoS filtresi sağlanır. DDoS filtresi müşteri ihtiyaçlarını karşılayamadığı durumlarda müşteri cayma hakkını kullanamaz. Yoğun saldırı nedeniyle hizmetin kullanılamaz duruma gelmesi halinde Luma, uyarı yapmaksızın hizmeti askıya alabilir veya sözleşmeyi tek taraflı feshedebilir.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">21. Ödeme Temerrüdü ve Gecikme</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Müşteri, fatura tarihinden itibaren 7 gün içinde ödeme gerçekleştirmediği takdirde temerrüde düşmüş sayılır.</li>
                <li>Temerrüt halinde Luma, fatura tarihinden itibaren T.C. Merkez Bankası tarafından belirlenen yasal faiz oranı üzerinden gecikme faizi talep etme hakkını saklı tutar. Müşteri bu gecikme faizini ödemeyi beyan ve kabul eder.</li>
                <li>Ödemenin gecikmesi durumunda Luma, müşteriye verilen tüm hizmetleri önceden bildirim yapmaksızın askıya alma veya durdurma hakkını saklı tutar.</li>
                <li>Hizmet bitiş tarihini takip eden 3 takvim günü içinde ödeme yapılmaması halinde hizmet askıya alınır. 15 gün içinde ödeme yapılmaması halinde hizmete ait tüm veriler güvenlik gereği silinerek hizmet otomatik olarak kapatılır ve iptal edilir.</li>
                <li>İptal edilen hizmetlerde veri kaybından dolayı Luma sorumlu tutulamaz.</li>
                <li>Müşteri, işbu sözleşmeden doğan alacaklar için Luma'nın dava veya icra takibi açması halinde yasal gecikme faizi, bakiye borç miktarının %30'u kadar cezai şart ve avukatlık ücreti ile diğer yasal giderleri ödemeyi beyan, kabul ve taahhüt eder.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">22. Fesih ve Cezai Şart</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Müşteri, sözleşmenin herhangi bir maddesine aykırı davranması, beyan ettiği bilgilerin doğru olmadığının tespiti veya askıya alma halinin 7 günden fazla devam etmesi durumunda, Luma hiçbir ihtar ve ihbara gerek kalmaksızın sözleşmeyi tek taraflı olarak fesih etme hakkına sahiptir.</li>
                <li><strong className="text-slate-200">Sözleşme ihlali nedeniyle gerçekleşen fesihlerde müşteri, kalan süreye bakılmaksızın ödemiş olduğu ücretleri geri isteyemez.</strong></li>
                <li>Müşterinin yasa dışı faaliyeti, spam, saldırı veya bu sözleşmenin ağır ihlali nedeniyle fesih durumunda, Luma fesih tarihinde yürürlükte olan emsal sözleşme bedelinin 3 katı tutarında cezai tazminat talep etme hakkını saklı tutar.</li>
                <li>Müşteri, hizmetini kontrol paneli üzerinden iptal talebi göndererek sonlandırabilir. Ön ödemeli dönemin kalan kısmı iade edilmez.</li>
                <li>Fesih, tarafların fesih tarihinden önce doğmuş hak ve yükümlülüklerini ortadan kaldırmaz.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">23. Yedekleme Sorumluluğu</h2>
              <p className="text-slate-400">
                Luma, müşteriye ait yedeklerin düzenli tutulması için makul özeni gösterecektir, ancak bu konuda yaşanabilecek sorunlardan dolayı müşterinin uğrayacağı veri kayıplarından sorumlu tutulamaz. <strong className="text-slate-200">Tüm verilerin yedekleme ve saklama yükümlülüğü nihai olarak müşteriye aittir.</strong> VPS/VDS ve dedicated sunucularda yedekleme tamamen müşterinin sorumluluğundadır. Luma, hizmetlerinde meydana gelebilecek kesinti veya veri kaybı durumlarında oluşabilecek maddi veya manevi zararlardan sorumlu tutulamaz.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">24. Yazılım ve Güvenlik Sorumluluğu</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Sunucu üzerindeki tüm yazılımların güvenliği müşteriye aittir. Dosya izinleri, güvenlik açıkları, güncellemeler ve yapılandırmalardan kaynaklanan sorunlarda Luma sorumlu tutulamaz.</li>
                <li>Müşteri, hizmet dahilinde sahip olduğu yazılım ve programları kullanarak erişim hakkı bulunmayan dosya veya sistemlere erişmemeyi, bu tarz faaliyetlerden doğacak tüm zararı karşılamayı taahhüt eder.</li>
                <li>Ücretsiz veya limitsiz olarak sunulan hizmetler, müşteri tarafından üçüncü kişilere ücretli veya ücretsiz olarak dağıtılamaz ve satılamaz.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">25. Tebligat</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Taraflar, işbu sözleşmeden kaynaklanan her türlü tebligat için kayıt sırasında belirtilen e-posta ve posta adreslerini yasal ikametgah olarak kabul, beyan ve taahhüt etmişlerdir.</li>
                <li>Luma, sözleşme süresi içinde müşterinin kayıtlı e-posta adresine bildirim, ihtar, ödeme bildirimi ve hesap hareket bilgisi gönderebilir.</li>
                <li>Müşteri, söz konusu elektronik iletilerin kendisine ulaşmadığı iddiasında bulunamaz. Gönderilen iletiler, gönderim tarihinden 1 gün sonra yasal anlamda tebliğ edilmiş sayılır.</li>
                <li>Adres değişiklikleri yazılı olarak bildirilmedikçe mevcut kayıtlı adresler geçerli olacaktır.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">26. Sözleşme Değişiklikleri</h2>
              <p className="text-slate-400">
                Luma, işbu sözleşmeyi herhangi bir zamanda değiştirme, yeni maddeler ekleme veya mevcut maddeleri kaldırma hakkını saklı tutar. Değişiklikler web sitesinde yayımlanarak ve/veya e-posta yoluyla müşteriye bildirilir. Müşteri, Luma hizmetlerini kullanmaya devam ederek güncellenmiş sözleşme şartlarını kabul etmiş sayılır. Sözleşmenin en güncel ve geçerli hali her zaman lumayazilim.com adresinde yayımlanan halidir.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">27. Sözleşmenin Geçerliliği</h2>
              <p className="text-slate-400">
                İşbu sözleşme, müşterinin siteye kayıt olması ve/veya sipariş vermesi ile yürürlüğe girer. Müşteri, kayıt veya sipariş işlemi ile işbu sözleşmenin tüm maddelerini okuduğunu, anladığını, kabul ve taahhüt ettiğini beyan eder. Sözleşme süresi, müşterinin seçtiği ödeme periyodu kadardır. Taraflar sözleşmenin sona ermesinden önce fesih bildiriminde bulunmamışlar ise sözleşme aynı şart ve hükümlerle otomatik olarak uzar.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">28. Garanti Reddi Beyanı</h2>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                <p className="text-slate-400 mb-3">
                  Müşteri, aşağıdaki hususları kabul ve beyan eder:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-400">
                  <li>Site ve hizmetler <strong className="text-slate-200">"OLDUĞU GİBİ"</strong>, <strong className="text-slate-200">"MEVCUT HALİYLE"</strong> ve <strong className="text-slate-200">"TÜM KUSURLARIYLA"</strong> sunulmaktadır.</li>
                  <li>Luma, hizmetlerin kesintisiz, hatasız veya güvenli olacağına dair açık veya zımni hiçbir garanti vermez.</li>
                  <li>Luma, hizmetlerin müşterinin belirli bir amacına uygunluğu, ticari elverişliliği veya üçüncü taraf haklarını ihlal etmediği konusunda hiçbir taahhütte bulunmaz.</li>
                  <li>Luma çalışanları, destek ekibi veya satış temsilcileri tarafından sözlü veya yazılı olarak verilen hiçbir bilgi veya tavsiye, işbu sözleşmede yer almayan bir garanti oluşturmaz.</li>
                  <li>Müşteri, hizmetleri kendi risk ve sorumluluğunda kullanmayı kabul eder.</li>
                  <li>Luma, üçüncü taraf hizmet sağlayıcılarının (veri merkezi, ağ sağlayıcı, yazılım sağlayıcı vb.) eylem veya ihmallerinden sorumlu tutulamaz.</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">29. Mücbir Sebepler</h2>
              <p className="text-slate-400">
                Luma, aşağıdaki hallerde yükümlülüklerini yerine getirememesi veya gecikmesi nedeniyle sorumlu tutulamaz: doğal afetler, deprem, sel, yangın, salgın hastalık, savaş, terör eylemi, sivil kargaşa, hükümet kararları ve kısıtlamaları, yasal düzenleme değişiklikleri, ambargo, enerji kesintisi, internet altyapısı sorunları, veri merkezi arızaları, üçüncü taraf hizmet sağlayıcılarının aksaklıkları, siber saldırılar ve diğer Luma'nın makul kontrolü dışındaki olaylar. Mücbir sebep süresince Luma'nın yükümlülükleri askıya alınır ve bu süre sözleşme süresine eklenmez.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">30. Hizmet Değişikliği ve Sonlandırma Hakkı</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Luma, herhangi bir hizmeti önceden bildirimde bulunarak veya bulunmaksızın değiştirme, güncelleme veya sunmayı durdurma hakkını saklı tutar.</li>
                <li>Hizmet sonlandırılması durumunda Luma, makul süre öncesinde müşteriye bildirim yapmaya çalışacaktır. Müşteri, alternatif bir hizmete geçiş veya verilerini yedekleme sorumluluğunu üstlenir.</li>
                <li>Luma, müşterinin hizmetini en güncel sürüme bildirimli veya bildirimsiz olarak taşıyabilir. Bu geçişten doğabilecek uyumsuzluk veya aksaklıklardan Luma sorumlu tutulamaz.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">31. Devir ve Temlik</h2>
              <p className="text-slate-400">
                Luma, işbu sözleşmeden doğan hak ve yükümlülüklerini, müşterinin onayını almaksızın üçüncü kişilere devredebilir veya alt yükleniciler aracılığıyla yerine getirebilir. Müşteri, Luma'nın yazılı onayı olmaksızın sözleşmeden doğan haklarını veya yükümlülüklerini devredemez.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">32. Bölünebilirlik</h2>
              <p className="text-slate-400">
                İşbu sözleşmenin herhangi bir maddesinin veya hükmünün geçersiz, yasadışı veya uygulanamaz bulunması halinde, sözleşmenin kalan hükümleri tam olarak yürürlükte kalmaya devam eder. Geçersiz bulunan hüküm, tarafların niyetine en yakın şekilde geçerli bir hükümle değiştirilmiş sayılır.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">33. Uyuşmazlıkların Çözümü ve Yetkili Mahkeme</h2>
              <p className="text-slate-400">
                İşbu sözleşme 34 ana madde ve alt başlıklardan ibaret olup, taraflarca okunup anlaşılarak kabul edilmiştir. Sözleşmenin kabulü, sitenin kullanılması ve/veya siparişin verilmesi ile gerçekleşmiş sayılır. İşbu sözleşmenin uygulanması sırasında doğacak uyuşmazlıklarda Bursa Mahkemeleri ve İcra Daireleri yetkilidir. 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamındaki uyuşmazlıklarda ise Ticaret Bakanlığı tarafından ilan edilen değere kadar Tüketici Hakem Heyetleri, bu değerin üzerindeki uyuşmazlıklarda Tüketici Mahkemeleri yetkili olup, başvurular tüketicinin veya satıcının yerleşim yerindeki il veya ilçe tüketici hakem heyetlerine yapılabilir.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">34. İletişim</h2>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-1 text-sm text-slate-400">
                <p><strong className="text-slate-200">Unvan:</strong> Luma Yazılım - Enes POYRAZ</p>
                <p><strong className="text-slate-200">VKN:</strong> 7330923351</p>
                <p><strong className="text-slate-200">Adres:</strong> Üçevler Mah. Dumlupınar Cd. No:5/A Nilüfer/Bursa</p>
                <p><strong className="text-slate-200">Telefon:</strong> 0544 979 62 57</p>
                <p><strong className="text-slate-200">E-posta:</strong> <a href="mailto:info@lumayazilim.com" className="text-indigo-400 hover:text-indigo-300">info@lumayazilim.com</a></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
