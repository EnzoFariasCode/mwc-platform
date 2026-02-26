"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  Clock,
  Info,
  MessageSquare,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

import { getNotifications } from "@/actions/notifications/get-notifications";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 2. BUSCA OS DADOS REAIS AO CARREGAR O COMPONENTE
  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error("Erro ao carregar notificações", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotifications();

    // Opcional: Você pode colocar um setInterval aqui para buscar a cada X minutos
    // const interval = setInterval(fetchNotifications, 60000); // 1 minuto
    // return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setIsOpen(false);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative text-slate-400 hover:text-white transition-colors cursor-pointer pl-4 border-l border-white/10 ${
          isOpen ? "text-white" : ""
        }`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#d73cbe] rounded-full border-2 border-slate-900 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-4 w-80 md:w-96 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950">
            <h3 className="font-bold text-white text-sm">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-[#d73cbe] hover:underline cursor-pointer font-bold"
              >
                Marcar como lidas
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 flex justify-center items-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Nenhuma novidade por enquanto.
              </div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => handleRead(item.id)}
                >
                  <div
                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 ${
                      !item.read ? "bg-[#d73cbe]/5" : ""
                    }`}
                  >
                    <div className="mt-1">
                      <NotificationIcon type={item.type} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4
                          className={`text-sm ${
                            !item.read
                              ? "font-bold text-white"
                              : "font-medium text-slate-400"
                          }`}
                        >
                          {item.title}
                        </h4>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-[#d73cbe] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">
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
        </div>
      )}
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "success":
      return (
        <div className="p-1.5 bg-emerald-500/10 rounded-full text-emerald-400">
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
