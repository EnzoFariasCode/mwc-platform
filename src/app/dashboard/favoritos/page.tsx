"use client";

import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import {
  MessageCircle,
  Star,
  Trash2,
  Heart,
  Search,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

// Importando as Actions Reais
import { getMyFavorites } from "@/modules/favorites/actions/get-my-favorites";
import { toggleFavorite } from "@/modules/favorites/actions/toggle-favorite";

// Definição do Tipo baseado no retorno do banco
type FavoritePro = {
  id: string;
  name: string;
  jobTitle: string | null;
  rating: number; // Agora vem do banco (padrão 5.0 ou calculado)
  ratingCount?: number;
  hourlyRate: number | null;
  avatarUrl: string | null;
};

export default function FavoritosPage() {
  const [favoritos, setFavoritos] = useState<FavoritePro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Busca os dados reais ao carregar a página
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getMyFavorites();
        setFavoritos(data);
      } catch (error) {
        console.error("Erro ao carregar favoritos", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Função para remover (Toggle) com atualização otimista
  const handleRemove = async (id: string) => {
    // Remove visualmente na hora
    setFavoritos((prev) => prev.filter((item) => item.id !== id));

    // Chama o servidor para remover do banco
    const result = await toggleFavorite(id);
    if (!result.success) {
      alert("Erro ao remover favorito. Tente novamente.");
      // Se der erro, idealmente recarregaríamos a lista, mas para UX simples está ok.
    }
  };

  // 3. Filtro de busca local
  const filteredFavoritos = favoritos.filter((fav) =>
    fav.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper para iniciais
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <PageContainer>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-futura flex items-center gap-3">
              <Heart className="w-6 h-6 text-[#d73cbe] fill-[#d73cbe]" />
              Meus Favoritos
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Profissionais que você marcou como preferidos.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar nos favoritos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#d73cbe] transition-all placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-[#d73cbe] animate-spin" />
          </div>
        ) : filteredFavoritos.length > 0 ? (
          /* GRID DE FAVORITOS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavoritos.map((fav) => (
              <div
                key={fav.id}
                className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 hover:border-white/10 transition-all group relative overflow-hidden"
              >
                {/* Efeito Hover Sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#d73cbe]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* TOPO DO CARD */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    {/* Avatar Lógica: Imagem ou Iniciais */}
                    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-white border border-white/10 overflow-hidden shrink-0">
                      {fav.avatarUrl ? (
                        <Image
                          src={fav.avatarUrl}
                          alt={fav.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(fav.name)
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg font-futura line-clamp-1">
                        {fav.name}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-1">
                        {fav.jobTitle || "Profissional"}
                      </p>
                    </div>
                  </div>

                  {/* Nota */}
                  <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 shrink-0">
                    <span className="text-yellow-500 font-bold text-sm">
                      {fav.ratingCount && fav.rating
                        ? fav.rating.toFixed(1)
                        : "Novo"}
                    </span>
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {fav.ratingCount ? (
                      <span className="text-xs text-slate-500">
                        ({fav.ratingCount} avaliaÃ§Ãµes)
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full relative z-10" />

                {/* INFO EXTRA */}
                <div className="flex justify-between text-sm relative z-10">
                  <span className="text-slate-500">Média de preço:</span>
                  <span className="text-slate-200 font-medium">
                    {fav.hourlyRate
                      ? `R$ ${fav.hourlyRate.toFixed(2)}/h`
                      : "A combinar"}
                  </span>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="flex gap-3 mt-auto pt-2 relative z-10">
                  <button
                    onClick={() => handleRemove(fav.id)}
                    className="p-3 rounded-xl border border-white/10 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors cursor-pointer"
                    title="Remover dos favoritos"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <Link
                    href={`/dashboard/chat?newChat=${fav.id}`}
                    className="flex-1"
                  >
                    <button className="w-full cursor-pointer py-3 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Chamar no Chat
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Estado Vazio */
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50 border border-dashed border-white/5 rounded-3xl bg-slate-900/30">
            <Heart className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-300">
              {searchTerm
                ? "Nenhum profissional encontrado na busca"
                : "Sua lista está vazia"}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
              Você pode favoritar profissionais diretamente na tela de chat
              clicando no ícone de coração.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
