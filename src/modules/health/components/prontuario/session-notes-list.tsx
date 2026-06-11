"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Lock } from "lucide-react";

type SessionNoteItem = {
  id: string;
  sessionDate: Date;
  content: string;
  evolution: string | null;
  nextSteps: string | null;
  privateNotes: string | null;
  createdAt: Date;
};

type Props = {
  notes: SessionNoteItem[];
};

function NoteCard({ note }: { note: SessionNoteItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#020617]/70">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 shrink-0 rounded-full bg-[#d73cbe]" />
          <span className="text-sm font-semibold text-white">
            Sessao -{" "}
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
              new Date(note.sessionDate),
            )}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-white/5 px-5 pb-5">
          <div className="space-y-1.5 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Nota da sessao
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {note.content}
            </p>
          </div>

          {note.evolution && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Evolucao
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {note.evolution}
              </p>
            </div>
          )}

          {note.nextSteps && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Proximos passos
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {note.nextSteps}
              </p>
            </div>
          )}

          {note.privateNotes && (
            <div className="space-y-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-yellow-500">
                <Lock className="h-3 w-3" />
                Anotacoes privadas
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-yellow-200/80">
                {note.privateNotes}
              </p>
            </div>
          )}

          <p className="text-[10px] text-slate-600">
            Registrado em{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(note.createdAt))}
          </p>
        </div>
      )}
    </div>
  );
}

export function SessionNotesList({ notes }: Props) {
  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
        <div className="mx-auto mb-4 w-fit rounded-full bg-white/5 p-4">
          <BookOpen className="h-6 w-6 text-slate-600" />
        </div>
        <p className="text-sm text-slate-500">
          Nenhuma nota de sessao registrada ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <BookOpen className="h-4 w-4 text-slate-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Historico de sessoes ({notes.length})
        </h3>
      </div>
      <div className="space-y-2">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}
