'use client';
import Link from 'next/link';
import Image from 'next/image'; // <--- O SEGREDO DO NEXT.JS
import Logo from '@/assets/images/landingPage/logo.png'; 

const StandardHeader = () => {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/10 backdrop-blur-md bg-slate-950/80 transition-all duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Lado Esquerdo: Logo + Nome */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity h-full py-4">
           {/* USANDO O COMPONENTE IMAGE DO NEXT */}
           <Image 
             src={Logo} 
             alt="MCW Logo" 
             className="h-12 w-auto object-contain" 
             priority // Carrega essa imagem primeiro que tudo (bom para LCP)
           />
           <span className="text-white font-bold text-xl tracking-wider font-futura pt-1">MWC</span>
        </Link>

        {/* Centro: Vazio */}
        <div className="flex-1"></div>

        {/* Lado Direito: Navegação + Login */}
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-slate-300 hover:text-[#d73cbe] transition-colors hidden sm:block">
            Página Inicial
          </Link>
          
          <Link href="/#planos" className="text-sm font-medium text-slate-300 hover:text-[#d73cbe] transition-colors hidden sm:block">
            Planos
          </Link>

          <Link 
            href="/login" 
            className="px-6 py-2 rounded-full text-white font-bold text-sm bg-[#d73cbe] hover:bg-[#c02aa8] shadow-lg shadow-[#d73cbe]/20 hover:shadow-[#d73cbe]/40 transition-all transform hover:-translate-y-0.5"
          >
            Login
          </Link>
        </nav>

      </div>
    </header>
  );
};

export default StandardHeader;