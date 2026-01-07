"use client";

import { useState } from "react";
import { Send, Search, MoreVertical, Check, CheckCheck } from "lucide-react";

// Dados Fakes
const CONVERSAS = [
  {
    id: 1,
    nome: "Carlos Eletricista",
    servico: "Instalação 220v",
    avatar: "⚡",
    lastMsg: "Chego em 10 min",
    time: "10:30",
    unread: 2,
  },
  {
    id: 2,
    nome: "Ana Design",
    servico: "Logo Marca",
    avatar: "🎨",
    lastMsg: "Me manda o arquivo?",
    time: "Ontem",
    unread: 0,
  },
  {
    id: 3,
    nome: "Marcos Fretes",
    servico: "Mudança SP",
    avatar: "🚚",
    lastMsg: "Fechado então.",
    time: "Seg",
    unread: 0,
  },
];

const MENSAGENS_INICIAIS = [
  { id: 1, text: "Olá, vi seu anúncio.", sender: "me", time: "10:00" },
  { id: 2, text: "Oi! Tudo bem? Faço sim.", sender: "other", time: "10:05" },
  { id: 3, text: "Qual o valor?", sender: "me", time: "10:06" },
  { id: 4, text: "Fica R$ 150,00.", sender: "other", time: "10:10" },
  { id: 5, text: "Perfeito, pode vir hoje?", sender: "me", time: "10:12" },
  { id: 6, text: "Chego em 10 min", sender: "other", time: "10:30" },
  { id: 7, text: "Combinado.", sender: "me", time: "10:31" },
  { id: 8, text: "Estou na portaria.", sender: "other", time: "10:45" },
  { id: 9, text: "Descendo.", sender: "me", time: "10:46" },
  { id: 10, text: "Ok.", sender: "other", time: "10:46" },
  { id: 11, text: "Teste de scroll longo 1.", sender: "me", time: "11:00" },
  { id: 12, text: "Teste de scroll longo 2.", sender: "other", time: "11:01" },
  { id: 13, text: "Teste de scroll longo 3.", sender: "me", time: "11:02" },
];

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(CONVERSAS[0]);
  const [messages, setMessages] = useState(MENSAGENS_INICIAIS);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const novaMensagem = {
      id: Date.now(),
      text: inputText,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, novaMensagem]);
    setInputText("");
  };

  return (
    // ESTRUTURA RAIZ: h-full ocupa todo o espaço do <main> do layout
    // Sem margens negativas, sem calc().
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* SIDEBAR DO CHAT */}
      <aside className="hidden md:flex w-80 flex-col border-r border-border bg-card/20 shrink-0">
        <div className="h-16 px-4 border-b border-border flex justify-between items-center shrink-0">
          <h2 className="font-futura font-bold text-lg text-foreground">
            Mensagens
          </h2>
          <MoreVertical size={18} className="text-gray-400 cursor-pointer" />
        </div>
        <div className="p-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-background border border-border rounded-lg py-2 pl-9 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {CONVERSAS.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`p-3 flex gap-3 cursor-pointer hover:bg-white/5 border-b border-white/5 ${
                activeChat.id === chat.id
                  ? "bg-white/5 border-l-2 border-primary"
                  : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                {chat.avatar}
              </div>
              <div className="min-w-0">
                <div className="flex justify-between">
                  <span className="font-bold text-sm truncate">
                    {chat.nome}
                  </span>
                  {/* Removido horário da sidebar como pedido anteriormente */}
                </div>
                <p className="text-xs text-gray-400 truncate">{chat.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DA CONVERSA */}
      <section className="flex flex-1 flex-col min-w-0 bg-background relative">
        {/* Header da Conversa (Fixo) */}
        <header className="h-16 border-b border-border bg-card/10 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="md:hidden text-gray-400">
              <ArrowBackIcon />
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              {activeChat.avatar}
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base">
                {activeChat.nome}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-gray-400">Online</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 text-gray-400">
            <Search size={18} className="hover:text-primary cursor-pointer" />
            <MoreVertical
              size={18}
              className="hover:text-primary cursor-pointer"
            />
          </div>
        </header>

        {/* Lista de Mensagens (Scrollável) */}
        {/* flex-1 min-h-0 é o segredo para o scroll funcionar dentro do flexbox */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-primary/20">
          {messages.map((msg) => {
            const isMe = msg.sender === "me";
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                    isMe
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-card border border-white/10 text-slate-200 rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>
                  <div
                    className={`text-[10px] mt-1 flex justify-end gap-1 ${
                      isMe ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    {msg.time} {isMe && <CheckCheck size={12} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input (Fixo no rodapé) */}
        <footer className="p-3 bg-card/10 border-t border-white/5 shrink-0">
          <form
            onSubmit={handleSendMessage}
            className="flex gap-2 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-background border border-white/10 rounded-xl px-4 py-2.5 focus:border-primary focus:outline-none text-sm"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-primary rounded-xl text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20 cursor-pointer"
            >
              <Send size={18} />
            </button>
          </form>
        </footer>
      </section>
    </div>
  );
}

function ArrowBackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
