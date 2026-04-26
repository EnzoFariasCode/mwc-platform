"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, ChevronDown, Activity } from "lucide-react";

export function HealthHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isHome = pathname === "/agendar-consulta";

  const firstName = session?.user?.name?.split(" ")[0] || "Meu Perfil";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#020617]/80 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl px-4 h-20 flex items-center justify-between">
        <Link
          href="/agendar-consulta"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Activity className="w-6 h-6 text-[#d73cbe]" />
          <span className="font-futura text-xl font-bold tracking-widest uppercase">
            MWC <span className="text-[#d73cbe]">Health</span>
          </span>
        </Link>

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
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center text-slate-300 group-hover:border-[#d73cbe]/50 overflow-hidden transition-colors">
              {session.user?.image ? (
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
              <span className="text-xs text-[#d73cbe] mt-1 font-medium">
                Paciente
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors ml-1" />
          </div>
        ) : (
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
