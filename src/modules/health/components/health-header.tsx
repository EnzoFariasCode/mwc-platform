"use client";

import { useState, useRef, useEffect } from "react"; // Adicionado para o dropdown
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react"; // Adicionado signOut
import {
  User,
  ChevronDown,
  Activity,
  LogOut,
  LayoutDashboard,
  ExternalLink,
} from "lucide-react";

type HealthHeaderUser = {
  userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  jobTitle?: string | null;
  id?: string;
};

export function HealthHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false); // Estado do menu
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref para fechar ao clicar fora

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isHome = pathname === "/agendar-consulta";

  const sessionUser = (session?.user ?? {}) as HealthHeaderUser & {
    image?: string | null;
    name?: string | null;
    email?: string | null;
  };

  const firstName = session?.user?.name?.split(" ")[0] || "Meu Perfil";
  const isPro = sessionUser?.userType === "PROFESSIONAL";

  // Lógica Sênior: Fecha o menu ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#020617]/80 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl px-4 h-20 flex items-center justify-between">
        {/* LOGO (Mantido seu estilo) */}
        <Link
          href="/agendar-consulta"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Activity className="w-6 h-6 text-[#d73cbe]" />
          <span className="font-futura text-xl font-bold tracking-widest uppercase">
            MWC <span className="text-[#d73cbe]">Health</span>
          </span>
        </Link>

        {/* NAV (Mantido seu estilo) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link
            href="/agendar-consulta"
            className={
              isHome ? "text-white" : "hover:text-[#d73cbe] transition-colors"
            }
          >
            Início
          </Link>
          <Link
            href={
              isAuthenticated
                ? "/agendar-consulta/historico"
                : "/login?callbackUrl=/agendar-consulta/historico"
            }
            className="hover:text-[#d73cbe] transition-colors"
          >
            Minhas Consultas
          </Link>
        </nav>

        {isLoading ? (
          <div className="w-32 h-10 rounded-xl bg-slate-800/50 animate-pulse" />
        ) : isAuthenticated ? (
          /* ÁREA DO USUÁRIO COM DROPDOWN */
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center text-slate-300 group-hover:border-[#d73cbe]/50 overflow-hidden transition-colors">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={firstName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold leading-none text-white">
                  {firstName}
                </span>
                <span className="text-xs text-[#d73cbe] mt-1 font-medium uppercase tracking-wider">
                  {isPro ? sessionUser?.jobTitle || "Especialista" : "Paciente"}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 group-hover:text-white transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </div>

            {/* SUBMENU (O Dropdown que você pediu) */}
            {isOpen && (
              <div className="absolute right-0 mt-4 w-60 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  {/* Link: Ver Perfil ou Voltar ao Portal */}
                  <Link
                    href={
                      isPro
                        ? `/agendar-consulta/perfil/${sessionUser?.id || ""}`
                        : "/portal"
                    }
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors group"
                  >
                    <User className="w-4 h-4 text-[#d73cbe]" />
                    <span>
                      {isPro ? "Ver Perfil Público" : "Acessar Portal"}
                    </span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                  </Link>

                  {/* Link: Dashboard de cada um */}
                  <Link
                    href={
                      isPro
                        ? "/agendar-consulta/dashboard-profissional"
                        : "/agendar-consulta/historico"
                    }
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#d73cbe]" />
                    <span>{isPro ? "Meu Painel" : "Minhas Consultas"}</span>
                  </Link>

                  <div className="my-1 border-t border-white/5" />

                  {/* Botão Sair */}
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* BOTÃO LOGIN (Mantido seu estilo) */
          <Link
            href="/login?callbackUrl=/agendar-consulta"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#d73cbe]/10 text-[#d73cbe] rounded-xl hover:bg-[#d73cbe] hover:text-white transition-all font-medium border border-[#d73cbe]/20 hover:border-[#d73cbe] shadow-lg shadow-purple-900/10"
          >
            <User className="w-4 h-4" />
            Canal do Paciente
          </Link>
        )}
      </div>
    </header>
  );
}
