import { PageContainer } from "@/components/dashboard/PageContainer";
import { prisma } from "@/lib/prisma";
import {
  Camera,
  MapPin,
  Link as LinkIcon,
  Edit3,
  Plus,
  CheckCircle2,
  Star,
  ShieldCheck,
  Github,
  Linkedin,
} from "lucide-react";

// OBS: Removemos o "use client" do topo para poder acessar o banco direto!
// Se precisarmos de interatividade (botões), vamos isolar em componentes menores depois.

export default async function PerfilPage() {
  // 1. BUSCAR DADOS DO BANCO (Backend no Frontend)
  // Como ainda não temos login real, vamos pegar o PRIMEIRO usuário que acharmos
  // Em breve, trocaremos isso por: where: { email: session.user.email }
  const user = await prisma.user.findFirst();

  // Se não achar ninguém (banco vazio), mostra um aviso
  if (!user) {
    return (
      <div className="p-8 text-white">
        Usuário não encontrado. Rode o script SQL de teste.
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* --- HEADER DO PERFIL --- */}
        <div className="relative bg-card border border-border rounded-2xl overflow-hidden group">
          <div className="h-48 bg-gradient-to-r from-blue-900 via-primary/40 to-purple-900 relative">
            {/* Botão de Capa (Decorativo) */}
          </div>

          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-4 flex justify-between items-end">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-card bg-slate-800 flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
                  {/* Se tiver avatarUrl no banco mostra imagem, senão mostra iniciais */}
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user.name?.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-card">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="flex gap-3 mb-2">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg">
                  Editar Perfil
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground font-futura flex items-center gap-3">
                  {user.name} {/* DADO REAL DO BANCO */}
                </h1>
                <p className="text-lg text-primary font-medium mt-1">
                  {user.userType === "professional"
                    ? "Profissional"
                    : "Cliente"}{" "}
                  • Plano {user.plan}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />{" "}
                    {user.location || "Sem localização"}
                  </span>
                  <span className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" /> {user.email}
                  </span>
                </div>
              </div>

              <div className="bg-background/50 p-4 rounded-xl border border-border flex gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold">
                    Valor/Hora
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {user.hourlyRate ? `R$ ${user.hourlyRate}` : "-"}
                  </p>
                </div>
                <div className="w-px bg-border h-10" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold">
                    Avaliação
                  </p>
                  <div className="flex items-center gap-1 justify-center">
                    <span className="text-xl font-bold text-foreground">
                      5.0
                    </span>
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- CONTEÚDO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-foreground font-futura mb-4">
                Sobre Mim
              </h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {user.bio || "Este usuário ainda não escreveu uma biografia."}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Lateral mantida estática por enquanto */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-foreground mb-4">Verificações</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Email
                  Verificado
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
