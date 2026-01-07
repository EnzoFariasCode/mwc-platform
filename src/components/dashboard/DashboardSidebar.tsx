"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Settings,
  LogOut,
  Briefcase,
  Search,
  FileText,
  Megaphone,
  MessageSquare,
  X,
} from "lucide-react";
import Logo from "@/assets/images/landingPage/logo.png";
import { useDashboard } from "@/context/DashboardContext";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { userType, isMobileMenuOpen, closeMobileMenu } = useDashboard();

  // --- DEFINIÇÃO DOS LINKS ---

  // Menu do Profissional (Adicionado Chat)
  const professionalLinks = [
    { icon: LayoutDashboard, label: "Visão Geral", href: "/dashboard" },
    {
      icon: Search,
      label: "Encontrar Projetos",
      href: "/dashboard/encontrar-projetos",
    },
    { icon: FileText, label: "Minhas Propostas", href: "/dashboard/propostas" },
    {
      icon: Briefcase,
      label: "Projetos Ativos",
      href: "/dashboard/projetos-ativos",
    },
    { icon: MessageSquare, label: "Chat", href: "/dashboard/chat" }, // <--- NOVO
    { icon: Wallet, label: "Financeiro", href: "/dashboard/financeiro" },
    {
      icon: Settings,
      label: "Configurações",
      href: "/dashboard/configuracoes",
    },
  ];

  // Menu do Cliente (Já tinha Chat)
  const clientLinks = [
    { icon: LayoutDashboard, label: "Visão Geral", href: "/dashboard" },
    {
      icon: Briefcase,
      label: "Meus Projetos",
      href: "/dashboard/meus-projetos",
    },
    { icon: Megaphone, label: "Meus Anúncios", href: "/dashboard/anuncios" },
    { icon: MessageSquare, label: "Chat", href: "/dashboard/chat" },
    {
      icon: Settings,
      label: "Configurações",
      href: "/dashboard/configuracoes",
    },
  ];

  const menuItems =
    userType === "professional" ? professionalLinks : clientLinks;

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        className={`
        // MUDANÇA: Removemos 'fixed' no desktop e usamos sticky para acompanhar o scroll se necessário
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 border-r border-white/5 flex flex-col transition-transform duration-300
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 shrink-0 // shrink-0 impede que a sidebar diminua
      `}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <Link
            href="/dashboard"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src={Logo}
              alt="MWC"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-futura font-bold text-white tracking-wider pt-1">
              MWC
            </span>
          </Link>
          <button
            onClick={closeMobileMenu}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="px-4 mb-4 text-xs font-bold text-slate-500 uppercase tracking-widest opacity-50">
            Menu {userType === "professional" ? "Profissional" : "Cliente"}
          </div>

          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? "bg-[#d73cbe]/10 text-[#d73cbe] font-medium"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon
                  size={20}
                  className={
                    isActive
                      ? "text-[#d73cbe]"
                      : "text-slate-500 group-hover:text-white"
                  }
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-900">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-400/10 transition-all cursor-pointer">
            <LogOut size={20} />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  );
}
