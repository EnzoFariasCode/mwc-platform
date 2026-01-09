"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ExpandableText } from "@/components/ExpandableText";
import { EditProfileModal } from "@/components/dashboard/EditProfileModal";
// Importe a Server Action que criamos
import { updateProfile } from "@/actions/account/update-profile"; 
import {
  MapPin,
  Link as LinkIcon,
  Github,
  Linkedin,
  Edit3,
  Plus,
  ShieldCheck,
  Star,
  Lock,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  X,
  Save,
} from "lucide-react";
import Image from "next/image";

interface UserData {
  name: string | null;
  displayName: string | null;
  email: string | null;
  userType: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  birthDate?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export default function PerfilView({ user }: { user: UserData }) {
  const [currentUser, setCurrentUser] = useState<UserData>(user);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) setCurrentUser(user);
  }, [user]);

  const isPro = currentUser.userType === "PROFESSIONAL";

  const displayName =
    currentUser.displayName && currentUser.displayName.trim() !== ""
      ? currentUser.displayName
      : currentUser.name && currentUser.name.trim() !== ""
      ? currentUser.name
      : "Usuário";

  const initials = displayName.charAt(0).toUpperCase();

  // --- FUNÇÃO DE SALVAR DADOS GERAIS ---
  const handleUpdateProfile = async (newData: {
    name: string;
    displayName: string;
    birthDate: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    setIsLoading(true);
    
    // 1. Atualização Otimista (Visual)
    setCurrentUser((prev) => ({
      ...prev,
      name: newData.name,
      displayName: newData.displayName,
      birthDate: newData.birthDate,
    }));

    try {
      // 2. Chama o Backend
      const response = await updateProfile({
        name: newData.name,
        displayName: newData.displayName,
        birthDate: newData.birthDate,
        bio: currentUser.bio || "", // Mantém a bio que já existe
        currentPassword: newData.currentPassword,
        newPassword: newData.newPassword
      });

      if (!response.success) {
        alert(response.error); // Idealmente use um Toast aqui
      } else {
        // Sucesso
      }
    } catch (error) {
      alert("Erro ao salvar perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNÇÃO DE SALVAR BIO ---
  const handleUpdateBio = async (newBio: string) => {
    setIsLoading(true);

    // 1. Atualização Otimista
    setCurrentUser((prev) => ({
      ...prev,
      bio: newBio,
    }));
    setIsBioModalOpen(false);

    try {
      // 2. Chama o Backend
      // Precisamos passar os outros dados também para não apagá-los
      // ou garantir que a Server Action aceite update parcial.
      // Neste caso, estou enviando tudo o que temos no estado atual.
      const response = await updateProfile({
        name: currentUser.name || "",
        displayName: currentUser.displayName || "",
        birthDate: currentUser.birthDate || "",
        bio: newBio, // O campo novo
      });

      if (!response.success) {
        alert(response.error);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar a bio.");
    } finally {
      setIsLoading(false);
    }
  };

  const bioText = currentUser.bio
    ? currentUser.bio
    : isPro
    ? "Sou um especialista apaixonado por criar soluções tecnológicas..."
    : "Olá! Estou aqui em busca dos melhores profissionais...";

  return (
    <PageContainer>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={currentUser}
        onSave={handleUpdateProfile}
      />

      <EditBioModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        currentBio={currentUser.bio || ""} // Passa vazio se for null
        onSave={handleUpdateBio}
      />

      <div className="space-y-6 animate-fade-in">
        {/* HEADER */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden relative">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-6 right-6 p-2 bg-background border border-border text-foreground rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm z-10 cursor-pointer group"
            title="Editar Dados Pessoais"
          >
            <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-4 border-background shadow-xl flex items-center justify-center text-4xl font-bold text-white select-none overflow-hidden">
                  {currentUser.avatarUrl ? (
                    <Image
                      src={currentUser.avatarUrl}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                {isPro && (
                  <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1.5 rounded-full border-4 border-card">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 w-full pt-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground font-futura">
                      {displayName}
                    </h1>
                    {!isPro && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase rounded-md border border-blue-500/20 tracking-wide">
                        Cliente Ativo
                      </span>
                    )}
                  </div>

                  <p className="text-lg text-primary font-medium">
                    {isPro ? "Desenvolvedor Fullstack" : "Cliente / Contratante"}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> Brasil
                    </span>
                    <span className="flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" /> {currentUser.email}
                    </span>
                    {currentUser.birthDate && (
                      <span className="flex items-center gap-1 text-xs bg-slate-800 px-2 py-0.5 rounded-md">
                        Nasc.: {new Date(currentUser.birthDate).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              {isPro && (
                <div className="bg-background/50 p-4 rounded-xl border border-border flex gap-6 mt-4 md:mt-0">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Valor/Hora</p>
                    <p className="text-xl font-bold text-foreground">R$ 120</p>
                  </div>
                  <div className="w-px bg-border h-10" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Avaliação</p>
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-xl font-bold text-foreground">5.0</span>
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SectionCard title="Sobre" onEdit={() => setIsBioModalOpen(true)}>
              <div className="text-slate-300">
                <ExpandableText
                  content={bioText}
                  lineClamp={3}
                  className="text-slate-300 whitespace-pre-line leading-relaxed"
                />
              </div>
            </SectionCard>

            {/* Resto dos cards (Skills, Portfolio) mantidos iguais... */}
            <div className={`relative ${!isPro ? "min-h-[320px]" : ""}`}>
              {!isPro && <ProFeatureLock title="Habilidades e Tecnologias" />}
              <SectionCard title="Habilidades e Tecnologias">
                 <div className={`flex flex-wrap gap-2 ${!isPro ? "blur-sm opacity-50 min-h-[200px] content-start" : ""}`}>
                  {["React.js", "Next.js", "TypeScript", "Node.js"].map((skill) => (
                    <span key={skill} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-slate-300">
                      {skill}
                    </span>
                  ))}
                  <button className="px-3 py-1.5 border border-dashed border-border text-muted-foreground rounded-lg text-sm flex items-center gap-1 hover:border-primary/50 transition-colors">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
              </SectionCard>
            </div>

            <div className={`relative ${!isPro ? "min-h-[320px]" : ""}`}>
              {!isPro && <ProFeatureLock title="Portfólio Profissional" />}
              <SectionCard title="Portfólio e Anexos">
                {/* Conteúdo do portfólio mantido */}
                <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 ${!isPro ? "blur-sm select-none opacity-50 min-h-[200px]" : ""}`}>
                  <div className="group relative aspect-square bg-slate-800 rounded-xl border border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-all">
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    </div>
                  </div>
                   {/* ... outros itens do portfolio ... */}
                </div>
              </SectionCard>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-foreground mb-4">Redes Sociais</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer text-left group/social">
                  <Github className="w-5 h-5 text-white group-hover/social:text-primary transition-colors" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Github</p>
                    <p className="text-xs text-slate-500">Conectar conta</p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500" />
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer text-left group/social">
                  <Linkedin className="w-5 h-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">LinkedIn</p>
                    <p className="text-xs text-slate-500">Conectar conta</p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// --- Componentes Auxiliares ---

function SectionCard({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void; }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 relative group">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground font-futura">{title}</h2>
        {onEdit && (
          <button onClick={onEdit} className="p-2 hover:bg-background rounded-lg text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ProFeatureLock({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 backdrop-blur-[2px] rounded-2xl border border-white/5">
      <div className="p-3 bg-slate-900 rounded-full border border-white/10 mb-3 shadow-xl">
        <Lock className="w-6 h-6 text-[#d73cbe]" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{title} é para Profissionais</h3>
      <p className="text-sm text-slate-300 max-w-xs mb-4">Ative seu perfil profissional para exibir seu portfólio.</p>
      <button className="px-5 py-2 bg-[#d73cbe] hover:bg-[#b0269a] text-white text-sm font-bold rounded-xl transition-all shadow-lg cursor-pointer">Virar Profissional</button>
    </div>
  );
}

function EditBioModal({ isOpen, onClose, currentBio, onSave }: { isOpen: boolean; onClose: () => void; currentBio: string; onSave: (bio: string) => void; }) {
  const [bio, setBio] = useState(currentBio);

  useEffect(() => {
    if (isOpen) setBio(currentBio);
  }, [isOpen, currentBio]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-4 border-b border-border flex justify-between items-center bg-slate-900/50">
          <h3 className="text-lg font-bold text-foreground">Editar Sobre</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Biografia</label>
            <textarea
              className="w-full min-h-[150px] bg-background border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você..."
            />
          </div>
        </div>
        <div className="p-4 bg-background/50 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-white/5 rounded-lg transition-colors">Cancelar</button>
          <button onClick={() => onSave(bio)} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:brightness-110 transition-all shadow-lg flex items-center gap-2">
            <Save className="w-4 h-4" /> Salvar Bio
          </button>
        </div>
      </div>
    </div>
  );
}