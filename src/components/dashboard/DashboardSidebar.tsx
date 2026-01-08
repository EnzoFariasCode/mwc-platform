"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
  User,
  ChevronUp,
  Heart, // Novo import
  Store, // Novo import para Vitrine
} from "lucide-react";
import Logo from "@/assets/images/landingPage/logo.png";
import { useDashboard } from "@/context/DashboardContext";

// --- SUB-COMPONENTE: Menu de Usuário (Dropdown) ---
function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
          <div className="p-2 space-y-1">
            <Link href="/dashboard/perfil">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm text-slate-200 transition-colors text-left group cursor-pointer">
                <User className="w-4 h-4 text-slate-400 group-hover:text-[#d73cbe]" />
                Meu Perfil
              </button>
            </Link>
            <Link href="/dashboard/configuracoes">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm text-slate-200 transition-colors text-left group cursor-pointer">
                <Settings className="w-4 h-4 text-slate-400 group-hover:text-[#d73cbe]" />
                Configurações
              </button>
            </Link>
            <div className="h-px bg-white/5 my-1" />
            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 rounded-lg text-sm text-red-400 hover:text-red-300 transition-colors text-left cursor-pointer">
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
          isOpen
            ? "bg-white/5 border-[#d73cbe]/30"
            : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-[#d73cbe] flex items-center justify-center text-white font-bold shrink-0">
          JS
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-bold text-sm text-white truncate">João Silva</p>
          <p className="text-xs text-slate-400 truncate">Nível Starter</p>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function DashboardSidebar() {
  const pathname = usePathname();
  const { userType, isMobileMenuOpen, closeMobileMenu } = useDashboard();

  // --- MENU DO PROFISSIONAL (VITRINE + ATIVO) ---
  const professionalLinks = [
    { icon: LayoutDashboard, label: "Visão Geral", href: "/dashboard" },
    // A Vitrine é o mais importante agora
    {
      icon: Store,
      label: "Meu Perfil (Vitrine)",
      href: "/dashboard/perfil",
    },
    {
      icon: MessageSquare,
      label: "Leads / Mensagens",
      href: "/dashboard/chat",
    },
    {
      icon: Search,
      label: "Buscar Oportunidades", // Mudou de "Encontrar Projetos"
      href: "/dashboard/encontrar-projetos",
    },
    {
      icon: FileText,
      label: "Propostas Enviadas",
      href: "/dashboard/minhas-propostas",
    },
    {
      icon: Briefcase,
      label: "Projetos em Andamento",
      href: "/dashboard/projetos-ativos",
    },
    { icon: Wallet, label: "Financeiro", href: "/dashboard/financeiro" },
  ];

  // --- MENU DO CLIENTE (HÍBRIDO) ---
  const clientLinks = [
    { icon: LayoutDashboard, label: "Visão Geral", href: "/dashboard" },
    { icon: MessageSquare, label: "Mensagens", href: "/dashboard/chat" },
    {
      icon: Briefcase,
      label: "Meus Pedidos", // Mudou de "Meus Projetos"
      href: "/dashboard/meus-projetos",
    },
    { icon: Heart, label: "Favoritos", href: "/dashboard/favoritos" }, // Novo
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
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/5 flex flex-col transition-transform duration-300
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:static lg:translate-x-0 shrink-0
        `}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
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

        <div className="p-4 border-t border-white/5 bg-slate-900 shrink-0">
          <UserMenu />
        </div>
      </aside>
    </>
  );
}
