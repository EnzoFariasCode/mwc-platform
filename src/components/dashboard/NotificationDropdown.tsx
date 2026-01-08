"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  Clock,
  Info,
  MessageSquare,
  AlertTriangle,
  X,
} from "lucide-react";
import Link from "next/link";

// Mock de dados (Simulando o Banco de Dados)
const NOTIFICATIONS = [
  {
    id: 1,
    type: "success", // success, info, warning, message
    title: "Proposta Aceita!",
    message: "O cliente Dr. Roberto aceitou sua proposta de Landing Page.",
    time: "Há 5 min",
    read: false,
    link: "/dashboard/projetos-ativos",
  },
  {
    id: 2,
    type: "message",
    title: "Nova Mensagem",
    message: "Ana Design: 'Pode me enviar a logo em vetor?'",
    time: "Há 1 hora",
    read: false,
    link: "/dashboard/chat",
  },
  {
    id: 3,
    type: "warning",
    title: "Complete seu Perfil",
    message: "Adicione suas habilidades para aparecer em mais buscas.",
    time: "Há 1 dia",
    read: true,
    link: "/dashboard/perfil",
  },
];

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calcula não lidas para a bolinha vermelha
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Marcar como lida ao clicar
  const handleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setIsOpen(false);
  };

  // Marcar todas como lidas
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão do Sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative text-slate-400 hover:text-white transition-colors cursor-pointer pl-4 border-l border-white/10 ${
          isOpen ? "text-white" : ""
        }`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-slate-900 animate-pulse"></span>
        )}
      </button>

      {/* Dropdown Flutuante */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-4 w-80 md:w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
          {/* Header do Dropdown */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-background">
            <h3 className="font-bold text-foreground text-sm">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-primary hover:underline cursor-pointer font-bold"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhuma notificação nova.
              </div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => handleRead(item.id)}
                >
                  <div
                    className={`p-4 border-b border-border hover:bg-white/5 transition-colors cursor-pointer flex gap-3 ${
                      !item.read ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Ícone Baseado no Tipo */}
                    <div className="mt-1">
                      <NotificationIcon type={item.type} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4
                          className={`text-sm ${
                            !item.read
                              ? "font-bold text-foreground"
                              : "font-medium text-muted-foreground"
                          }`}
                        >
                          {item.title}
                        </h4>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.time}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border bg-background text-center">
            <Link href="/dashboard/configuracoes">
              <button className="text-xs text-muted-foreground hover:text-foreground py-1">
                Configurar notificações
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "success":
      return (
        <div className="p-1.5 bg-green-500/10 rounded-full text-green-400">
          <Check className="w-4 h-4" />
        </div>
      );
    case "message":
      return (
        <div className="p-1.5 bg-blue-500/10 rounded-full text-blue-400">
          <MessageSquare className="w-4 h-4" />
        </div>
      );
    case "warning":
      return (
        <div className="p-1.5 bg-yellow-500/10 rounded-full text-yellow-400">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="p-1.5 bg-slate-500/10 rounded-full text-slate-400">
          <Info className="w-4 h-4" />
        </div>
      );
  }
}
