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
  // Estado para controlar visualmente se estamos no modo Cliente ou Profissional
  const [viewMode, setViewMode] = useState<"CLIENT" | "PROFESSIONAL">("CLIENT");

  // 1. Carrega o Perfil
  useEffect(() => {
    async function checkRole() {
      const user = await getUserProfile();
      if (user) {
        setUserRole(user.userType);
        // Se for 100% cliente, força o viewMode inicial
        if (user.userType === "CLIENT") setViewMode("CLIENT");
      }
    }
    checkRole();
  }, []);

  // 2. Lógica Inteligente de Persistência de Modo (Sticky Mode)
  useEffect(() => {
    // Rotas que SÓ existem para o Profissional
    const exclusiveProfessionalRoutes = [
      "/dashboard/profissional",
      "/dashboard/minhas-propostas",
      "/dashboard/projetos-ativos",
      "/dashboard/financeiro",
      "/dashboard/encontrar-projetos",
    ];

    // Rotas que SÓ existem para o Cliente
    const exclusiveClientRoutes = [
      "/dashboard/cliente",
      "/dashboard/meus-projetos",
      "/dashboard/favoritos",
      "/search",
    ];

    // Verifica onde estamos
    const isExclusivePro = exclusiveProfessionalRoutes.some((r) =>
      pathname.startsWith(r)
    );
    const isExclusiveClient = exclusiveClientRoutes.some((r) =>
      pathname.startsWith(r)
    );

    if (isExclusivePro) {
      // Se entrou em área exclusiva PRO, marca como PRO e salva
      setViewMode("PROFESSIONAL");
      localStorage.setItem("dashboardViewMode", "PROFESSIONAL");
    } else if (isExclusiveClient) {
      // Se entrou em área exclusiva CLIENTE, marca como CLIENTE e salva
      setViewMode("CLIENT");
      localStorage.setItem("dashboardViewMode", "CLIENT");
    } else {
      // Se estamos em rota COMPARTILHADA (Chat, Perfil, Configurações),
      // recuperamos a última memória do usuário.
      const storedMode = localStorage.getItem("dashboardViewMode") as
        | "CLIENT"
        | "PROFESSIONAL";
      if (storedMode) {
        setViewMode(storedMode);
      } else {
        // Fallback: Se não tem memória, usa o papel do usuário
        if (userRole === "PROFESSIONAL") setViewMode("PROFESSIONAL");
      }
    }
  }, [pathname, userRole]);

  const handleSwitch = (targetType: "client" | "professional") => {
    // Salva a intenção do usuário no LocalStorage
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
