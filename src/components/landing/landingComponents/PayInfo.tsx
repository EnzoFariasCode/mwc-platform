"use client";
import { ShieldCheck, CreditCard, Banknote } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // Importante para otimização

// Caminho limpo usando o alias @
import cardFlagsImg from '@/assets/images/landingPage/payments.png';

function PayInfo() {
  return (
    <section className="relative py-24 px-4 bg-slate-950 border-b border-white/5 overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        
        {/* CARD 1: Formas de Pagamento */}
        <div className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-8 lg:p-12 flex flex-col items-start justify-center gap-6 hover:border-purple-500/30 transition-all duration-300 group">
          
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <CreditCard className="w-6 h-6 text-purple-400" />
          </div>

          <h2 className="text-3xl md:text-3xl font-bold font-futura uppercase tracking-tight text-white leading-tight">
            Aceitamos todas as <br />
            <span className="text-[#d73cbe]">formas de pagamento</span>
          </h2>

          <p className="text-slate-300 text-lg">
            Facilidade para quem contrata e segurança para quem recebe. Aceitamos Cartão de Crédito e PIX.
          </p>

          <div className="flex flex-col gap-4 my-4 w-full">
             <div className="flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                    <CreditCard className="w-5 h-5 text-slate-300" />
                    <span className="text-sm text-slate-300">Cartão de Crédito</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                    <Banknote className="w-5 h-5 text-slate-300" />
                    <span className="text-sm text-slate-300">PIX</span>
                </div>
             </div>

             {/* Imagem otimizada pelo Next.js */}
             <div className="mt-2 w-full flex items-center justify-start opacity-60">
                <Image 
                    src={cardFlagsImg} 
                    alt="Bandeiras Aceitas: Visa, Master, Elo, etc" 
                    className="h-16 w-auto object-contain" // Ajustei altura fixa para manter proporção
                    placeholder="blur" // Efeito legal de carregamento
                />
             </div>
          </div>

          {/* Correção do Link: href em vez de to */}
          <Link href="/#planos"> 
            <button className="bg-[#d73cbe] hover:bg-[#b0269a] cursor-pointer text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 hover:translate-x-1">
              Ver Planos
            </button>
          </Link>
        </div>

        {/* CARD 2: Segurança (Mantém igual, só conferindo o layout) */}
        <div className="border border-white/10 bg-gradient-to-br from-white/5 to-purple-900/10 backdrop-blur-md rounded-2xl p-8 lg:p-12 flex flex-col items-center text-center justify-center gap-6 hover:border-blue-500/30 transition-all duration-300 group">
          
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform duration-500">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold font-sans uppercase tracking-tight text-white leading-tight">
            Segurança em <br />
            <span className="text-blue-400">Primeiro Lugar</span>
          </h2>

          <p className="text-slate-300 text-lg leading-relaxed">
            O valor pago fica protegido (Escrow) até a conclusão do serviço. 
            Garantimos que o profissional só receba após a entrega conforme combinado.
            <br /><br />
            <span className="text-white font-medium">Algo saiu errado?</span> Reembolso simples e sem burocracia.
          </p>
        </div>

      </div>
    </section>
  );
}

export default PayInfo;