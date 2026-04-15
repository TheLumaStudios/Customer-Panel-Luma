import SEO from '@/components/seo/SEO'
import LandingHeader from '@/components/landing/LandingHeader'
import LandingFooter from '@/components/landing/LandingFooter'
import { Building2, Users, Shield, Zap, Globe, Headphones } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-slate-950">
      <SEO
        title="Hakkımızda"
        description="Luma Yazılım hakkında. Bursa merkezli web hosting, domain ve sunucu hizmetleri sunan teknoloji şirketi."
        path="/about"
        schema={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "Luma Yazılım Hakkında",
          "url": "https://lumayazilim.com/about"
        }}
      />
      <LandingHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[128px]" />

        <div className="relative container px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span className="text-sm text-slate-300">Hakkımızda</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Luma Yazılım - Enes POYRAZ</h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Yüksek performanslı hosting, sunucu ve dijital altyapı çözümleri sunan kurumsal bir teknoloji şirketiyiz.
            </p>
          </div>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <p>
                Luma Yazılım olarak, bireylerin ve işletmelerin dijital dünyada güçlü ve güvenli bir şekilde var olabilmeleri için en son teknoloji altyapı hizmetlerini sunuyoruz. NVMe SSD depolama, LiteSpeed web sunucuları ve kurumsal düzeyde güvenlik çözümleri ile müşterilerimizin dijital varlıklarını en üst seviyede koruyoruz.
              </p>
            </div>

            {/* Values */}
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: Shield, title: 'Güvenilirlik', desc: '%99.9 uptime garantisi ve çok katmanlı güvenlik altyapısı ile kesintisiz hizmet.', gradient: 'from-emerald-500 to-teal-500' },
                { icon: Zap, title: 'Performans', desc: 'NVMe SSD, LiteSpeed ve Cloudflare CDN entegrasyonu ile yıldırım hızında altyapı.', gradient: 'from-amber-500 to-orange-500' },
                { icon: Headphones, title: 'Destek', desc: '7/24 uzman teknik destek ekibimiz ile her an yanınızdayız.', gradient: 'from-indigo-500 to-violet-500' },
              ].map(v => (
                <div key={v.title} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 text-center">
                  <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br ${v.gradient} mb-4 shadow-lg`}>
                    <v.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-400">{v.desc}</p>
                </div>
              ))}
            </div>

            {/* Company Info */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Şirket Bilgileri</h2>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2 text-sm text-slate-400">
                <p><strong className="text-slate-200">Unvan:</strong> Luma Yazılım - Enes POYRAZ</p>
                <p><strong className="text-slate-200">VKN:</strong> 7330923351</p>
                <p><strong className="text-slate-200">Adres:</strong> Üçevler Mah. Dumlupınar Cd. No:5/A Nilüfer/Bursa</p>
                <p><strong className="text-slate-200">Telefon:</strong> 0544 979 62 57</p>
                <p><strong className="text-slate-200">E-posta:</strong> info@lumayazilim.com</p>
                <p><strong className="text-slate-200">Web:</strong> lumayazilim.com</p>
              </div>
            </div>

            {/* Services Summary */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Hizmetlerimiz</h2>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li>Paylaşımlı Web Hosting (Linux, WordPress, Plesk, Reseller)</li>
                <li>Sanal Özel Sunucu (VPS/VDS) - KVM sanallaştırma</li>
                <li>Dedicated (Fiziksel) Sunucu kiralama</li>
                <li>Oyun Sunucusu barındırma (Minecraft, CS:GO/CS2)</li>
                <li>Alan adı tescil ve yönetimi</li>
                <li>SSL sertifikası ve güvenlik çözümleri</li>
                <li>DDoS koruma ve CDN hizmetleri</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
