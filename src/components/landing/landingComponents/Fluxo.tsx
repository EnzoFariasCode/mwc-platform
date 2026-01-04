export function Fluxo() {
  return (
    <section className="relative py-20 px-4 bg-slate-950 border-b border-white/5 overflow-hidden">
      
      {/* Background Decorativo (Gradient Blob) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] -z-10" />

      {/* AJUSTE: Reduzi de max-w-7xl para max-w-6xl para não ficar tão largo */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        
        {/* COLUNA DA ESQUERDA: Título e Imagem */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight font-futura uppercase">
            Entenda o Fluxo <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              do Negócio
            </span>
          </h2>

          <div className="relative group w-full max-w-md lg:max-w-full mx-auto lg:mx-0">
            {/* Efeito de borda brilhante na imagem */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[32px] rounded-tl-[12px] opacity-75 blur-md group-hover:opacity-100 transition duration-500"></div>
            
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
              alt="Business meeting" 
              className="relative w-full h-auto object-cover rounded-[30px] rounded-tl-[10px] border border-white/10 shadow-2xl"
            />
          </div>
        </div>

        {/* COLUNA DA DIREITA: Caixas de Texto */}
        <div className="flex-1 flex flex-col gap-4 w-full">
          
          {/* Box 1 - AJUSTE: Padding reduzido para p-6 */}
          <div className="p-6 border border-white/20 hover:border-purple-500/50 rounded-none bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] group">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 font-sans uppercase tracking-wide group-hover:text-[#d73cbe] transition-colors">
              Peça o que precisa
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              Tem uma necessidade? Escolha o tipo de profissional que procura
              (eletricista, cozinheiro, designer, etc.) e descreva o serviço em poucos cliques.
            </p>
          </div>

          {/* Box 2 - AJUSTE: Padding reduzido para p-6 */}
          <div className="p-6 border border-white/20 hover:border-purple-500/50 rounded-none bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] group">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 font-sans uppercase tracking-wide group-hover:text-[#d73cbe] transition-colors">
              Converse com profissionais
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              Os profissionais recebem sua solicitação e respondem pelo nosso
              chat interno — de forma segura, rápida e sem expor seus dados pessoais.
            </p>
          </div>

          {/* Box 3 - AJUSTE: Padding reduzido para p-6 */}
          <div className="p-6 border border-white/20 hover:border-purple-500/50 rounded-none bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] group">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 font-sans uppercase tracking-wide group-hover:text-[#d73cbe] transition-colors">
              Combine e feche negócio
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              Negocie valores, prazos e finalize o serviço com o Pagamento Seguro (Escrow) dentro da plataforma. O dinheiro só sai quando você aprovar.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}