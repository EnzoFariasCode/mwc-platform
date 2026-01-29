"use client";

import {
  MapPin,
  Star,
  ShieldCheck,
  CalendarDays,
  Github,
  Linkedin,
  FileText,
  Briefcase,
  ExternalLink,
  MessageSquare,
  Share2,
  CheckCircle2,
  ChevronLeft, // Importei o ícone de voltar
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ExpandableText } from "@/components/ExpandableText";

interface ProfessionalData {
  id: string;
  name: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  jobTitle: string | null;
  hourlyRate: number | null;
  rating: number | null;
  skills: string[];
  portfolio: any;
  certificates: any;
  socialGithub: string | null;
  socialLinkedin: string | null;
  createdAt: Date;
  userType: string;
}

interface ProfileShowcaseProps {
  professional: ProfessionalData;
  isAuthenticated: boolean;
  isOwner?: boolean;
  backHref?: string; // --- NOVO: Link para voltar ---
}

export function ProfileShowcase({
  professional,
  isAuthenticated,
  isOwner = false,
  backHref, // Recebendo a prop
}: ProfileShowcaseProps) {
  const mainName =
    professional.displayName || professional.name || "Profissional";
  const initials = mainName.charAt(0).toUpperCase();

  const memberSince = new Date(professional.createdAt).toLocaleDateString(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    },
  );

  const portfolioItems = Array.isArray(professional.portfolio)
    ? professional.portfolio
    : [];
  const certificateItems = Array.isArray(professional.certificates)
    ? professional.certificates
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* --- BOTÃO DE VOLTAR MINIMALISTA --- */}
      {backHref && (
        <div className="mb-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para lista
          </Link>
        </div>
      )}

      {/* HEADER / CAPA */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden relative shadow-lg shadow-black/20">
        <div className="h-32 w-full bg-gradient-to-r from-slate-900 via-[#d73cbe]/10 to-slate-900 border-b border-border/50" />

        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start -mt-12">
            {/* AVATAR */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-900 border-4 border-card shadow-2xl flex items-center justify-center text-5xl font-bold text-white select-none overflow-hidden relative group">
                {professional.avatarUrl ? (
                  <Image
                    src={professional.avatarUrl}
                    alt={mainName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-slate-600">{initials}</span>
                )}
              </div>
              {professional.userType === "PROFESSIONAL" && (
                <div
                  className="absolute bottom-2 right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-card shadow-sm"
                  title="Profissional Verificado"
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* INFO PRINCIPAL */}
            <div className="flex-1 w-full pt-14 md:pt-16">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white font-futura mb-1 flex items-center gap-2">
                    {mainName}
                    {professional.rating && professional.rating >= 4.8 && (
                      <CheckCircle2 className="w-6 h-6 text-blue-400 fill-blue-500/20" />
                    )}
                  </h1>
                  <p className="text-lg text-[#d73cbe] font-medium mb-3">
                    {professional.jobTitle || "Profissional MWC"}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
                      <MapPin className="w-3.5 h-3.5" />
                      {professional.city
                        ? `${professional.city} - ${professional.state}`
                        : "Brasil"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" /> Membro desde{" "}
                      {memberSince}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
                  {isOwner ? (
                    <Link href="/dashboard/perfil" className="cursor-pointer">
                      <button className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700 cursor-pointer">
                        Editar Meu Perfil
                      </button>
                    </Link>
                  ) : (
                    <Link
                      href={
                        isAuthenticated
                          ? `/dashboard/chat?newChat=${professional.id}`
                          : `/login?action=chat&proId=${professional.id}&proName=${encodeURIComponent(mainName)}`
                      }
                      className="cursor-pointer"
                    >
                      <button className="w-full py-3 px-6 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#d73cbe]/20 flex items-center justify-center gap-2 group cursor-pointer">
                        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Chamar agora
                      </button>
                    </Link>
                  )}

                  <div className="flex gap-3">
                    <button className="flex-1 py-2 bg-slate-900 border border-border rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer">
                      <Share2 className="w-4 h-4" /> Compartilhar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider text-slate-500">
              Informações
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-slate-400 text-sm">Valor Hora</span>
                <span className="text-xl font-bold text-white">
                  {professional.hourlyRate
                    ? `R$ ${professional.hourlyRate}`
                    : "A combinar"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-slate-400 text-sm">Avaliação</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-white">
                    {professional.rating
                      ? professional.rating.toFixed(1)
                      : "5.0"}
                  </span>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
              <div className="pt-2">
                <span className="text-slate-400 text-sm block mb-2">
                  Habilidades
                </span>
                <div className="flex flex-wrap gap-2">
                  {professional.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 bg-slate-800/50 border border-white/10 rounded-md text-xs text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                  {professional.skills.length === 0 && (
                    <span className="text-xs text-slate-600 italic">
                      Não informadas
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {(professional.socialGithub || professional.socialLinkedin) && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider text-slate-500">
                Conexões
              </h3>
              <div className="space-y-3">
                {professional.socialGithub && (
                  <a
                    href={professional.socialGithub}
                    target="_blank"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800 transition-colors border border-white/5 cursor-pointer"
                  >
                    <Github className="w-5 h-5 text-white" />
                    <span className="text-sm font-medium text-slate-300">
                      Github
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-500 ml-auto" />
                  </a>
                )}
                {professional.socialLinkedin && (
                  <a
                    href={professional.socialLinkedin}
                    target="_blank"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800 transition-colors border border-white/5 cursor-pointer"
                  >
                    <Linkedin className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">
                      LinkedIn
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-500 ml-auto" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white font-futura mb-4">
              Sobre
            </h2>
            <div className="text-slate-300 leading-relaxed whitespace-pre-line">
              <ExpandableText
                content={
                  professional.bio ||
                  "Este profissional ainda não escreveu uma bio."
                }
                lineClamp={4}
              />
            </div>
          </div>

          {portfolioItems.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white font-futura mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#d73cbe]" /> Portfólio
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portfolioItems.map((item: any, i: number) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    className="group p-4 bg-slate-900/50 border border-white/5 rounded-xl hover:border-[#d73cbe]/50 transition-all flex items-start gap-4 cursor-pointer"
                  >
                    <div className="p-3 bg-slate-800 rounded-lg group-hover:bg-[#d73cbe]/10 group-hover:text-[#d73cbe] transition-colors">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm mb-1 group-hover:text-[#d73cbe] transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Visualizar projeto externo
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {certificateItems.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white font-futura mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-yellow-500" /> Certificações
              </h2>
              <div className="space-y-3">
                {certificateItems.map((cert: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-slate-900/30 border border-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                      <span className="font-medium text-slate-300">
                        {cert.title}
                      </span>
                    </div>
                    {cert.url && (
                      <a
                        href={cert.url}
                        target="_blank"
                        className="text-xs text-[#d73cbe] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Verificar <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
