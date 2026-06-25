"use client";

import Image from "next/image";
import Link from "next/link";

import Logo from "@/assets/images/landingPage/logo.png";

const LandingHeader = () => {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const headerOffset = 96;
    const targetTop =
      section.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({ top: targetTop, behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link
          href="/"
          className="flex h-full cursor-pointer items-center gap-3 py-4 transition-opacity hover:opacity-80"
        >
          <Image
            src={Logo}
            alt="MWC Logo"
            className="h-12 w-auto object-contain"
            priority
          />
          <span className="pt-1 font-futura text-xl font-bold tracking-wider text-white">
            MWC
          </span>
        </Link>

        <div className="flex items-center gap-3 md:gap-8">
          <nav className="hidden gap-8 text-sm font-medium text-slate-300 lg:flex">
            <button
              type="button"
              onClick={() => scrollToSection("como-funciona")}
              className="cursor-pointer transition-colors hover:text-[#d73cbe]"
            >
              Como funciona
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("servicesSection")}
              className="cursor-pointer transition-colors hover:text-[#d73cbe]"
            >
              Servicos
            </button>
            <Link
              href="/search"
              className="cursor-pointer transition-colors hover:text-[#d73cbe]"
            >
              Contratar
            </Link>
            <Link
              href="/beWorker#planos"
              className="cursor-pointer transition-colors hover:text-[#d73cbe]"
            >
              Planos
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden items-center rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Entrar
            </Link>

            <Link
              href="/search"
              className="group relative inline-flex items-center rounded-full border border-transparent bg-[#d73cbe] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#d73cbe]/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#c02aa8] hover:shadow-[#d73cbe]/50 sm:px-5"
            >
              <span className="relative z-10 tracking-wide">
                <span className="hidden sm:inline">Contratar profissional</span>
                <span className="sm:hidden">Contratar</span>
              </span>
              <div className="absolute inset-0 rounded-full bg-white/0 transition-colors duration-300 group-hover:bg-white/10" />
            </Link>

            <Link
              href="/beWorker"
              className="hidden items-center rounded-full border border-[#d73cbe]/40 px-5 py-2.5 text-sm font-bold text-[#f4a7e8] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d73cbe] hover:bg-[#d73cbe]/10 hover:text-white md:inline-flex"
            >
              Sou profissional
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
