"use client";

import { FormEvent, useEffect, useState } from "react";
import { User, MapPin, X, Save, Check, Phone } from "lucide-react";
import {
  updatePatientProfile,
  type PatientProfileData,
} from "@/modules/users/actions/update-patient-profile";

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PatientProfileData | null;
  onSaved?: () => void;
};

function formatPhoneNumber(value?: string | null) {
  const digits = value?.replace(/\D/g, "").slice(0, 11) ?? "";

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function EditProfileModal({
  isOpen,
  onClose,
  initialData,
  onSaved,
}: EditProfileModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPhone(formatPhoneNumber(initialData?.phone));
    }
  }, [initialData?.phone, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const result = await updatePatientProfile(
      new FormData(event.currentTarget),
    );

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 custom-scrollbar"
      >
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
            type="button"
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-10">
          {/* SECAO 1: DADOS PESSOAIS */}
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
                  name="name"
                  type="text"
                  defaultValue={initialData?.name || ""}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  E-mail
                </label>
                <input
                  type="email"
                  defaultValue={initialData?.email || ""}
                  readOnly
                  className="w-full bg-[#020617]/50 border border-white/5 rounded-xl py-3 px-4 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Data de Nascimento
                </label>
                {/* Nota do DEV: Certifique-se de que initialData.birthDate está formatado como YYYY-MM-DD para o input type="date" funcionar direito */}
                <input
                  name="birthDate"
                  type="date"
                  defaultValue={initialData?.birthDate || ""}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Sexo Biológico
                </label>
                <select
                  name="gender"
                  defaultValue={initialData?.gender || ""}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Não informado</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECAO 2: ENDERECO */}
          <section>
            <h3 className="text-[#d73cbe] text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Endereço Residencial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  CEP
                </label>
                <input
                  name="cep"
                  type="text"
                  defaultValue={initialData?.cep || ""}
                  placeholder="00000-000"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Endereço
                </label>
                <input
                  name="address"
                  type="text"
                  defaultValue={initialData?.address || ""}
                  placeholder="Nome da rua, avenida..."
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Número
                </label>
                <input
                  name="addressNumber"
                  type="text"
                  defaultValue={initialData?.addressNumber || ""}
                  placeholder="123"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Complemento
                </label>
                <input
                  name="complement"
                  type="text"
                  defaultValue={initialData?.complement || ""}
                  placeholder="Apto, Bloco..."
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Bairro
                </label>
                <input
                  name="neighborhood"
                  type="text"
                  defaultValue={initialData?.neighborhood || ""}
                  placeholder="Centro"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Cidade
                </label>
                <input
                  name="city"
                  type="text"
                  defaultValue={initialData?.city || ""}
                  placeholder="São Paulo"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  UF
                </label>
                <input
                  name="state"
                  type="text"
                  defaultValue={initialData?.state || ""}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all uppercase"
                />
              </div>
            </div>
          </section>

          {/* SECAO 3: WHATSAPP */}
          <section className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-6">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-white text-lg font-bold">
                  Autorização no WhatsApp MWC
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Use DDD + número com 9 dígitos. Exemplo: (11) 99999-9999.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                    Número de telefone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(event) =>
                      setPhone(formatPhoneNumber(event.target.value))
                    }
                    maxLength={15}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-[#020617] border border-emerald-500/20 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400 outline-none transition-all"
                  />
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  Padrão BR
                </span>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-1">
                  <input
                    type="checkbox"
                    name="whatsappConsent"
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
                  </span>{" "}
                  e com as políticas da MWC Online para notificações,
                  agendamentos, cancelamentos e reembolsos.
                </span>
              </label>
            </div>
          </section>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 mt-10 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 text-white text-sm font-bold cursor-pointer hover:bg-white/5 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-[#d73cbe] hover:bg-[#b02da0] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
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
      </form>
    </div>
  );
}
