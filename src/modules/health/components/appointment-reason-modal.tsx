"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

type ReasonOption = {
  value: string;
  label: string;
};

type AppointmentReasonModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  summary: string;
  confirmLabel: string;
  isLoading?: boolean;
  options: ReasonOption[];
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function AppointmentReasonModal({
  isOpen,
  title,
  description,
  summary,
  confirmLabel,
  isLoading = false,
  options,
  onClose,
  onConfirm,
}: AppointmentReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState(options[0]?.value ?? "");
  const [details, setDetails] = useState("");

  if (!isOpen || typeof document === "undefined") return null;

  const normalizedDetails = details.trim();
  const canConfirm = Boolean(selectedReason) && normalizedDetails.length >= 10;

  const handleConfirm = () => {
    if (!canConfirm) return;

    const selectedLabel =
      options.find((option) => option.value === selectedReason)?.label ??
      selectedReason;

    onConfirm(`${selectedLabel}: ${normalizedDetails}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d73cbe]/20 bg-[#d73cbe]/10 text-[#d73cbe]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Motivo
            </label>
            <select
              value={selectedReason}
              onChange={(event) => setSelectedReason(event.target.value)}
              disabled={isLoading}
              className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d73cbe] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Detalhes obrigatorios
            </label>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              disabled={isLoading}
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#d73cbe] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Descreva o motivo com pelo menos 10 caracteres."
            />
            <p className="text-xs text-slate-500">
              Esse registro ficara vinculado ao agendamento para auditoria.
            </p>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm leading-relaxed text-yellow-100">
            {summary}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className="rounded-xl bg-[#d73cbe] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#d73cbe]/20 transition hover:bg-[#b02da0] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {isLoading ? "Processando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
