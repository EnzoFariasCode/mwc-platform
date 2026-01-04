import { Search, MapPin, ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] -z-10" />
      
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Encontre profissionais <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 animate-gradient bg-300%">
              extraordinários.
            </span>
          </h1>

          <p className="text-lg text-slate-400 mb-10 max-w-2xl leading-relaxed">
            De serviços digitais a reparos residenciais. Conecte-se com especialistas verificados em um ecossistema onde seu pagamento só é liberado após a conclusão.
          </p>

          {/* BARRA DE BUSCA PRINCIPAL (Glass Effect) */}
          <div className="w-full max-w-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl shadow-purple-900/20">
            
            <div className="flex-1 flex items-center px-4 h-12 md:h-14 bg-black/20 rounded-xl border border-transparent focus-within:border-purple-500/50 transition-all">
              <Search className="w-5 h-5 text-slate-500 mr-3" />
              <input 
                type="text" 
                placeholder="O que você precisa fazer?" 
                className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500"
              />
            </div>

            <div className="flex-[0.6] flex items-center px-4 h-12 md:h-14 bg-black/20 rounded-xl border border-transparent focus-within:border-purple-500/50 transition-all">
              <MapPin className="w-5 h-5 text-slate-500 mr-3" />
              <input 
                type="text" 
                placeholder="CEP ou Cidade" 
                className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500"
              />
            </div>

            <button className="h-12 md:h-14 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2">
              Buscar
            </button>
          </div>

          {/* Tags Populares */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-slate-500">
            <span>Populares:</span>
            {['Web Designer', 'Eletricista', 'Personal Trainer', 'Faxina', 'Dev Fullstack'].map((tag) => (
              <a key={tag} href="#" className="text-slate-300 hover:text-purple-400 transition-colors underline decoration-slate-700 underline-offset-4 hover:decoration-purple-400">
                {tag}
              </a>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}