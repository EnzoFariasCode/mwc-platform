/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Menu, Lock } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { NotificationDropdown } from "./NotificationDropdown";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/modules/users/actions/get-user-profile";

export default function DashboardHeader() {
  const { toggleMobileMenu, viewMode, setViewMode } = useDashboard();
  const pathname = usePathname();
  const router = useRouter();

  const [userRole, setUserRole] = useState<
    "CLIENT" | "PROFESSIONAL" | "ADMIN" | null
  >(null);
  // 1. Carrega o Perfil
  useEffect(() => {
    async function checkRole() {
      const user = await getUserProfile();
      if (user) {
        setUserRole(user.userType);
        if (user.userType === "CLIENT") setViewMode("CLIENT");
      }
    }
    checkRole();
  }, []);

  // 2. Lógica Inteligente de Persistência (COM CORREÇÃO PARA PERFIL)
  useEffect(() => {
    // Rotas EXCLUSIVAS do painel do profissional
    const exclusiveProfessionalRoutes = [
      "/dashboard/profissional", // Visão geral
      "/dashboard/minhas-propostas",
      "/dashboard/projetos-ativos",
      "/dashboard/financeiro",
      "/dashboard/encontrar-projetos",
    ];

    const exclusiveClientRoutes = [
      "/dashboard/cliente",
      "/dashboard/meus-projetos",
      "/dashboard/favoritos",
      "/search",
      "/dashboard/encontrar-profissionais", // Importante estar aqui
    ];

    const isProfileView = /^\/dashboard\/profissional\/[a-zA-Z0-9-]+$/.test(
      pathname,
    );

    const isExclusivePro = exclusiveProfessionalRoutes.some((r) =>
      pathname.startsWith(r),
    );
    const isExclusiveClient = exclusiveClientRoutes.some((r) =>
      pathname.startsWith(r),
    );

    // Lógica: Só vira PRO se for rota exclusiva E NÃO for visualização de perfil
    if (isExclusivePro && !isProfileView) {
      setViewMode("PROFESSIONAL");
      localStorage.setItem("dashboardViewMode", "PROFESSIONAL");
    } else if (isExclusiveClient) {
      setViewMode("CLIENT");
      localStorage.setItem("dashboardViewMode", "CLIENT");
    } else {
      // Rotas compartilhadas (Chat, Configurações, Perfil de Outro) -> Mantém o modo atual
      const storedMode = localStorage.getItem("dashboardViewMode") as
        | "CLIENT"
        | "PROFESSIONAL";
      if (storedMode) {
        setViewMode(storedMode);
      } else {
        if (userRole === "PROFESSIONAL") setViewMode("PROFESSIONAL");
      }
    }
  }, [pathname, userRole]);

  const handleSwitch = (targetType: "client" | "professional") => {
    if (targetType === "client") {
      localStorage.setItem("dashboardViewMode", "CLIENT");
      setViewMode("CLIENT");
      router.push("/dashboard/cliente");
    } else {
      if (userRole === "PROFESSIONAL" || userRole === "ADMIN") {
        localStorage.setItem("dashboardViewMode", "PROFESSIONAL");
        setViewMode("PROFESSIONAL");
        router.push("/dashboard/profissional");
      }
    }
  };

  const isClientArea = viewMode === "CLIENT";

  return (
    <header className="h-20 bg-slate-900 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 lg:hidden">
        <button
          onClick={toggleMobileMenu}
          className="text-white p-2 cursor-pointer"
        >
          <Menu size={24} />
        </button>
        <span className="font-futura font-bold text-white">MWC</span>
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
