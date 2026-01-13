"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import { MessageCircle, Star, Trash2, Heart, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Dados Fakes para simular favoritos vindos do banco
const FAVORITOS_INICIAIS = [
  {
    id: 1,
    nome: "Carlos Eletricista",
    profissao: "Eletricista Residencial",
    nota: 4.8,
    avatar: "⚡",
    preco: "R$ 150/h",
  },
  {
    id: 2,
    nome: "Ana Design",
    profissao: "Designer Gráfico",
    nota: 5.0,
    avatar: "🎨",
    preco: "A combinar",
  },
  {
    id: 3,
    nome: "Marcos Fretes",
    profissao: "Transportes e Mudanças",
    nota: 4.5,
    avatar: "🚚",
    preco: "R$ 200/h",
  },
];

export default function FavoritosPage() {
  const [favoritos, setFavoritos] = useState(FAVORITOS_INICIAIS);
  const [searchTerm, setSearchTerm] = useState("");

  const handleRemove = (id: number) => {
    // Aqui futuramente chamaria uma Server Action para remover do banco
    setFavoritos((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredFavoritos = favoritos.filter((fav) =>
    fav.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer>
      <div className="space-y-8 animate-fade-in">
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

        {/* GRID DE FAVORITOS */}
        {filteredFavoritos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavoritos.map((fav) => (
              <div
                key={fav.id}
                className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 hover:border-white/10 transition-all group"
              >
                {/* TOPO DO CARD */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl border border-white/10">
                      {fav.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg font-futura">
                        {fav.nome}
                      </h3>
                      <p className="text-sm text-slate-400">{fav.profissao}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                    <span className="text-yellow-500 font-bold text-sm">
                      {fav.nota}
                    </span>
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full" />

                {/* INFO EXTRA */}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Média de preço:</span>
                  <span className="text-slate-200 font-medium">
                    {fav.preco}
                  </span>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="flex gap-3 mt-auto pt-2">
                  <button
                    onClick={() => handleRemove(fav.id)}
                    className="p-3 rounded-xl border border-white/10 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
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
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <Heart className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-300">
              Nenhum favorito encontrado
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
              Você pode favoritar profissionais diretamente pela tela de chat
              clicando no ícone de coração.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
