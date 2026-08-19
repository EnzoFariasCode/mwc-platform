"use client";

import { useState } from "react";
import { AlertTriangle, Flag, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { reportConversation } from "@/modules/chat/actions/report-conversation";
import {
  CHAT_REPORT_DESCRIPTION_MAX_LENGTH,
  CHAT_REPORT_DESCRIPTION_MIN_LENGTH,
  type ChatReportReasonValue,
} from "@/modules/chat/lib/chat-report-config";

const REPORT_REASONS: Array<{
  value: ChatReportReasonValue;
  label: string;
}> = [
  { value: "HARASSMENT", label: "Assedio ou comportamento abusivo" },
  { value: "FRAUD", label: "Fraude ou tentativa de golpe" },
  { value: "SPAM", label: "Spam ou mensagens repetitivas" },
  { value: "EXTERNAL_PAYMENT", label: "Solicitacao de pagamento externo" },
  { value: "INAPPROPRIATE_CONTENT", label: "Conteudo inapropriado" },
  { value: "THREAT", label: "Ameaca ou risco a seguranca" },
  { value: "OTHER", label: "Outro motivo" },
];

export function ChatReportModal({
  open,
  conversationId,
  reportedUserId,
  reportedUserName,
  onClose,
  onReported,
}: {
  open: boolean;
  conversationId: string | null;
  reportedUserId: string | null;
  reportedUserName: string;
  onClose: () => void;
  onReported: (reportId: string) => void;
}) {
  const [reason, setReason] = useState<ChatReportReasonValue>("HARASSMENT");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  function handleClose() {
    setReason("HARASSMENT");
    setDescription("");
    setIsSubmitting(false);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!conversationId || !reportedUserId) {
      toast.error("Envie ao menos uma mensagem antes de denunciar a conversa.");
      return;
    }

    setIsSubmitting(true);
    const result = await reportConversation({
      conversationId,
      reportedUserId,
      reason,
      description,
    });

    if (!result.success || !result.data) {
      toast.error(result.error || "Nao foi possivel registrar a denuncia.");
      setIsSubmitting(false);
      return;
    }

    setReason("HARASSMENT");
    setDescription("");
    setIsSubmitting(false);
    onReported(result.data.reportId);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-report-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <h2 id="chat-report-title" className="font-bold text-white">
                Denunciar comportamento
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Relate o ocorrido com {reportedUserName}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Ao enviar, a comunicacao entre as duas contas sera bloqueada e a
              conversa sairá da lista. O historico sera preservado para analise
              administrativa.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-200">Motivo</span>
            <select
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as ChatReportReasonValue)
              }
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-red-400"
            >
              {REPORT_REASONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-200">
                Descricao do ocorrido
              </span>
              <span className="text-xs text-slate-500">
                {description.length}/{CHAT_REPORT_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={CHAT_REPORT_DESCRIPTION_MIN_LENGTH}
              maxLength={CHAT_REPORT_DESCRIPTION_MAX_LENGTH}
              required
              disabled={isSubmitting}
              rows={6}
              placeholder="Informe o que aconteceu, quando ocorreu e quais mensagens devem ser analisadas."
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-400"
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                description.trim().length < CHAT_REPORT_DESCRIPTION_MIN_LENGTH
              }
              className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Flag className="h-4 w-4" />
              )}
              Enviar denuncia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
