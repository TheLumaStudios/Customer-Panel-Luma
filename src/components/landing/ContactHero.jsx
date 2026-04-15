export default function ContactHero() {
  return (
    <section className="pt-32 pb-16 bg-slate-950">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-indigo-400 text-sm font-semibold rounded-full mb-6">
          Bize Ulaşın
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
          İşinizin{' '}
          <span className="text-indigo-400">büyümesine</span> nasıl yardımcı olabiliriz?
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Özellikler, fiyatlandırma veya teknik ihtiyaçlar hakkında sorunuz mu var? Uzman ekibimiz size 7/24 yardımcı olmaya hazır.
        </p>
      </div>
    </section>
  )
}
