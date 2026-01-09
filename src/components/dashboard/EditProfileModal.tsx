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
} from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string | null;
    displayName: string | null;
    email: string | null;
    birthDate?: string | null;
  };
  onSave: (data: {
    name: string;
    displayName: string;
    birthDate: string;
    // Opcionais, pois só enviamos se houver alteração de senha
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
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    birthDate: "",
    currentPassword: "",
    newPassword: "",
  });

  // Controle de visibilidade da senha
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Estado de erro para validação
  const [error, setError] = useState<string | null>(null);

  // Efeito para popular os dados quando o modal abre ou o user muda
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || "",
        displayName: user.displayName || "",
        birthDate: user.birthDate || "",
        currentPassword: "", // Sempre limpa a senha ao abrir
        newPassword: "", // Sempre limpa a senha ao abrir
      });
      setError(null); // Limpa erros anteriores
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- Validação de Senha ---
    // Se o usuário digitou algo na nova senha, a senha atual é OBRIGATÓRIA
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

    // Prepara o objeto de envio
    const payload: any = {
      name: formData.name,
      displayName: formData.displayName,
      birthDate: formData.birthDate,
    };

    // Só inclui senhas no payload se houver alteração
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
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white">
            Editar Dados Pessoais
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer group"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar"
        >
          {/* Mensagem de Erro Geral */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Seção: Dados Básicos */}
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
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm text-slate-200 placeholder:text-slate-600"
                  placeholder="Seu nome real"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm text-slate-200 placeholder:text-slate-600"
                  placeholder="Como aparece no perfil"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                Email{" "}
                <span className="text-[10px] font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                  Somente Leitura
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
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2" />

          {/* Seção: Segurança */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" /> Alterar Senha
            </h3>

            <div className="space-y-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              {/* Senha Atual - Requisitado pelo Usuário */}
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
                    placeholder="Necessário para confirmar alterações"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    className={`w-full p-2.5 pr-10 bg-slate-950 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200 placeholder:text-slate-600 transition-all ${
                      error && !formData.currentPassword && formData.newPassword
                        ? "border-red-500/50 focus:border-red-500"
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

              {/* Nova Senha */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Deixe em branco para manter a atual"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    className="w-full p-2.5 pr-10 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200 placeholder:text-slate-600"
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
                {formData.newPassword && (
                  <p className="text-[10px] text-slate-500 pl-1">
                    Mínimo de 6 caracteres.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] rounded-lg shadow-lg shadow-indigo-900/20 transition-all cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
