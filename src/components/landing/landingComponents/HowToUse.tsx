"use client";
import { ArrowRight } from 'lucide-react';
import Image from 'next/image'; // 1. Importar o componente Image

// 2. Imports das imagens (mantive os que você mandou)
import pedido1 from '@/assets/images/landingPage/pedido1.webp';
import pedido2 from '@/assets/images/landingPage/pedido2.webp';
import pedido3 from '@/assets/images/landingPage/pedido3.webp';

const steps = [
  {
    title: "1. Peça o serviço",
    imgSrc: pedido1, // imgSrc agora é um objeto do Next.js
    description: "Escolha o tipo de profissional que precisa e descreva seu projeto. Rápido, simples e sem complicação."
  },
  {
    title: "2. Converse e negocie",
    imgSrc: pedido2,
    description: "O profissional recebe sua solicitação e entra em contato pelo chat interno para alinhar detalhes e valores."
  },
  {
    title: "3. Pagamento Seguro",
    imgSrc: pedido3,
    description: "O valor fica protegido (Escrow) e só é liberado ao profissional quando você confirmar que o serviço foi concluído."
  }
];

function HowToUse() {
  return (
    // Adicionei id="como-funciona" para o link do header funcionar
    <section className="relative py-24 px-4 bg-slate-950 overflow-hidden" id="como-funciona">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-900/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          {/* Removi o id duplicado daqui */}
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#d73cbe] drop-shadow-lg mb-4 font-futura uppercase">
            Simples de Usar
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Resolva seu problema em 3 passos simples, com total segurança e garantia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 relative">
          
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent z-0" />

          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-900/20">
                
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-slate-800">
                  {/* 3. Substituição da tag <img> por <Image /> */}
                  <Image
                    src={step.imgSrc}
                    alt={step.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    placeholder="blur" // Adiciona um efeito de carregamento bonito se a imagem for grande
                  />
                  
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#d73cbe] flex items-center justify-center text-white font-bold shadow-lg z-20">
                    {index + 1}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 font-sans">
                  {step.title}
                </h3>
                
                <p className="text-slate-300 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-[50%] -right-8 translate-x-1/2 -translate-y-1/2 z-20 text-purple-500/50">
                  <ArrowRight className="w-8 h-8" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-24 h-px w-full max-w-4xl mx-auto bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>
    </section>
  );
}

export default HowToUse;