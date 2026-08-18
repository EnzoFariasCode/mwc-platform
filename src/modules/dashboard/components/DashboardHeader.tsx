"use client";

import { Menu, Lock, ShieldCheck } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { NotificationDropdown } from "./NotificationDropdown";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/modules/users/actions/get-user-profile";
import { hasFunctionalConsent } from "@/modules/cookies/cookie-consent";
import { getAccountDashboardPath } from "@/modules/auth/lib/account-access";

export default function DashboardHeader() {
  const { toggleMobileMenu, viewMode, setViewMode } = useDashboard();
  const pathname = usePathname();
  const router = useRouter();

  const [userRole, setUserRole] = useState<
    "CLIENT" | "PROFESSIONAL" | "ADMIN" | null
  >(null);
  const [userIndustry, setUserIndustry] = useState<
    "TECH" | "HEALTH" | null
  >(null);
  // 1. Carrega o Perfil
  useEffect(() => {
    async function checkRole() {
      const result = await getUserProfile();
      if (result.success && result.data) {
        setUserRole(result.data.userType);
        setUserIndustry(result.data.industry);
        if (
          result.data.userType === "CLIENT" ||
          (result.data.userType === "PROFESSIONAL" &&
            result.data.industry === "HEALTH")
        ) {
          setViewMode("CLIENT");
        }
      }
    }
    checkRole();
  }, [setViewMode]);

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

    if (userRole === "ADMIN" || pathname.startsWith("/dashboard/admin")) {
      return;
    }

    if (userRole === "PROFESSIONAL" && userIndustry === "HEALTH") {
      setViewMode("CLIENT");
      return;
    }

    const isExclusivePro = exclusiveProfessionalRoutes.some((r) =>
      pathname.startsWith(r),
    );
    const isExclusiveClient = exclusiveClientRoutes.some((r) =>
      pathname.startsWith(r),
    );

    // Lógica: Só vira PRO se for rota exclusiva E NÃO for visualização de perfil
    if (isExclusivePro && !isProfileView) {
      setViewMode("PROFESSIONAL");
      if (hasFunctionalConsent()) localStorage.setItem("dashboardViewMode", "PROFESSIONAL");
    } else if (isExclusiveClient) {
      setViewMode("CLIENT");
      if (hasFunctionalConsent()) localStorage.setItem("dashboardViewMode", "CLIENT");
    } else {
      // Rotas compartilhadas (Chat, Configurações, Perfil de Outro) -> Mantém o modo atual
      const storedMode = (hasFunctionalConsent() ? localStorage.getItem("dashboardViewMode") : null) as
        | "CLIENT"
        | "PROFESSIONAL";
      if (storedMode) {
        setViewMode(storedMode);
      } else {
        if (userRole === "PROFESSIONAL") setViewMode("PROFESSIONAL");
      }
    }
  }, [pathname, setViewMode, userIndustry, userRole]);

  const handleSwitch = (targetType: "client" | "professional") => {
    if (targetType === "client") {
      if (hasFunctionalConsent()) localStorage.setItem("dashboardViewMode", "CLIENT");
      setViewMode("CLIENT");
      router.push("/dashboard/cliente");
    } else {
      if (userRole === "PROFESSIONAL" || userRole === "ADMIN") {
        const destination = getAccountDashboardPath({
          userType: userRole,
          industry: userIndustry,
        });

        if (userIndustry === "TECH") {
          if (hasFunctionalConsent()) {
            localStorage.setItem("dashboardViewMode", "PROFESSIONAL");
          }
          setViewMode("PROFESSIONAL");
        }
        router.push(destination);
      }
    }
  };

  const isClientArea = viewMode === "CLIENT";
  const isAdmin = userRole === "ADMIN";

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
        {isAdmin ? (
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#d73cbe]/30 bg-[#d73cbe]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
            <ShieldCheck className="h-4 w-4 text-[#d73cbe]" />
            ADMIN
          </div>
        ) : userRole ? (
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
        ) : null}

        <NotificationDropdown />
      </div>
    </header>
  );
}
