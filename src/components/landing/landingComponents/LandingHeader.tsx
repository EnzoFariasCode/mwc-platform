"use client";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/images/landingPage/logo.png"; // Verifique se o caminho está batendo

const LandingHeader = () => {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/10 backdrop-blur-md bg-black/20 transition-all duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity h-full py-4"
        >
          <Image
            src={Logo}
            alt="MCW Logo"
            className="h-12 w-auto object-contain"
            priority
          />
          <span className="text-white font-bold text-xl tracking-wider font-futura pt-1">
            MWC
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
            <Link
              href="#como-funciona"
              className="hover:text-[#d73cbe] transition-colors cursor-pointer"
            >
              Como funciona
            </Link>
            <Link
              href="#servicos"
              className="hover:text-[#d73cbe] transition-colors cursor-pointer"
            >
              Serviços
            </Link>
            <Link
              href="#profissionais"
              className="hover:text-[#d73cbe] transition-colors cursor-pointer"
            >
              Profissionais
            </Link>
          </nav>
          {/* Botão "Quero ser um profissional" */}
          <Link
            href="/beWorker" // Mudamos de 'to' para 'href'
            className="group relative px-6 py-2.5 rounded-full text-white font-bold text-sm transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer bg-[#d73cbe] hover:bg-[#c02aa8] shadow-lg shadow-[#d73cbe]/20 hover:shadow-[#d73cbe]/50 border border-transparent hover:border-white/20 inline-flex items-center"
          >
            <span className="relative z-10 tracking-wide">
              Quero ser um profissional
            </span>
            <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
