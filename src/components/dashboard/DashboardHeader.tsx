"use client";

import { Bell, Search, Menu } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { NotificationDropdown } from "./NotificationDropdown";
import { usePathname, useRouter } from "next/navigation"; // 1. Novos imports

export default function DashboardHeader() {
  // 2. Removemos userType e toggleUserType do contexto (não usamos mais)
  const { toggleMobileMenu } = useDashboard();

  const pathname = usePathname();
  const router = useRouter();

  // 3. Descobrimos o tipo baseado na URL atual
  const isClient = pathname.includes("/dashboard/cliente");
  const currentType = isClient ? "client" : "professional";

  // 4. Função de navegação ao clicar no switch
  const handleSwitch = (targetType: "client" | "professional") => {
    if (targetType === "client") {
      router.push("/dashboard/cliente");
    } else {
      router.push("/dashboard/profissional");
    }
  };

  return (
    <header className="h-20 bg-slate-900 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      {/* Botão Mobile (Menu Hamburguer) */}
      <div className="flex items-center gap-4 lg:hidden">
        <button onClick={toggleMobileMenu} className="text-white p-2">
          <Menu size={24} />
        </button>
        <span className="font-futura font-bold text-white">MWC</span>
      </div>

      {/* Barra de Busca Central */}
      <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar projetos ou profissionais..."
          className="w-full bg-slate-950 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#d73cbe] transition-all placeholder:text-slate-500"
        />
      </div>

      {/* Área da Direita (Switch + Notificações) */}
      <div className="flex items-center gap-4 lg:gap-6 ml-auto">
        {/* Switch Profissional/Cliente */}
        <div className="hidden sm:flex bg-slate-950 rounded-full border border-white/10 relative overflow-hidden">
          {/* Fundo colorido deslizante */}
          <div
            className={`absolute top-0 bottom-0 w-1/2 bg-[#d73cbe] transition-all duration-300
              ${
                currentType === "client" ? "translate-x-full" : "translate-x-0"
              }`}
          />

          <button
            onClick={() => handleSwitch("professional")}
            className={`relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              currentType === "professional"
                ? "text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sou Profissional
          </button>

          <button
            onClick={() => handleSwitch("client")}
            className={`relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              currentType === "client"
                ? "text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sou Cliente
          </button>
        </div>

        <NotificationDropdown />
      </div>
    </header>
  );
}
