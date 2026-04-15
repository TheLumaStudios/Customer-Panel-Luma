import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { FileText } from 'lucide-react'

export default function DistanceSalesAgreement() {
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
              <h1 className="text-3xl font-bold text-white">Mesafeli Satış Sözleşmesi</h1>
              <p className="text-sm text-slate-500">6502 Sayılı Tüketicinin Korunması Hakkında Kanun</p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <p>
                İşbu Mesafeli Satış Sözleşmesi, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, SATICI ile ALICI arasında aşağıdaki şartlar dahilinde akdedilmiştir.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 1 - Taraflar</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-sm text-slate-400 space-y-1">
                  <h4 className="font-semibold text-slate-200 mb-2">SATICI</h4>
                  <p><strong className="text-slate-300">Unvan:</strong> Luma Yazılım - Enes POYRAZ</p>
                  <p><strong className="text-slate-300">VKN:</strong> 7330923351</p>
                  <p><strong className="text-slate-300">Adres:</strong> Üçevler Mah. Dumlupınar Cd. No:5/A Nilüfer/Bursa</p>
                  <p><strong className="text-slate-300">Telefon:</strong> 0544 979 62 57</p>
                  <p><strong className="text-slate-300">E-posta:</strong> info@lumayazilim.com</p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-sm text-slate-400 space-y-1">
                  <h4 className="font-semibold text-slate-200 mb-2">ALICI</h4>
                  <p>Sipariş sırasında beyan edilen ad, soyad, adres ve iletişim bilgileri geçerlidir.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 2 - Sözleşme Konusu</h2>
              <p className="text-slate-400">
                İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait web sitesinden elektronik ortamda sipariş verdiği, sözleşmede belirtilen niteliklere sahip hosting, sunucu, alan adı ve/veya dijital hizmetin satışı ile ilgili olarak 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 3 - Hizmet Bilgileri ve Fiyat</h2>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li>Hizmetin türü, özellikleri ve fiyatı sipariş sayfasında belirtildiği şekildedir.</li>
                <li>Listelenen fiyatlar satış fiyatıdır. Fiyatlar ve kampanyalar güncelleme yapılana kadar geçerlidir.</li>
                <li>Tüm fiyatlar aksi belirtilmedikçe KDV hariçtir.</li>
                <li>Ödeme kredi kartı, banka havalesi/EFT veya bakiye ile yapılabilir.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 4 - Hizmetin Teslimi</h2>
              <p className="text-slate-400">
                Dijital hizmetler (hosting, VPS/VDS, alan adı) ödemenin onaylanmasının ardından elektronik ortamda teslim edilir. Hosting ve sunucu hizmetleri, ödeme onayı sonrası admin onayını takiben en geç 24 saat içinde aktif edilir. Alan adı tescil işlemleri, kayıt kuruluşunun işlem süresine bağlı olarak 1-48 saat içinde tamamlanır.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 5 - Cayma Hakkı ve İade</h2>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-4">
                <p className="text-sm text-red-300 font-medium">
                  Sunulan tüm hizmetler dijital niteliklidir. Mesafeli Sözleşmeler Yönetmeliği'nin 15/ğ maddesi uyarınca, elektronik ortamda anında ifa edilen ve tüketiciye anında teslim edilen gayri maddi mallara ilişkin sözleşmelerde cayma hakkı kullanılamaz.
                </p>
              </div>
              <p className="text-slate-400 mb-3">ALICI, aşağıdaki hususları sipariş öncesinde kabul ve beyan etmiş sayılır:</p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li>Hosting, VPS/VDS, dedicated sunucu, oyun sunucusu gibi tüm dijital hizmetler, kurulumu tamamlanıp erişim bilgileri iletildikten sonra teslim edilmiş sayılır. <strong className="text-slate-200">Teslim edilen dijital hizmetlerde cayma hakkı kullanılamaz ve iade yapılmaz.</strong></li>
                <li>Alan adı tescil ve transfer işlemleri geri dönüşü olmayan işlemlerdir, cayma hakkı ve iade yoktur.</li>
                <li>Aktive edilmiş SSL sertifikalarında cayma hakkı ve iade yoktur.</li>
                <li>Kullanım koşullarının ihlali veya yasa dışı faaliyet nedeniyle sonlandırılan hizmetlerde iade yapılmaz.</li>
                <li>Hizmet süresinin uzatılmasından (yenileme) sonra iade geçerli değildir.</li>
                <li>Ön ödemeli dönemin kalan kısmı için kısmi iade yapılmaz.</li>
                <li>Kullanılmış bakiye ve kredi iade edilmez.</li>
                <li>ALICI, sunucu üzerinde barındırdığı tüm içeriklerden bizzat sorumlu olduğunu, SATICI'nın bu içeriklerden doğacak hukuki ve cezai sorumluluğunun bulunmadığını kabul eder.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 6 - Genel Hükümler</h2>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li>ALICI, sipariş öncesinde sözleşme konusu hizmetin temel niteliklerini, fiyatını ve ödeme şeklini okuyup bilgi sahibi olduğunu kabul eder.</li>
                <li>Hizmetten yararlanmak için 18 yaşını doldurmuş olmak gerekmektedir.</li>
                <li>SATICI, sipariş konusu hizmeti eksiksiz ve sözleşmede belirtilen niteliklere uygun olarak teslim etmeyi taahhüt eder.</li>
                <li>SATICI, mücbir sebep halleri nedeniyle hizmeti süresinde teslim edemez ise durumu ALICI'ya bildirmekle yükümlüdür.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 7 - Uyuşmazlık Çözümü</h2>
              <p className="text-slate-400">
                İşbu sözleşmeden doğan uyuşmazlıklarda Ticaret Bakanlığı tarafından ilan edilen değere kadar Tüketici Hakem Heyetleri, bu değerin üzerindeki uyuşmazlıklarda Tüketici Mahkemeleri yetkilidir. Başvurular ALICI'nın veya SATICI'nın yerleşim yerindeki il veya ilçe tüketici hakem heyetlerine yapılabilir.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Madde 8 - Yürürlük</h2>
              <p className="text-slate-400">
                ALICI, sipariş sürecinde işbu sözleşmenin tüm koşullarını okuduğunu, anladığını ve kabul ettiğini onaylar. Sözleşme, siparişin onaylanması ile birlikte yürürlüğe girer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
