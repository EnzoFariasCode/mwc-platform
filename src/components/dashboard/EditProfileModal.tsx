"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  MapPin,
  DollarSign,
  Briefcase,
  Code2,
  Plus,
  Github,
  Linkedin,
  FileText,
  Link as LinkIcon,
  Trash2,
  Save,
} from "lucide-react";

// Tipagem auxiliar para itens de lista
type PortfolioItem = {
  title: string;
  url: string;
};

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string | null;
    displayName: string | null;
    email: string | null;
    // userType é crucial aqui para a lógica condicional
    userType: "CLIENT" | "PROFESSIONAL" | "ADMIN";
    birthDate?: string | Date | null;
    city?: string | null;
    state?: string | null;
    hourlyRate?: number | null;
    jobTitle?: string | null;
    skills?: string[];
    socialGithub?: string | null;
    socialLinkedin?: string | null;
    portfolio?: any;
    certificates?: any;
  };
  onSave: (data: any) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  user,
  onSave,
}: EditProfileModalProps) {
  // Verificação Principal: É Profissional?
  const isPro = user.userType === "PROFESSIONAL";

  // Estados principais
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    birthDate: "",
    city: "",
    state: "",
    hourlyRate: "",
    jobTitle: "",
    skills: [] as string[],
    socialGithub: "",
    socialLinkedin: "",
    currentPassword: "",
    newPassword: "",
  });

  // Estados para listas (Portfolio e Certificados)
  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>([]);
  const [certificateList, setCertificateList] = useState<PortfolioItem[]>([]);

  // Inputs temporários
  const [newSkill, setNewSkill] = useState("");
  const [newPortfolio, setNewPortfolio] = useState({ title: "", url: "" });
  const [newCertificate, setNewCertificate] = useState({ title: "", url: "" });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      let formattedDate = "";
      if (user.birthDate) {
        const dateObj = new Date(user.birthDate);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split("T")[0];
        } else if (typeof user.birthDate === "string") {
          formattedDate = user.birthDate;
        }
      }

      setFormData({
        name: user.name || "",
        displayName: user.displayName || "",
        birthDate: formattedDate,
        city: user.city || "",
        state: user.state || "",
        hourlyRate: user.hourlyRate ? user.hourlyRate.toString() : "",
        jobTitle: user.jobTitle || "",
        skills: user.skills || [],
        socialGithub: user.socialGithub || "",
        socialLinkedin: user.socialLinkedin || "",
        currentPassword: "",
        newPassword: "",
      });

      setPortfolioList(Array.isArray(user.portfolio) ? user.portfolio : []);
      setCertificateList(
        Array.isArray(user.certificates) ? user.certificates : []
      );

      setError(null);
      setNewSkill("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  }, [isOpen, user]);

  // --- Helpers de Lista ---
  const addItem = (
    list: PortfolioItem[],
    setList: (l: PortfolioItem[]) => void,
    newItem: PortfolioItem,
    setNewItem: (i: PortfolioItem) => void,
    limit: number
  ) => {
    if (!newItem.title.trim() || !newItem.url.trim()) return;
    if (list.length >= limit) {
      setError(`Limite de ${limit} itens atingido.`);
      return;
    }
    setList([...list, newItem]);
    setNewItem({ title: "", url: "" });
    setError(null);
  };

  const removeItem = (
    list: PortfolioItem[],
    setList: (l: PortfolioItem[]) => void,
    index: number
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  // --- Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validação Condicional: Só exige cargo se for Profissional
    if (isPro) {
      if (!formData.jobTitle || formData.jobTitle.trim() === "") {
        setError(
          "O campo 'Cargo / Especialização' é obrigatório para profissionais."
        );
        return;
      }
    }

    if (formData.newPassword.trim() !== "") {
      if (!formData.currentPassword) {
        setError("Para alterar a senha, confirme a senha atual.");
        return;
      }
      if (formData.newPassword.length < 6) {
        setError("Nova senha deve ter min 6 caracteres.");
        return;
      }
    }

    const payload: any = {
      ...formData,
      // Se for cliente, limpamos ou enviamos vazio os dados profissionais para garantir
      skills: isPro ? formData.skills : [],
      portfolio: isPro ? portfolioList : [],
      certificates: isPro ? certificateList : [],
      jobTitle: isPro ? formData.jobTitle : null,
      hourlyRate: isPro ? formData.hourlyRate : null,
    };

    if (formData.newPassword) {
      payload.currentPassword = formData.currentPassword;
      payload.newPassword = formData.newPassword;
    }

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header Fixo */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-900/50 shrink-0">
          <h2 className="text-xl font-bold text-white">
            Editar Perfil {isPro ? "(Profissional)" : "(Cliente)"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer group"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </button>
        </div>

        {/* Conteúdo Scrollável */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* DADOS BÁSICOS (COMUNS PARA TODOS) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <User className="w-4 h-4" /> Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Apelido
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                />
              </div>
            </div>

            {/* Cargo (APENAS PROFISSIONAL) e Data (TODOS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Condicional: Só mostra Cargo se for PRO */}
              {isPro && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Cargo <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={formData.jobTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, jobTitle: e.target.value })
                      }
                      className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* Se for Cliente, a data ocupa a largura toda ou fica alinhada */}
              <div className={`space-y-1.5 ${!isPro ? "col-span-2" : ""}`}>
                <label className="text-xs font-medium text-slate-300">
                  Nascimento
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* REDES SOCIAIS (COMUM PARA TODOS - CLIENTES TAMBÉM PODEM TER LINKEDIN) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Redes Sociais
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {/* Github geralmente é só pra Pro, mas pode deixar opcional. Se quiser esconder para cliente: {isPro && (...)} */}
              {isPro && (
                <div className="relative">
                  <Github className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="URL do GitHub"
                    value={formData.socialGithub}
                    onChange={(e) =>
                      setFormData({ ...formData, socialGithub: e.target.value })
                    }
                    className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                  />
                </div>
              )}

              <div className="relative">
                <Linkedin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="URL do LinkedIn"
                  value={formData.socialLinkedin}
                  onChange={(e) =>
                    setFormData({ ...formData, socialLinkedin: e.target.value })
                  }
                  className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* --- BLOCO ESPECÍFICO DE PROFISSIONAL --- */}
          {isPro && (
            <>
              <div className="h-px bg-slate-800" />

              {/* HABILIDADES */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4" /> Habilidades
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {formData.skills.length}/5
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova habilidade..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSkill && formData.skills.length < 5) {
                        setFormData({
                          ...formData,
                          skills: [...formData.skills, newSkill],
                        });
                        setNewSkill("");
                      }
                    }}
                    className="p-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-800 rounded text-xs flex items-center gap-1"
                    >
                      {s}{" "}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            skills: formData.skills.filter((x) => x !== s),
                          })
                        }
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-800" />

              {/* PORTFÓLIO */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Portfólio
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {portfolioList.length}/3
                  </span>
                </div>
                {portfolioList.length < 3 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Título (ex: Meu Site)"
                      value={newPortfolio.title}
                      onChange={(e) =>
                        setNewPortfolio({
                          ...newPortfolio,
                          title: e.target.value,
                        })
                      }
                      className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="URL do Projeto/Arquivo"
                      value={newPortfolio.url}
                      onChange={(e) =>
                        setNewPortfolio({
                          ...newPortfolio,
                          url: e.target.value,
                        })
                      }
                      className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addItem(
                          portfolioList,
                          setPortfolioList,
                          newPortfolio,
                          setNewPortfolio,
                          3
                        )
                      }
                      className="p-2 bg-slate-800 rounded-lg text-white"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  {portfolioList.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 bg-slate-800/50 rounded text-sm"
                    >
                      <span className="truncate max-w-[150px] font-medium">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          className="text-blue-400 text-xs hover:underline truncate max-w-[100px]"
                        >
                          Link
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(portfolioList, setPortfolioList, i)
                          }
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CERTIFICADOS */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Certificados
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {certificateList.length}/5
                  </span>
                </div>
                {certificateList.length < 5 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome Certificado"
                      value={newCertificate.title}
                      onChange={(e) =>
                        setNewCertificate({
                          ...newCertificate,
                          title: e.target.value,
                        })
                      }
                      className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Link do PDF"
                      value={newCertificate.url}
                      onChange={(e) =>
                        setNewCertificate({
                          ...newCertificate,
                          url: e.target.value,
                        })
                      }
                      className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addItem(
                          certificateList,
                          setCertificateList,
                          newCertificate,
                          setNewCertificate,
                          5
                        )
                      }
                      className="p-2 bg-slate-800 rounded-lg text-white"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  {certificateList.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 bg-slate-800/50 rounded text-sm"
                    >
                      <span className="truncate max-w-[150px] font-medium">
                        {item.title}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          removeItem(certificateList, setCertificateList, i)
                        }
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-slate-800" />

          {/* LOCAL E PREÇO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Completar Cadastro
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200"
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 uppercase"
                />
              </div>
            </div>

            {/* Valor Hora (APENAS PROFISSIONAL) */}
            {isPro && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  Valor Hora Profissional
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      setFormData({ ...formData, hourlyRate: e.target.value })
                    }
                    className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SEGURANÇA (COMUM) */}
          <div className="space-y-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
              Segurança (Opcional)
            </h3>
            <input
              type="password"
              placeholder="Senha Atual (Obrigatório se mudar senha)"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              className="w-full p-2 mb-2 bg-slate-950 border border-slate-700 rounded text-sm"
            />
            <input
              type="password"
              placeholder="Nova Senha"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-sm"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50 bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] rounded-lg shadow-lg shadow-indigo-900/20 cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
