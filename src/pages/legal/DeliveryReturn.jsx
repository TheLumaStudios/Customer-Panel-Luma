import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Truck, RotateCcw } from 'lucide-react'

export default function DeliveryReturn() {
  return (
    <div className="min-h-screen bg-slate-950">
      <SEO title="Teslimat, İade ve İptal" description="Luma Yazılım teslimat süreleri, iade ve iptal koşulları." path="/delivery-return" noindex={true} />
      <LandingHeader />

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <Truck className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Teslimat, İade ve İptal Koşulları</h1>
              <p className="text-sm text-slate-500">Son güncelleme: 15 Nisan 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <p>
                Luma Yazılım - Enes POYRAZ olarak sunduğumuz tüm hizmetler dijital niteliklidir. Fiziksel ürün teslimatı bulunmamaktadır. Bu sayfa, dijital hizmetlerimizin teslim koşullarını ve iade politikamızı açıklamaktadır.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">1. Hizmet Teslimat Süreleri</h2>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/40">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Hizmet Türü</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Teslimat Süresi</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Teslimat Şekli</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-400">
                    <tr className="border-b border-slate-800"><td className="py-3 px-4">Web Hosting</td><td className="py-3 px-4">Anında (otomatik)</td><td className="py-3 px-4">E-posta + Panel</td></tr>
                    <tr className="border-b border-slate-800"><td className="py-3 px-4">VPS Sunucu</td><td className="py-3 px-4">1-24 saat</td><td className="py-3 px-4">E-posta + Panel</td></tr>
                    <tr className="border-b border-slate-800"><td className="py-3 px-4">VDS Sunucu</td><td className="py-3 px-4">1-24 saat</td><td className="py-3 px-4">E-posta + Panel</td></tr>
                    <tr className="border-b border-slate-800"><td className="py-3 px-4">Dedicated Sunucu</td><td className="py-3 px-4">24-72 saat</td><td className="py-3 px-4">E-posta + Panel</td></tr>
                    <tr className="border-b border-slate-800"><td className="py-3 px-4">Alan Adı Tescil</td><td className="py-3 px-4">1-48 saat</td><td className="py-3 px-4">Panel</td></tr>
                    <tr><td className="py-3 px-4">SSL Sertifikası</td><td className="py-3 px-4">Anında (otomatik)</td><td className="py-3 px-4">Otomatik kurulum</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-500 mt-3">
                Teslimat süreleri ödemenin onaylanmasından itibaren başlar. Admin onayı gerektiren hizmetlerde süre mesai saatlerine göre hesaplanır.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">2. Teslimat Bilgileri</h2>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li>Tüm hizmetler dijital olarak teslim edilir. Fiziksel ürün gönderimi yoktur.</li>
                <li>Hizmet erişim bilgileri (kullanıcı adı, şifre, panel adresi) kayıtlı e-posta adresinize gönderilir.</li>
                <li>Ayrıca tüm hizmetlerinize müşteri paneliniz üzerinden erişebilirsiniz.</li>
                <li>Teslimat sonrası hizmetinizle ilgili sorun yaşamanız halinde 7/24 teknik destek ekibimize ulaşabilirsiniz.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-indigo-400" />
                3. İade Politikası
              </h2>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-4">
                <p className="text-sm text-red-300 font-medium">
                  Sunduğumuz tüm hizmetler dijital niteliklidir. Hizmet aktivasyonu ve erişim bilgilerinin iletilmesiyle birlikte hizmet teslim edilmiş sayılır. Teslim edilen dijital hizmetlerde iade yapılmaz.
                </p>
              </div>

              <p className="text-slate-400 mb-3">Müşteri, sipariş sürecinde aşağıdaki koşulları kabul ve beyan etmiş sayılır:</p>

              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Hosting, VPS/VDS, dedicated sunucu gibi dijital hizmetler, kurulumu tamamlanıp erişim bilgileri iletildikten sonra teslim edilmiş sayılır ve iade talep edilemez.</li>
                <li>Alan adı tescil ve transfer işlemleri geri dönüşü olmayan işlemlerdir, iade yapılmaz.</li>
                <li>Aktive edilmiş SSL sertifikalarında iade yapılmaz.</li>
                <li>Kullanılmış bakiye ve kredi iade edilmez.</li>
                <li>Kullanım koşulları ihlali veya yasa dışı faaliyet nedeniyle sonlandırılan hizmetlerde iade yapılmaz.</li>
                <li>Ön ödemeli dönemin kalan kısmı için kısmi iade yapılmaz.</li>
                <li>Müşteri, dijital hizmetlerin doğası gereği cayma hakkının bulunmadığını kabul eder.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">4. İptal Koşulları</h2>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li>Hizmetlerinizi dilediğiniz zaman müşteri panelinizden iptal edebilirsiniz.</li>
                <li>İptal edilen hizmetler, mevcut dönemin sonuna kadar aktif kalır. Dönem sonunda hizmet sonlandırılır.</li>
                <li>İptal edilen hizmetler için kalan dönem ücreti iade edilmez.</li>
                <li>Otomatik yenileme özelliği varsayılan olarak aktiftir. Panelden kapatılabilir.</li>
                <li>Yenileme faturası, hizmet bitiş tarihinden 7 gün önce oluşturulur.</li>
                <li>Ödeme yapılmayan hizmetler vade tarihinden 3 gün sonra askıya alınır, 15 gün sonra veriler silinerek hizmet iptal edilir.</li>
                <li>Kullanım koşullarının ihlali nedeniyle iptal edilen hizmetlerde ücret iadesi yapılmaz.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-3">5. İletişim</h2>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-1 text-sm text-slate-400">
                <p><strong className="text-slate-200">Yetkili:</strong> Enes POYRAZ</p>
                <p><strong className="text-slate-200">VKN:</strong> 7330923351</p>
                <p><strong className="text-slate-200">Adres:</strong> Cumhuriyet Mah. Başak Sk. Yükselen Park Nilüfer St. H Blok Kat:7 D:18 Nilüfer/Bursa</p>
                <p><strong className="text-slate-200">Telefon:</strong> 0546 780 59 72</p>
                <p><strong className="text-slate-200">E-posta:</strong> <a href="mailto:enespoyraz380@gmail.com" className="text-indigo-400 hover:text-indigo-300">enespoyraz380@gmail.com</a></p>
                <p><strong className="text-slate-200">Web:</strong> lumayazilim.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
