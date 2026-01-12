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
  Code2, // Ícone para habilidades
  Plus,
} from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string | null;
    displayName: string | null;
    email: string | null;
    birthDate?: string | Date | null;
    city?: string | null;
    state?: string | null;
    hourlyRate?: number | null;
    jobTitle?: string | null;
    skills?: string[]; // NOVO
  };
  onSave: (data: {
    name: string;
    displayName: string;
    birthDate: string;
    city: string;
    state: string;
    hourlyRate?: string;
    jobTitle: string;
    skills: string[]; // NOVO
    currentPassword?: string;
    newPassword?: string;
  }) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  user,
  onSave,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    birthDate: "",
    city: "",
    state: "",
    hourlyRate: "",
    jobTitle: "",
    skills: [] as string[], // Estado para as habilidades
    currentPassword: "",
    newPassword: "",
  });

  const [newSkill, setNewSkill] = useState(""); // Input temporário para nova skill
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
        skills: user.skills || [], // Carrega as skills do banco
        currentPassword: "",
        newPassword: "",
      });
      setError(null);
      setNewSkill("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  }, [isOpen, user]);

  // --- Lógica de Habilidades ---
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (formData.skills.length >= 5) {
      setError("Você pode adicionar no máximo 5 habilidades.");
      return;
    }
    if (formData.skills.includes(newSkill.trim())) {
      setError("Essa habilidade já foi adicionada.");
      return;
    }

    setFormData({
      ...formData,
      skills: [...formData.skills, newSkill.trim()],
    });
    setNewSkill("");
    setError(null);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  // Permite adicionar skill apertando Enter sem enviar o formulário
  const handleKeyDownSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.jobTitle || formData.jobTitle.trim() === "") {
      setError("O campo 'Cargo / Especialização' é obrigatório.");
      return;
    }

    if (formData.newPassword.trim() !== "") {
      if (!formData.currentPassword || formData.currentPassword.trim() === "") {
        setError(
          "Para alterar a senha, é necessário confirmar sua senha atual."
        );
        return;
      }
      if (formData.newPassword.length < 6) {
        setError("A nova senha deve ter no mínimo 6 caracteres.");
        return;
      }
    }

    const payload: any = {
      name: formData.name,
      displayName: formData.displayName,
      birthDate: formData.birthDate,
      city: formData.city,
      state: formData.state,
      hourlyRate: formData.hourlyRate,
      jobTitle: formData.jobTitle,
      skills: formData.skills, // Envia o array
    };

    if (formData.newPassword) {
      payload.currentPassword = formData.currentPassword;
      payload.newPassword = formData.newPassword;
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer group"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Dados Básicos */}
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
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Apelido (Display)
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                Cargo / Especialização <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Desenvolvedor Fullstack"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, jobTitle: e.target.value })
                  }
                  className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-200 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                Email{" "}
                <span className="text-[10px] ml-auto text-slate-500">
                  Não editável
                </span>
              </label>
              <div className="relative opacity-60 cursor-not-allowed">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full pl-10 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Data de Nascimento
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

          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2" />

          {/* --- NOVA SEÇÃO: HABILIDADES --- */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4" /> Habilidades
              </h3>
              <span className="text-[10px] text-slate-500">
                {formData.skills.length}/5 adicionadas
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: React, Figma, Inglês..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleKeyDownSkill}
                  className="flex-1 p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-200 placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={formData.skills.length >= 5 || !newSkill.trim()}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Habilidades */}
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {formData.skills.length === 0 && (
                  <span className="text-xs text-slate-500 italic py-2">
                    Nenhuma habilidade adicionada ainda.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2" />

          {/* Completar Cadastro */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Completar Cadastro
              </h3>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Opcional
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Cidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: Campinas"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-200"
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">UF</label>
                <input
                  type="text"
                  placeholder="SP"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-200 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                Valor Hora Profissional
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourlyRate: e.target.value })
                  }
                  className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-200 placeholder:text-slate-600"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Deixe em branco para combinar o valor no chat.
              </p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2" />

          {/* Segurança */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" /> Alterar Senha
            </h3>
            <div className="space-y-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Senha Atual{" "}
                  {formData.newPassword && (
                    <span className="text-red-400">*</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    className={`w-full p-2.5 pr-10 bg-slate-950 border rounded-lg outline-none text-sm text-slate-200 transition-all ${
                      error && !formData.currentPassword && formData.newPassword
                        ? "border-red-500/50"
                        : "border-slate-700"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    className="w-full p-2.5 pr-10 bg-slate-950 border border-slate-700 rounded-lg outline-none text-sm text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] rounded-lg shadow-lg shadow-indigo-900/20 cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
