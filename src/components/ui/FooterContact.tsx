"use client";

import { useRef } from "react";
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import logoImg from "@/assets/images/landingPage/logo.png";

gsap.registerPlugin(ScrollTrigger);

function FooterContact() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // 1. Colunas do Footer (Surgem de baixo)
      gsap.fromTo(
        ".gsap-footer-col",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2, // Uma coluna por vez
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 90%", // Anima assim que o topo do footer encostar no fim da tela
          },
        }
      );

      // 2. Linha Decorativa Roxa (Efeito de desenho crescendo)
      gsap.fromTo(
        ".gsap-nav-line",
        { height: "0%" }, // Começa sem altura
        {
          height: "100%", // Cresce até o fim
          duration: 1.5,
          ease: "expo.out",
          delay: 0.5, // Espera as colunas subirem um pouco
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 90%",
          },
        }
      );

      // 3. Ícones Sociais (Pop effect)
      gsap.fromTo(
        ".gsap-social-icon",
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <footer
      ref={containerRef}
      className="bg-slate-950 border-t border-white/5 pt-20 pb-10 px-4 relative overflow-hidden"
    >
      {/* Background Glow no Rodapé */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 md:gap-8 items-center md:items-start text-center md:text-left">
        {/* COLUNA 1 */}
        {/* Adicionei 'gsap-footer-col' e 'opacity-0' */}
        <div className="gsap-footer-col opacity-0 flex flex-col items-center gap-8 w-full md:w-1/3">
          <div className="flex flex-col items-center">
            <div className="w-32 mb-4">
              <Image
                src={logoImg}
                alt="Logo MCW"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold font-sans tracking-tight text-white font-futura uppercase">
              Maximum World Click
            </h2>
          </div>

          {/* Ícones Sociais */}
          <div className="flex gap-4 p-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
            {/* Adicionei 'gsap-social-icon' em cada um */}
            <a
              href="#"
              className="gsap-social-icon p-2 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Facebook className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </a>
            <a
              href="#"
              className="gsap-social-icon p-2 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Instagram className="w-5 h-5 text-slate-400 group-hover:text-pink-500 transition-colors" />
            </a>
            <a
              href="#"
              className="gsap-social-icon p-2 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Linkedin className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
            </a>
            <a
              href="#"
              className="gsap-social-icon p-2 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Youtube className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
            </a>
          </div>
        </div>

        {/* COLUNA 2 */}
        {/* Adicionei 'gsap-footer-col' e 'opacity-0' */}
        <div className="gsap-footer-col opacity-0 flex flex-col md:flex-row gap-12 w-full md:w-1/3 justify-center">
          {/* Grupo 1 */}
          <nav className="relative pl-6 md:text-left">
            {/* Linha Vertical - Adicionei 'gsap-nav-line' */}
            <div className="gsap-nav-line hidden md:block absolute top-0 bottom-0 left-0 w-0.5 bg-[#d73cbe]"></div>
            <div className="hidden md:block absolute top-0 left-[-4px] w-2.5 h-2.5 bg-[#d73cbe] rotate-45"></div>

            <ul className="space-y-3">
              <li>
                <Link
                  href="/sobre"
                  className="text-slate-300 hover:text-[#d73cbe] transition-colors"
                >
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link
                  href="/politicas"
                  className="text-slate-300 hover:text-[#d73cbe] transition-colors"
                >
                  Políticas do site
                </Link>
              </li>
              <li>
                <Link
                  href="/pagamento"
                  className="text-slate-300 hover:text-[#d73cbe] transition-colors"
                >
                  Formas de pagamento
                </Link>
              </li>
              <li>
                <Link
                  href="/contato"
                  className="text-slate-300 hover:text-[#d73cbe] transition-colors"
                >
                  Contato
                </Link>
              </li>
              <li>
                <Link
                  href="/planos"
                  className="text-slate-300 hover:text-[#d73cbe] transition-colors font-medium text-white"
                >
                  Planos Profissionais
                </Link>
              </li>
            </ul>
          </nav>

          {/* Grupo 2 */}
          <nav className="relative pl-6 md:text-left">
            {/* Linha Vertical - Adicionei 'gsap-nav-line' */}
            <div className="gsap-nav-line hidden md:block absolute top-0 bottom-0 left-0 w-0.5 bg-[#d73cbe]"></div>
            <div className="hidden md:block absolute bottom-0 left-[-4px] w-2.5 h-2.5 bg-[#d73cbe] rotate-45"></div>

            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-slate-300 hover:text-[#d73cbe] transition-colors"
                >
                  Página Inicial
                </Link>
              </li>
              <li>
                <Link
                  href="/criar-site"
                  className="text-slate-300 hover:text-[#d73cbe] transition-colors"
                >
                  Criar um site
                </Link>
              </li>
              <li>
                <Link
                  href="/criar-logo"
                  className="text-slate-300 hover:text-[#d73cbe] transition-colors"
                >
                  Criar Logo
                </Link>
              </li>
              <li>
                <Link
                  href="/book"
                  className="text-slate-300 hover:text-[#d73cbe] transition-colors"
                >
                  Book de Fotos
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* COLUNA 3 */}
        {/* Adicionei 'gsap-footer-col' e 'opacity-0' */}
        <div className="gsap-footer-col opacity-0 flex flex-col items-center md:items-end gap-6 w-full md:w-1/3">
          <h3 className="text-2xl font-bold text-white uppercase tracking-wider">
            Contato
          </h3>

          <address className="not-italic flex flex-col items-center md:items-end gap-3 text-slate-400">
            <a
              href="mailto:contato@mcw.com.br"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" /> contato@mcw.com.br
            </a>
            <a
              href="tel:+551199999999"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" /> +55 (11) 9999-9999
            </a>
          </address>

          <button className="border border-white/20 cursor-pointer hover:border-[#d73cbe] text-white hover:text-[#d73cbe] px-6 py-2 rounded-lg transition-all uppercase text-sm tracking-widest font-medium">
            Trabalhe conosco
          </button>
        </div>
      </div>
      <div className="border-t border-white/10 mt-16 pt-8 text-center text-slate-600 text-sm">
        <p>
          &copy; {new Date().getFullYear()} Maximum World Click. Todos os
          direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export default FooterContact;
