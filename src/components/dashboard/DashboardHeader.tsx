"use client";

import { Bell, Search, Menu, Lock } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { NotificationDropdown } from "./NotificationDropdown";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/actions/account/get-user-profile";

export default function DashboardHeader() {
  const { toggleMobileMenu } = useDashboard();
  const pathname = usePathname();
  const router = useRouter();

  const [userRole, setUserRole] = useState<
    "CLIENT" | "PROFESSIONAL" | "ADMIN" | null
  >(null);

  useEffect(() => {
    async function checkRole() {
      const user = await getUserProfile();
      if (user) {
        setUserRole(user.userType);
      }
    }
    checkRole();
  }, []);

  // --- LÓGICA DEFINITIVA (CORRIGIDA) ---
  // Adicionamos Chat, Perfil e Configurações aqui.
  // Como temos a trava (userRole === "CLIENT") abaixo, isso não quebra para o cliente.
  const professionalRoutes = [
    "/dashboard/profissional",
    "/dashboard/minhas-propostas",
    "/dashboard/projetos-ativos",
    "/dashboard/financeiro",
    "/dashboard/encontrar-projetos",
    "/dashboard/chat", // <--- ADICIONADO
    "/dashboard/perfil", // <--- ADICIONADO (Minha Vitrine)
    "/dashboard/configuracoes", // <--- ADICIONADO
  ];

  const isProfessionalPath = professionalRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Se for rota de PRO, mas o usuário for CLIENTE, forçamos o modo Cliente.
  // Se for rota de PRO e usuário PRO, o modo Cliente fica FALSO (ou seja, modo Pro).
  const isClientArea = !isProfessionalPath || userRole === "CLIENT";

  const handleSwitch = (targetType: "client" | "professional") => {
    if (targetType === "client") {
      router.push("/dashboard/cliente");
    } else {
      if (userRole === "PROFESSIONAL" || userRole === "ADMIN") {
        router.push("/dashboard/profissional");
      }
    }
  };

  return (
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
          className="w-full bg-slate-900 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#d73cbe] transition-all placeholder:text-slate-500"
        />
      </div>

      <div className="flex items-center gap-4 lg:gap-6 ml-auto">
        <div className="hidden sm:flex bg-slate-950 rounded-full border border-white/10 relative overflow-hidden">
          <div
            className={`absolute top-0 bottom-0 w-1/2 bg-[#d73cbe] transition-transform duration-300
              ${isClientArea ? "translate-x-full" : "translate-x-0"}`}
          />

          <button
            onClick={() => handleSwitch("professional")}
            disabled={userRole === "CLIENT" || userRole === null}
            className={`relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer
              ${
                !isClientArea ? "text-white" : "text-slate-400 hover:text-white"
              }
              ${
                userRole === "CLIENT"
                  ? "opacity-50 cursor-not-allowed hover:text-slate-400"
                  : ""
              }
            `}
          >
            Sou Profissional
            {userRole === "CLIENT" && <Lock className="w-3 h-3 mb-0.5" />}
          </button>

          <button
            onClick={() => handleSwitch("client")}
            className={`relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer
              ${
                isClientArea ? "text-white" : "text-slate-400 hover:text-white"
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
