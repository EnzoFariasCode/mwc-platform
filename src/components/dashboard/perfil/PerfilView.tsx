"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ExpandableText } from "@/components/ExpandableText";
import { EditProfileModal } from "@/components/dashboard/EditProfileModal";
import { updateProfile } from "@/actions/account/update-profile";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Edit3,
  Plus,
  ShieldCheck,
  Star,
  FileText,
  CalendarDays,
  Github,
  Linkedin,
  Briefcase,
  ExternalLink,
  Save,
  X,
  Zap, // Ícone para o Advanced
  Rocket, // Ícone para o Starter
  User, // Ícone para o Free
  Lock, // Ícone para o bloqueio
} from "lucide-react";
import Image from "next/image";

//CONFIGURAÇÃO DOS IDs DOS PLANOS

const PLAN_IDS = {
  STARTER: "price_1Sz07x2LcuSkaNju6xEbd2cQ",
  ADVANCED: "rice_1Sz08J2LcuSkaNjuvz3VIcUz",
};

// Tipagem dos itens de array
interface PortfolioItem {
  title: string;
  url: string;
}

// Interface robusta
interface UserData {
  id?: string;
  name: string | null;
  displayName: string | null;
  email: string | null;
  userType: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  birthDate?: string | Date | null;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: Date | string;
  city?: string | null;
  state?: string | null;
  hourlyRate?: number | null;
  rating?: number | null;
  ratingCount?: number | null;
  jobTitle?: string | null;
  yearsOfExperience?: number | null;
  skills?: string[];
  socialGithub?: string | null;
  socialLinkedin?: string | null;
  portfolio?: PortfolioItem[];
  certificates?: PortfolioItem[];

  // Campos do Stripe
  stripeSubscriptionStatus?: string | null;
  stripePriceId?: string | null; // Necessário para saber qual badge mostrar
}

function getMemberSince(dateInput: Date | string | undefined) {
  if (!dateInput) return "Membro recente";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Membro recente";
  const now = new Date();
  const diffMonths =
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth());
  if (isNaN(diffMonths)) return "Membro recente";
  if (diffMonths < 1) {
    return `Membro desde ${date.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    })}`;
  }
  if (diffMonths === 1) return "Membro há 1 mês";
  if (diffMonths < 12) return `Membro há ${diffMonths} meses`;
  const years = Math.floor(diffMonths / 12);
  return years === 1 ? "Membro há 1 ano" : `Membro há ${years} anos`;
}

// --- COMPONENTE DE BADGE DO PLANO ---
function PlanBadge({
  priceId,
  isActive,
}: {
  priceId?: string | null;
  isActive: boolean;
}) {
  // 1. Se não estiver ativo (pagamento falhou ou cancelado) ou sem plano -> FREE
  if (!isActive) {
    return (
      <span className="px-2 py-0.5 bg-slate-500/10 text-slate-400 text-xs font-bold uppercase rounded-md border border-slate-500/20 tracking-wide mb-1.5 flex items-center gap-1">
        Free <User className="w-3 h-3" />
      </span>
    );
  }

  // 2. Se for o Plano Starter
  if (priceId === PLAN_IDS.STARTER) {
    return (
      <span className="px-2 py-0.5 bg-[#d73cbe]/10 text-[#d73cbe] text-xs font-bold uppercase rounded-md border border-[#d73cbe]/20 tracking-wide mb-1.5 flex items-center gap-1">
        Starter <Rocket className="w-3 h-3" />
      </span>
    );
  }

  // 3. Se for o Plano Advanced
  if (priceId === PLAN_IDS.ADVANCED) {
    return (
      <span className="px-2 py-0.5 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-400 text-xs font-bold uppercase rounded-md border border-violet-500/20 tracking-wide mb-1.5 flex items-center gap-1">
        Advanced <Zap className="w-3 h-3" />
      </span>
    );
  }

  // Fallback (Se for ativo mas o ID não bater, mostra PRO genérico)
  return (
    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase rounded-md border border-emerald-500/20 tracking-wide mb-1.5 flex items-center gap-1">
      Pro <ShieldCheck className="w-3 h-3" />
    </span>
  );
}

