"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  X,
  Save,
  ShieldCheck,
  Check,
} from "lucide-react";

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 sticky top-0 bg-[#0f172a] z-10">
          <div>
            <h2 className="text-2xl font-futura font-bold text-white">
              Editar Perfil
            </h2>
            <p className="text-sm text-slate-400">
              Mantenha seus dados atualizados para atendimentos e emergências.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-10">
          {/* SEÇÃO 1: DADOS PESSOAIS */}
          <section>
            <h3 className="text-[#d73cbe] text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
              <User className="w-4 h-4" /> Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  defaultValue="Daniel Sodré"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  E-mail
                </label>
                <input
                  type="email"
                  defaultValue="daniel@email.com"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Data de Nascimento
                </label>
                <input
                  type="text"
                  defaultValue="15/08/1990"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Sexo Biológico
                </label>
                <select className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all appearance-none cursor-pointer">
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: ENDEREÇO (Igual Imagem 1) */}
          <section>
            <h3 className="text-[#d73cbe] text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Endereço Residencial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  CEP *
                </label>
                <input
                  type="text"
                  defaultValue="04855-250"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Endereço *
                </label>
                <input
                  type="text"
                  defaultValue="R TENENTE ODILON RAPOSO"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Número *
                </label>
                <input
                  type="text"
                  defaultValue="56"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Complemento
                </label>
                <input
                  type="text"
                  placeholder="Apto, Bloco..."
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  defaultValue="JARDIM BELCITO"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Cidade *
                </label>
                <input
                  type="text"
                  defaultValue="SAO PAULO"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  UF *
                </label>
                <input
                  type="text"
                  defaultValue="SP"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* SEÇÃO 3: WHATSAPP (Igual Imagem 2) */}
          <section className="bg-white/5 p-6 rounded-2xl border border-white/5">
            <h3 className="text-white text-lg font-bold mb-2">
              Autorização no WhatsApp MWC
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Esta etapa é essencial para que você tenha acesso a todas as
              notificações e lembretes de consultas via WhatsApp.
            </p>

            <div className="space-y-4">
              <div className="max-w-xs space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Número de telefone
                </label>
                <input
                  type="text"
                  defaultValue="11-94839-9097"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-1">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-white/20 rounded md peer-checked:bg-[#d73cbe] peer-checked:border-[#d73cbe] transition-all" />
                  <Check className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-all" />
                </div>
                <span className="text-sm text-slate-300">
                  Li e concordo com os{" "}
                  <span className="text-[#d73cbe] underline">
                    Termos de uso
                  </span>
                </span>
              </label>
            </div>
          </section>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 mt-10 border-t border-white/5">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 text-white text-sm font-bold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-[#d73cbe] hover:bg-[#b02da0] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            {isSaving ? (
              "Salvando..."
            ) : (
              <>
                <Save className="w-4 h-4" /> Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
