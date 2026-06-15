"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

type TechProjectReasonModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isLoading?: boolean;
  minLength?: number;
  tone?: "danger" | "warning";
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function TechProjectReasonModal({
  isOpen,
  title,
  description,
  confirmLabel,
  isLoading = false,
  minLength = 0,
  tone = "warning",
  onClose,
  onConfirm,
}: TechProjectReasonModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const canSubmit = reason.trim().length >= minLength;
  const toneClass =
    tone === "danger"
      ? "bg-red-500 hover:bg-red-400 text-white"
      : "bg-yellow-500 hover:bg-yellow-400 text-black";

  function handleClose() {
    setReason("");
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || isLoading) return;
    onConfirm(reason.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0B1121] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/5 bg-slate-950 p-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-white font-futura">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <textarea
            rows={5}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Descreva o motivo..."
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 p-4 text-sm text-white outline-none transition-colors focus:border-[#d73cbe]"
          />

          {minLength > 0 && (
            <p className="text-xs text-slate-500">
              Minimo de {minLength} caracteres.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