export default function PerfilView({ user }: { user: UserData }) {
  const [currentUser, setCurrentUser] = useState<UserData>(user);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) setCurrentUser(user);
  }, [user]);

  // --- LÓGICA DE NEGÓCIO ---

  // 1. É Profissional? (Define se pode editar e visualizar o conteúdo de skills/portfolio)
  const isProfessionalUser = currentUser.userType === "PROFESSIONAL";

  // 2. É Assinante Ativo? (Define se ganha o selo verde na foto)
  const isSubscriber = currentUser.stripeSubscriptionStatus === "active";

  const mainName =
    currentUser.name && currentUser.name.trim() !== ""
      ? currentUser.name
      : "Usuário";
  const hasNickname =
    currentUser.displayName &&
    currentUser.displayName.trim() !== "" &&
    currentUser.displayName !== currentUser.name;
  const initials = mainName ? mainName.charAt(0).toUpperCase() : "U";
  const locationText =
    currentUser.city && currentUser.state
      ? `${currentUser.city} - ${currentUser.state}`
      : "Brasil";
  const memberSinceText = getMemberSince(currentUser.createdAt);

  const handleUpdateProfile = async (formData: FormData) => {
    setIsLoading(true);
    const tempUpdates: any = {};
    formData.forEach((value, key) => {
      if (
        key === "profileImage" ||
        key === "currentPassword" ||
        key === "newPassword"
      )
        return;

      if (["skills", "portfolio", "certificates"].includes(key)) {
        try {
          tempUpdates[key] = JSON.parse(value as string);
        } catch (e) {
          tempUpdates[key] = [];
        }
      } else {
        tempUpdates[key] = value;
      }
    });

    let newAvatarUrl = currentUser.avatarUrl;
    const imageFile = formData.get("profileImage");
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      if (currentUser.id) {
        newAvatarUrl = `/api/images/user/${currentUser.id}?timestamp=${Date.now()}`;
      } else {
        newAvatarUrl = URL.createObjectURL(imageFile);
      }
    }

    setCurrentUser((prev) => ({
      ...prev,
      ...tempUpdates,
      avatarUrl: newAvatarUrl,
      hourlyRate: tempUpdates.hourlyRate
        ? parseFloat(tempUpdates.hourlyRate)
        : prev.hourlyRate,
      yearsOfExperience: tempUpdates.yearsOfExperience
        ? parseInt(tempUpdates.yearsOfExperience)
        : prev.yearsOfExperience,
    }));

    try {
      const response = await updateProfile(formData);
      if (!response.success) {
        alert(response.error);
      } else {
        setIsEditModalOpen(false);
      }
    } catch (error) {
      alert("Erro ao salvar perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBio = async (newBio: string) => {
    setIsLoading(true);
    setCurrentUser((prev) => ({ ...prev, bio: newBio }));
    setIsBioModalOpen(false);
    const formData = new FormData();
    formData.append("bio", newBio);
    try {
      await updateProfile(formData);
    } catch (error) {
      alert("Erro ao salvar a bio.");
    } finally {
      setIsLoading(false);
    }
  };

  const bioText = currentUser.bio
    ? currentUser.bio
    : isProfessionalUser
      ? "Sou um especialista apaixonado por criar soluções tecnológicas..."
      : "Olá! Estou aqui em busca dos melhores profissionais...";

  const portfolioItems = Array.isArray(currentUser.portfolio)
    ? currentUser.portfolio
    : [];
  const certificateItems = Array.isArray(currentUser.certificates)
    ? currentUser.certificates
    : [];

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
        currentBio={currentUser.bio || ""}
        onSave={handleUpdateBio}
      />

      <div className="space-y-6 animate-fade-in pb-20">
        {/* HEADER */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden relative shadow-lg shadow-black/20">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-6 right-6 p-2 bg-background border border-border text-foreground rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm z-10 cursor-pointer group"
            title="Editar Perfil"
          >
            <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-4 border-background shadow-xl flex items-center justify-center text-4xl font-bold text-white select-none overflow-hidden group relative">
                  {currentUser.avatarUrl && !imageError ? (
                    <Image
                      src={currentUser.avatarUrl}
                      alt="Avatar"
                      fill
                      className="object-cover"
                      unoptimized
                      key={currentUser.avatarUrl}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                {/* LOGICA DA FOTO: SÓ MOSTRA SELO SE FOR ASSINANTE PAGO */}
                {isSubscriber && (
                  <div
                    className="absolute bottom-1 right-1 bg-green-500 text-white p-1.5 rounded-full border-4 border-card shadow-lg animate-in zoom-in"
                    title="Profissional Verificado (Assinante)"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 w-full pt-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-end gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold text-foreground font-futura">
                      {mainName}
                    </h1>
                    {hasNickname && (
                      <span className="text-lg text-slate-500 font-medium mb-1">
                        ({currentUser.displayName})
                      </span>
                    )}

                    {/* LOGICA DOS BADGES AO LADO DO NOME */}
                    {isProfessionalUser ? (
                      <PlanBadge
                        isActive={isSubscriber}
                        priceId={currentUser.stripePriceId}
                      />
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase rounded-md border border-blue-500/20 tracking-wide mb-1.5 flex items-center gap-1">
                        Cliente
                      </span>
                    )}
                  </div>

                  {/* Cargo do Usuário */}
                  <p className="text-lg text-[#d73cbe] font-medium">
                    {currentUser.jobTitle ? (
                      currentUser.jobTitle
                    ) : !isProfessionalUser ? (
                      "Cliente / Contratante"
                    ) : (
                      <span className="text-sm opacity-50 italic">
                        Especialidade não definida
                      </span>
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {locationText}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" /> {memberSinceText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Financeiro (Aparece para todo Profissional) */}
              {isProfessionalUser && (
                <div className="bg-background/50 p-4 rounded-xl border border-border flex gap-6 mt-4 md:mt-0">
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs text-muted-foreground uppercase font-bold">
                      Valor/Hora
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {currentUser.hourlyRate ? (
                        `R$ ${currentUser.hourlyRate}`
                      ) : (
                        <span className="text-sm text-slate-500 font-normal">
                          A combinar
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="w-px bg-border h-10" />
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs text-muted-foreground uppercase font-bold">
                      Avaliação
                    </p>
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-xl font-bold text-foreground">
                        {currentUser.ratingCount && currentUser.rating
                          ? currentUser.rating.toFixed(1)
                          : "Novo"}
                      </span>
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {currentUser.ratingCount ? (
                        <span className="text-xs text-slate-500">
                          ({currentUser.ratingCount} avaliaÃ§Ãµes)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* SOBRE */}
            <SectionCard title="Sobre" onEdit={() => setIsBioModalOpen(true)}>
              <div className="text-slate-300">
                <ExpandableText
                  content={bioText}
                  lineClamp={3}
                  className="text-slate-300 whitespace-pre-line leading-relaxed"
                />
              </div>
            </SectionCard>

            {/* HABILIDADES COM TARJA DE BLOQUEIO */}
            <div className="relative">
              {!isProfessionalUser && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center border border-border p-4 overflow-hidden">
                  <div className="p-2.5 bg-muted rounded-full mb-2 text-muted-foreground shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-foreground text-center">
                    Exclusivo para Profissionais
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 px-2 text-center">
                    Mude sua conta para expor suas habilidades.
                  </p>
                </div>
              )}
              <SectionCard title="Habilidades e Tecnologias">
                <div
                  className={`flex flex-wrap gap-2 ${!isProfessionalUser ? "min-h-[110px]" : ""}`}
                >
                  {currentUser.skills && currentUser.skills.length > 0 ? (
                    currentUser.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-slate-300"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 italic py-2">
                      Nenhuma habilidade adicionada.
                    </span>
                  )}

                  {isProfessionalUser && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-3 py-1.5 border border-dashed border-border text-muted-foreground rounded-lg text-sm flex items-center gap-1 hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Adicionar / Editar
                    </button>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* PORTFÓLIO COM TARJA DE BLOQUEIO */}
            <div className="relative">
              {!isProfessionalUser && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center border border-border p-4 overflow-hidden">
                  <div className="p-2.5 bg-muted rounded-full mb-2 text-muted-foreground shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-foreground text-center">
                    Exclusivo para Profissionais
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 px-2 text-center">
                    Mude sua conta para exibir seus trabalhos.
                  </p>
                </div>
              )}
              <SectionCard title="Portfólio e Anexos">
                <div
                  className={`grid grid-cols-2 sm:grid-cols-3 gap-4 ${!isProfessionalUser ? "min-h-[110px]" : ""}`}
                >
                  {portfolioItems.map((item, index) => (
                    <a
                      key={index}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square bg-slate-800 rounded-xl border border-border flex flex-col items-center justify-center p-4 cursor-pointer hover:border-primary/50 transition-all text-center hover:bg-slate-800/80"
                    >
                      <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-2">
                        <FileText className="w-6 h-6 text-indigo-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 truncate w-full px-2">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Abrir
                      </span>
                    </a>
                  ))}

                  {isProfessionalUser && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="aspect-square rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-slate-800/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all cursor-pointer"
                    >
                      <div className="p-2 rounded-full bg-background border border-border">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium">
                        Adicionar Projeto
                      </span>
                    </button>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* CERTIFICADOS COM TARJA DE BLOQUEIO */}
            <div className="relative">
              {!isProfessionalUser && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center border border-border p-4 overflow-hidden">
                  <div className="p-2.5 bg-muted rounded-full mb-2 text-muted-foreground shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-foreground text-center">
                    Exclusivo para Profissionais
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 px-2 text-center">
                    Mude sua conta para destacar suas qualificações.
                  </p>
                </div>
              )}
              <SectionCard title="Certificações e Cursos">
                <div
                  className={`flex flex-col gap-3 ${!isProfessionalUser ? "min-h-[110px]" : ""}`}
                >
                  {certificateItems.length > 0 ? (
                    certificateItems.map((cert, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-slate-800/40 border border-border rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-500/10 rounded-lg">
                            <Briefcase className="w-5 h-5 text-yellow-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-200">
                            {cert.title}
                          </span>
                        </div>
                        <a
                          href={cert.url}
                          target="_blank"
                          className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 italic">
                      Nenhuma certificação adicionada.
                    </span>
                  )}

                  {isProfessionalUser && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full py-3 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Certificado
                    </button>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>

          {/* SIDEBAR REDES SOCIAIS */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-foreground mb-4">Redes Sociais</h3>
              <div className="space-y-3">
                {/* GITHUB */}
                {currentUser.socialGithub ? (
                  <a
                    href={currentUser.socialGithub}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer text-left group/social hover:bg-slate-800"
                  >
                    <Github className="w-5 h-5 text-white group-hover/social:text-primary transition-colors" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">Github</p>
                      <p className="text-xs text-green-400 flex items-center gap-1">
                        Conectado <ExternalLink className="w-3 h-3" />
                      </p>
                    </div>
                  </a>
                ) : (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer text-left opacity-70 hover:opacity-100"
                  >
                    <Github className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-400">Github</p>
                      <p className="text-xs text-slate-500">Conectar conta</p>
                    </div>
                    {isProfessionalUser && (
                      <Plus className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                )}

                {/* LINKEDIN */}
                {currentUser.socialLinkedin ? (
                  <a
                    href={currentUser.socialLinkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer text-left group/social hover:bg-slate-800"
                  >
                    <Linkedin className="w-5 h-5 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">LinkedIn</p>
                      <p className="text-xs text-green-400 flex items-center gap-1">
                        Conectado <ExternalLink className="w-3 h-3" />
                      </p>
                    </div>
                  </a>
                ) : (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer text-left opacity-70 hover:opacity-100"
                  >
                    <Linkedin className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-400">
                        LinkedIn
                      </p>
                      <p className="text-xs text-slate-500">Conectar conta</p>
                    </div>
                    {isProfessionalUser && (
                      <Plus className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// ... Auxiliares ...

function SectionCard({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 relative group">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground font-futura">
          {title}
        </h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 hover:bg-background rounded-lg text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EditBioModal({
  isOpen,
  onClose,
  currentBio,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentBio: string;
  onSave: (bio: string) => void;
}) {
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <textarea
            className="w-full min-h-37.5 bg-background border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre você..."
          />
        </div>
        <div className="p-4 bg-background/50 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-foreground hover:bg-white/5 rounded-lg cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(bio)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg flex items-center gap-2 cursor-pointer hover:brightness-110"
          >
            <Save className="w-4 h-4" /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
