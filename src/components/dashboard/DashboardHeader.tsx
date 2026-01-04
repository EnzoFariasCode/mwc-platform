'use client';

import { useState } from 'react';
import { Bell, Search, Menu, UserCircle } from 'lucide-react';

export default function DashboardHeader() {
  const [userMode, setUserMode] = useState<'client' | 'pro'>('pro'); // Estado temporário para simular a troca

  return (
    <header className="h-20 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      
      {/* Esquerda: Menu Mobile (Só aparece em telas pequenas) */}
      <div className="flex items-center gap-4 lg:hidden">
        <button className="text-white p-2">
          <Menu size={24} />
        </button>
        <span className="font-futura font-bold text-white">MWC</span>
      </div>

      {/* Centro: Barra de Pesquisa (Visível apenas em Desktop por enquanto) */}
      <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
        <input 
          type="text" 
          placeholder="Buscar projetos ou profissionais..."
          className="w-full bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-muted)]"
        />
      </div>

      {/* Direita: Switch de Modo + Ações */}
      <div className="flex items-center gap-4 lg:gap-6 ml-auto">
        
        {/* --- O SWITCH DE MODO (A "Chave" do Sistema) --- */}
        <div className="hidden sm:flex bg-[var(--bg-page)] p-1 rounded-full border border-[var(--border-subtle)]">
            <button 
                onClick={() => setUserMode('pro')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    userMode === 'pro' 
                    ? 'bg-[var(--primary)] text-white shadow-lg' 
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
            >
                Sou Profissional
            </button>
            <button 
                onClick={() => setUserMode('client')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    userMode === 'client' 
                    ? 'bg-[var(--secondary)] text-white shadow-lg' 
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
            >
                Sou Cliente
            </button>
        </div>

        {/* Notificações */}
        <button className="relative text-[var(--text-muted)] hover:text-white transition-colors">
          <Bell size={22} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--primary)] rounded-full border-2 border-[var(--bg-surface)]"></span>
        </button>

        {/* Avatar / Menu Usuário */}
        <div className="flex items-center gap-3 pl-4 border-l border-[var(--border-subtle)]">
            <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white leading-none">João Silva</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Nível Starter</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-violet-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden">
                    {/* Placeholder de avatar se não tiver imagem */}
                    <UserCircle size={28} className="text-[var(--text-muted)]" />
                    {/* <img src="..." /> */}
                </div>
            </div>
        </div>

      </div>
    </header>
  );
}