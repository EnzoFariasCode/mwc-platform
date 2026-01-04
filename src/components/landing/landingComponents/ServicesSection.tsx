'use client'; // Recomendado pois tem hover e interatividade
import Image from 'next/image'; // 1. Importar Image

// Imports das imagens (mantém igual)
import eletricista from '@/assets/images/landingPage/eletricista.jpg';
import encanador from '@/assets/images/landingPage/encanador.avif';
import designer from '@/assets/images/landingPage/logocreator.webp';
import pedreiro from '@/assets/images/landingPage/pedreiro.webp';
import desenvolvedor from '@/assets/images/landingPage/sitecreator.webp';
import videomaker from '@/assets/images/landingPage/videomaker.webp';

export const services = [
  {
    title: "Eletricista",
    imgSrc: eletricista,
  },
  {
    title: "Encanador",
    imgSrc: encanador,
  },
  {
    title: "Designer Gráfico",
    imgSrc: designer,
  },
  {
    title: "Pedreiro",
    imgSrc: pedreiro,
  },
  {
    title: "Desenvolvedor Web",
    imgSrc: desenvolvedor,
  },
  {
    title: "Videomaker",
    imgSrc: videomaker,
  },
];

function ServicesSection() {
  return (
    <section className="relative py-24 px-4 bg-slate-950">
      
      <div className="max-w-5xl mx-auto">

        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 uppercase font-futura">
          Basta escolher um <span className="text-[#d73cbe]">serviço</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div 
              key={index}
              // 'group' e 'relative' são essenciais aqui para o Image fill funcionar
              className="group relative h-[280px] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:-translate-y-2 transition-transform duration-300 ease-out"
            >
              
              {/* SUBSTITUIÇÃO DO BACKGROUND-IMAGE POR NEXT/IMAGE 
                  A prop 'fill' faz a imagem preencher o pai (que tem relative).
                  A classe 'object-cover' faz ela não distorcer (igual bg-cover).
              */}
              <Image 
                src={service.imgSrc} 
                alt={service.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                placeholder="blur" // Efeito de carregamento bonito
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Otimização de performance
              />

              {/* Overlay Escuro (Mantém igual) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 z-10" />

              {/* Conteúdo (Texto e Botão) */}
              <div className="absolute bottom-0 left-0 w-full p-6 text-center z-20 flex flex-col items-center">
                <h3 className="text-xl font-bold text-white mb-4 font-sans tracking-wide">
                  {service.title}
                </h3>
                
                <button className="bg-[#d73cbe] hover:bg-[#c02aa8] text-white px-6 py-2 rounded-full font-medium text-sm transition-all shadow-[0_4px_14px_0_rgba(215,60,190,0.39)] hover:shadow-[0_6px_20px_rgba(215,60,190,0.23)] hover:scale-105 flex items-center gap-2">
                  Fazer Orçamento
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-24 h-px w-full max-w-2xl mx-auto bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>
    </section>
  );
}

export default ServicesSection;