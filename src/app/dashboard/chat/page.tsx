"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Send,
  Search,
  CheckCheck,
  Heart,
  ArrowLeft,
  Loader2,
  Trash2,
  X,
  Briefcase, // Icone para o projeto
} from "lucide-react";

import { getMyConversations } from "@/actions/chat/get-my-conversations";
import { getConversationMessages } from "@/actions/chat/get-conversation-messages";
import { sendMessage } from "@/actions/chat/send-message";
import { toggleFavorite } from "@/actions/favorites/toggle-favorite";
import { markMessagesAsRead } from "@/actions/chat/mark-messages-read";
import { deleteConversation } from "@/actions/chat/delete-conversation";
// NOVAS ACTIONS:
import {
  getProjectContext,
  getBasicUserInfo,
} from "@/actions/chat/get-chat-context";

// Tipos
type ConversationSummary = {
  id: string;
  otherUserId: string;
  name: string;
  jobTitle?: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  avatar: string | null;
  unreadCount: number;
};

type Message = {
  id: string;
  text: string;
  sender: "me" | "other";
  time: Date;
};

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- Estados ---
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatData, setActiveChatData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // NOVO: Estado para o contexto do projeto
  const [projectContext, setProjectContext] = useState<any>(null);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Estados de Busca Local
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // 1. Polling da Sidebar
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Polling das Mensagens
  useEffect(() => {
    if (!activeChatId) return;

    const silentReload = async () => {
      try {
        const data = await getConversationMessages(activeChatId);
        if (data) {
          const formattedMessages: Message[] = data.messages.map((m: any) => ({
            id: m.id,
            text: m.text,
            time: new Date(m.time),
            sender: m.sender as "me" | "other",
          }));

          setMessages((prev) => {
            if (prev.length !== formattedMessages.length) {
              markMessagesAsRead(activeChatId);
              return formattedMessages;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Silent reload error:", error);
      }
    };

    const interval = setInterval(silentReload, 3000);
    return () => clearInterval(interval);
  }, [activeChatId]);

  // 3. Redirecionamento via URL (?newChat=ID&projectId=ID)
  useEffect(() => {
    const newChatTarget = searchParams.get("newChat");
    const projectIdTarget = searchParams.get("projectId");

    if (newChatTarget) {
      setActiveChatId(newChatTarget);

      // Se tiver projeto na URL, busca o contexto
      if (projectIdTarget) {
        getProjectContext(projectIdTarget).then((data) => {
          setProjectContext(data);
        });
      } else {
        setProjectContext(null);
      }

      // Limpa a URL para ficar bonita, mas mantém o estado
      // router.replace("/dashboard/chat");
      // DICA: Comentei o replace para você poder testar o F5 se quiser,
      // mas idealmente você limpa a URL depois de pegar os dados.
    }
  }, [searchParams, router]);

  // 4. Carregamento Inicial ao abrir um chat (CORREÇÃO DO BUG CARREGANDO)
  useEffect(() => {
    if (!activeChatId) return;

    async function initialLoad() {
      setIsLoading(true);
      setIsSearchOpen(false);
      setSearchTerm("");

      try {
        // Tenta buscar mensagens
        const data = await getConversationMessages(activeChatId!);

        if (data && data.otherUser) {
          // CENÁRIO 1: Já existe conversa
          const formattedMessages: Message[] = data.messages.map((m: any) => ({
            id: m.id,
            text: m.text,
            time: new Date(m.time),
            sender: m.sender as "me" | "other",
          }));

          setMessages(formattedMessages);
          setActiveChatData(data.otherUser); // Define os dados do usuário
          await markMessagesAsRead(activeChatId!);
        } else {
          // CENÁRIO 2: Chat Novo ou Retorno Nulo (Bug do Spinner)
          setMessages([]);

          // AQUI ESTÁ A CORREÇÃO:
          // Se não veio user data do getConversationMessages, buscamos manual
          const basicUser = await getBasicUserInfo(activeChatId!);
          if (basicUser) {
            setActiveChatData({
              name: basicUser.name,
              jobTitle: basicUser.jobTitle,
              isFavorite: false, // Default
            });
          } else {
            setActiveChatData({ name: "Usuário", isFavorite: false });
          }
        }

        loadConversations();
      } catch (error) {
        console.error("Erro ao carregar chat:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initialLoad();
  }, [activeChatId]);

  // 5. Auto-scroll
  useEffect(() => {
    if (!isSearchOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSearchOpen]);

  // --- Funções ---

  async function loadConversations() {
    try {
      const data = await getMyConversations();
      const formatted: ConversationSummary[] = data.map((c: any) => ({
        id: c.id || "",
        otherUserId: c.otherUserId || "",
        name: c.name || "Usuário",
        jobTitle: c.jobTitle || null,
        lastMessage: c.lastMessage || "",
        lastMessageTime: new Date(c.lastMessageTime),
        avatar: c.avatar || null,
        unreadCount: c.unreadCount || 0,
      }));
      setConversations(formatted);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const text = inputText;
    const tempId = Date.now().toString();

    // 1. Otimista
    const optimisticMsg: Message = {
      id: tempId,
      text: text,
      sender: "me",
      time: new Date(),
    };

    setInputText("");
    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);

    try {
      // 2. Envia
      const result = await sendMessage(activeChatId, text);

      if (result.success && result.message) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: result.message!.id,
                  // @ts-ignore
                  time: new Date(result.message!.createdAt),
                }
              : msg
          )
        );
        loadConversations();
      } else {
        throw new Error(result.error || "Erro desconhecido");
      }
    } catch (error) {
      console.error("Falha no envio:", error);
      alert("Não foi possível enviar a mensagem.");
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!activeChatId) return;
    setActiveChatData((prev: any) => ({
      ...prev,
      isFavorite: !prev.isFavorite,
    }));
    await toggleFavorite(activeChatId);
  };

  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja apagar esta conversa?")) return;

    const result = await deleteConversation(conversationId);
    if (result.success) {
      if (
        conversations.find((c) => c.id === conversationId)?.otherUserId ===
        activeChatId
      ) {
        setActiveChatId(null);
        setActiveChatData(null);
        setProjectContext(null); // Limpa contexto ao apagar
      }
      loadConversations();
    } else {
      alert("Erro ao apagar conversa.");
    }
  };

  // Filtro de Busca
  const displayedMessages = searchTerm
    ? messages.filter((m) =>
        m.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : messages;

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* SIDEBAR DO CHAT (Mantive igual, só ocultei para brevidade se não houve mudança) */}
      <aside
        className={`flex flex-col border-r border-border bg-card/20 shrink-0 h-full
        ${activeChatId ? "hidden md:flex w-80" : "w-full md:w-80"} 
      `}
      >
        <div className="h-16 px-4 border-b border-border flex justify-between items-center shrink-0">
          <h2 className="font-futura font-bold text-lg text-foreground">
            Mensagens
          </h2>
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
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm mt-10">
              Nenhuma conversa recente.
            </div>
          ) : (
            conversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.otherUserId);
                  // Quando clica na sidebar, limpamos o contexto de projeto específico
                  // pois é uma navegação geral
                  setProjectContext(null);
                }}
                className={`group relative p-3 flex gap-3 cursor-pointer hover:bg-white/5 border-b border-white/5 transition-colors ${
                  activeChatId === chat.otherUserId
                    ? "bg-white/5 border-l-2 border-primary"
                    : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-white font-bold relative">
                  {chat.name.charAt(0).toUpperCase()}
                  {chat.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">
                        {chat.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm truncate text-slate-200">
                      {chat.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {chat.lastMessageTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p
                      className={`text-xs truncate max-w-[80%] ${
                        chat.unreadCount > 0
                          ? "text-white font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteConversation(chat.id, e)}
                  className="absolute right-2 bottom-3 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                  title="Apagar conversa"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DA CONVERSA */}
      <section
        className={`flex flex-col flex-1 min-w-0 bg-background relative h-full
         ${!activeChatId ? "hidden md:flex" : "flex"}
      `}
      >
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50">
            <Search className="w-16 h-16 mb-4" />
            <p>Selecione uma conversa para começar</p>
          </div>
        ) : (
          <>
            <header className="flex flex-col border-b border-border bg-card/10 backdrop-blur-sm z-10">
              {/* Linha Principal do Header */}
              <div className="h-16 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveChatId(null)}
                    className="md:hidden text-gray-400"
                  >
                    <ArrowLeft />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-white font-bold">
                    {activeChatData?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-white">
                      {/* Correção do BUG CARREGANDO: Se for null, mostra "Usuário" ou um skeleton, mas o useEffect já deve ter corrigido */}
                      {activeChatData?.name || "Carregando..."}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] text-gray-400">Online</span>
                      {activeChatData?.jobTitle && (
                        <span className="text-[10px] text-slate-500 ml-1 border-l border-slate-700 pl-2">
                          {activeChatData.jobTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 text-gray-400 items-center">
                  <button
                    onClick={handleToggleFavorite}
                    disabled={!activeChatData}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold cursor-pointer ${
                      activeChatData?.isFavorite
                        ? "bg-[#d73cbe]/10 border-[#d73cbe] text-[#d73cbe]"
                        : "bg-transparent border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Heart
                      size={16}
                      className={`transition-colors ${
                        activeChatData?.isFavorite ? "fill-[#d73cbe]" : ""
                      }`}
                    />
                    <span className="hidden sm:inline">
                      {activeChatData?.isFavorite ? "Favoritado" : "Favoritar"}
                    </span>
                  </button>
                </div>
              </div>

              {/* --- CONTEXTO DO PROJETO (BANNER) --- */}
              {/* Só aparece se projectContext existir */}
              {projectContext && (
                <div className="px-4 py-2 bg-slate-800/50 border-t border-white/5 flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-1.5 bg-[#d73cbe]/20 rounded-lg text-[#d73cbe]">
                      <Briefcase size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">
                        Referente ao projeto:
                      </p>
                      <p className="text-sm font-bold text-white truncate">
                        {projectContext.title}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                      {projectContext.budgetLabel}
                    </span>
                    <button
                      onClick={() => setProjectContext(null)} // Fecha o banner
                      className="text-slate-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-primary/20">
              {isLoading ? (
                <div className="flex justify-center mt-10">
                  <Loader2 className="animate-spin text-slate-500" />
                </div>
              ) : displayedMessages.length === 0 ? (
                <div className="text-center text-slate-500 text-sm mt-10 space-y-2">
                  {projectContext ? (
                    <>
                      <p>
                        Inicie a conversa sobre{" "}
                        <strong>"{projectContext.title}"</strong>.
                      </p>
                      <p className="text-xs">
                        Seja profissional e tire suas dúvidas!
                      </p>
                    </>
                  ) : (
                    <p>Nenhuma mensagem ainda. Diga olá! 👋</p>
                  )}
                </div>
              ) : (
                displayedMessages.map((msg, index) => {
                  const isMe = msg.sender === "me";
                  const showName =
                    index === 0 ||
                    displayedMessages[index - 1].sender !== msg.sender;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMe ? "items-end" : "items-start"
                      }`}
                    >
                      {showName && (
                        <span
                          className={`text-[10px] text-slate-500 mb-1 px-1 ${
                            isMe ? "text-right" : "text-left"
                          }`}
                        >
                          {isMe ? "Você" : activeChatData?.name}
                        </span>
                      )}

                      <div
                        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 text-sm relative ${
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
                          {msg.time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isMe && <CheckCheck size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

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
                  className="flex-1 bg-background border border-white/10 rounded-xl px-4 py-2.5 focus:border-primary focus:outline-none text-sm text-white"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="p-2.5 bg-primary rounded-xl text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center"
                >
                  {isSending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
