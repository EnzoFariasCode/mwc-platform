"use client";

import { Bell, Search, Menu, UserCircle } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

export default function DashboardHeader() {
  const { userType, toggleUserType, toggleMobileMenu } = useDashboard();

  return (
    // Adicionei border-b border-white/5 para ficar igual a sidebar
    <header className="h-20 bg-slate-900 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 lg:hidden">
        <button onClick={toggleMobileMenu} className="text-white p-2">
          <Menu size={24} />
        </button>
        <span className="font-futura font-bold text-white">MWC</span>
      </div>

      <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar projetos ou profissionais..."
          className="w-full bg-slate-950 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#d73cbe] transition-all placeholder:text-slate-500"
        />
      </div>

      <div className="flex items-center gap-4 lg:gap-6 ml-auto">
        {/* --- O SWITCH CORRIGIDO --- */}
        {/* Removi o p-1 que causava o desalinhamento e ajustei as cores */}
        <div className="hidden sm:flex bg-slate-950 rounded-full border border-white/10 relative overflow-hidden">
          {/* Fundo Animado (Roxo) - Ajustado para cobrir exatamente a metade */}
          <div
            className={`absolute top-0 bottom-0 w-1/2 bg-[#d73cbe] transition-all duration-300
                ${
                  userType === "client" ? "translate-x-full" : "translate-x-0"
                }`}
          />

          {/* Botão Profissional */}
          <button
            onClick={() => userType === "client" && toggleUserType()}
            className={`relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              userType === "professional"
                ? "text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sou Profissional
          </button>
          {/* Botão Cliente */}
          <button
            onClick={() => userType === "professional" && toggleUserType()}
            className={`relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              userType === "client"
                ? "text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sou Cliente
          </button>
        </div>

        <button className="relative text-slate-400 hover:text-white transition-colors">
          <Bell size={22} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#d73cbe] rounded-full border-2 border-slate-900"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-white leading-none">
              João Silva
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {userType === "professional"
                ? "Nível Starter"
                : "Cliente Verificado"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d73cbe] to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
              <UserCircle size={28} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
