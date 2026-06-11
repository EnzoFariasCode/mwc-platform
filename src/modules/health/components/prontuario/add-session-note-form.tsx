"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { createSessionNote } from "@/modules/health/actions/client-record-actions";

type Props = {
  clientRecordId: string;
  patientId: string;
};

export function AddSessionNoteForm({ clientRecordId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [content, setContent] = useState("");
  const [evolution, setEvolution] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");

  const handleSubmit = () => {
    if (content.trim().length < 10) {
      toast.error("A nota deve ter pelo menos 10 caracteres.");
      return;
    }

    startTransition(async () => {
      const result = await createSessionNote(clientRecordId, {
        sessionDate,
        content,
        evolution: evolution || undefined,
        nextSteps: nextSteps || undefined,
        privateNotes: privateNotes || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Nota de sessao registrada.");
      setContent("");
      setEvolution("");
      setNextSteps("");
      setPrivateNotes("");
      setIsOpen(false);
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#d73cbe]/20 bg-[#d73cbe]/5 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[#d73cbe]/10"
      >
        <div className="flex items-center gap-3">
          <PlusCircle className="h-5 w-5 text-[#d73cbe]" />
          <span className="text-sm font-bold uppercase tracking-tight text-white">
            Registrar nova nota de sessao
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-4 px-6 pb-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
              Data da sessao
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(event) => setSessionDate(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
              Nota da sessao <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={5}
              placeholder="Descreva o que foi trabalhado nesta sessao..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
              Evolucao do paciente
            </label>
            <textarea
              value={evolution}
              onChange={(event) => setEvolution(event.target.value)}
              rows={3}
              placeholder="Como o paciente evoluiu desde a ultima sessao..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
              Proximos passos / Tarefas
            </label>
            <textarea
              value={nextSteps}
              onChange={(event) => setNextSteps(event.target.value)}
              rows={3}
              placeholder="O que ficou combinado para a proxima sessao..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              Anotacoes privadas
              <span className="text-[10px] font-normal normal-case tracking-normal text-slate-600">
                (apenas voce ve)
              </span>
            </label>
            <textarea
              value={privateNotes}
              onChange={(event) => setPrivateNotes(event.target.value)}
              rows={3}
              placeholder="Impressoes pessoais, hipoteses, lembretes internos..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="cursor-pointer rounded-xl bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/10 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || content.trim().length < 10}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#d73cbe] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#c032a8] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              Salvar nota
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
