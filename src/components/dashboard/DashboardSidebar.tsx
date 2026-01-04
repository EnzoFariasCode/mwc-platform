'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Wallet, Settings, LogOut, Briefcase } from 'lucide-react';
import Logo from '@/assets/images/landingPage/logo.png'; // Ajuste se necessário

const menuItems = [
  { icon: LayoutDashboard, label: 'Visão Geral', href: '/dashboard' },
  { icon: Briefcase, label: 'Projetos', href: '/dashboard/projetos' },
  { icon: FolderKanban, label: 'Minhas Propostas', href: '/dashboard/propostas' },
  { icon: Wallet, label: 'Financeiro', href: '/dashboard/financeiro' },
  { icon: Settings, label: 'Configurações', href: '/dashboard/configuracoes' },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] fixed left-0 top-0 z-40">
      
      {/* 1. Logo Area */}
      <div className="h-20 flex items-center px-8 border-b border-[var(--border-subtle)]">
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image src={Logo} alt="MWC" width={32} height={32} className="object-contain" />
          <span className="font-futura font-bold text-white tracking-wider pt-1">MWC</span>
        </Link>
      </div>

      {/* 2. Navigation */}
      <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium' 
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] group-hover:text-white'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. Footer Actions */}
      <div className="p-4 border-t border-[var(--border-subtle)]">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[var(--status-error)] hover:bg-[var(--status-error)]/10 transition-all">
          <LogOut size={20} />
          <span>Sair da Conta</span>
        </button>
      </div>
    </aside>
  );
}