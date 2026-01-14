"use client";

import {
  X,
  Calendar,
  DollarSign,
  User,
  Clock,
  FileText,
  Briefcase,
  Send,
  MapPin,
  Star,
} from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Interface updated to include owner info needed for the Professional view
interface ProjectData {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: Date | string;
  deadline: string;
  budgetLabel: string;
  budgetType?: string;
  category?: string;
  tags?: string[];
  ownerId?: string; // Needed for chat
  owner?: {
    name: string | null;
    city?: string | null;
    state?: string | null;
    rating?: number | null;
  } | null;
  professional?: {
    name: string;
    jobTitle?: string | null;
  } | null;
}

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData | null;
  viewMode?: "client" | "professional"; // New prop to control layout
}

export function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
  viewMode = "client",
}: ProjectDetailsModalProps) {
  const router = useRouter();

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen || !project) return null;

  // --- Formatting Helpers ---
  const shortId = project.id.substring(0, 4).toUpperCase();
  const formattedDate = new Date(project.createdAt).toLocaleDateString("pt-BR");

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // --- Action Handlers ---
  const handleSendProposal = () => {
    if (project.ownerId) {
      // Navigate to chat with the project owner
      router.push(`/dashboard/chat?newChat=${project.ownerId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-950 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider border border-white/10 px-2 py-0.5 rounded-full">
                #{shortId}
              </span>
              <StatusBadge status={project.status} />
              {project.category && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 uppercase">
                  {project.category}
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white font-futura leading-tight line-clamp-2">
              {project.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
          {/* CLIENT VIEW: Show Professional Status */}
          {viewMode === "client" &&
            (project.professional ? (
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> Profissional Contratado
                </h3>
                <div className="bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg border border-white/10 shrink-0">
                    {getInitials(project.professional.name)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">
                      {project.professional.name}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {project.professional.jobTitle || "Profissional"}
                    </p>
                  </div>
                  <div className="ml-auto hidden md:block text-right">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg">
                      Atribuído
                    </span>
                  </div>
                </div>
              </section>
            ) : (
              <section>
                <div className="bg-slate-900/50 border border-dashed border-slate-700 p-4 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-full text-slate-500">
                    <Briefcase size={20} />
                  </div>
                  <p className="text-slate-400 text-sm">
                    Aguardando propostas de profissionais.
                  </p>
                </div>
              </section>
            ))}

          {/* PROFESSIONAL VIEW: Show Client Info */}
          {viewMode === "professional" && project.owner && (
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Sobre o Cliente
              </h3>
              <div className="bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-lg border border-white/10 shrink-0">
                  {project.owner.name ? getInitials(project.owner.name) : "?"}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">
                    {project.owner.name || "Cliente Confidencial"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin size={12} />
                    {project.owner.city
                      ? `${project.owner.city}, ${project.owner.state}`
                      : "Local não informado"}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                  <span className="text-yellow-500 font-bold text-sm">
                    {project.owner.rating
                      ? project.owner.rating.toFixed(1)
                      : "5.0"}
                  </span>
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
            </section>
          )}

          {/* Project Description */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Escopo do Projeto
            </h3>
            <div className="text-slate-300 text-sm leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
              {project.description}
            </div>
            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md bg-white/5 text-xs font-medium text-slate-300 border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Project Details Grid */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Detalhes do Pedido
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs">
                  <Calendar className="w-4 h-4" /> Publicado em
                </div>
                <p className="text-white font-bold">{formattedDate}</p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs">
                  <Clock className="w-4 h-4" /> Prazo Estimado
                </div>
                <p className="text-white font-bold">{project.deadline}</p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs">
                  <DollarSign className="w-4 h-4" /> Orçamento
                </div>
                <p className="text-[#d73cbe] font-bold text-lg">
                  {project.budgetLabel}
                </p>
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  {project.budgetType === "hourly" ? "Por Hora" : "Preço Fixo"}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 bg-slate-900/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>

          {/* Action Button for Professionals */}
          {viewMode === "professional" && (
            <button
              onClick={handleSendProposal}
              className="px-6 py-2.5 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-900/20 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Enviar Proposta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable Status Badge
function StatusBadge({ status }: { status: string }) {
  if (status === "OPEN") {
    return (
      <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 uppercase">
        Em Aberto
      </span>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase">
        Em Andamento
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20 uppercase">
      {status}
    </span>
  );
}
