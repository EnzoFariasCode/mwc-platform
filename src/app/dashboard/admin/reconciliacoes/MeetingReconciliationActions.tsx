"use client";

import { useState, useTransition } from "react";
import { Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  registerManualMeetingLink,
  retryMeetingReconciliation,
} from "@/modules/health/actions/admin-meeting-reconciliation-actions";

export function MeetingReconciliationActions({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [meetLink, setMeetLink] = useState("");
  const [isPending, startTransition] = useTransition();

  function retry() {
    startTransition(async () => {
      const result = await retryMeetingReconciliation(appointmentId);
      if (result.success) {
        toast.success(
          result.confirmed
            ? "Sala criada e consulta confirmada."
            : "Nova tentativa iniciada.",
        );
      } else {
        toast.error(result.error || "Nao foi possivel tentar novamente.");
      }
    });
  }

  function saveManualLink() {
    startTransition(async () => {
      const result = await registerManualMeetingLink(appointmentId, meetLink);
      if (result.success) {
        toast.success("Link cadastrado e consulta confirmada.");
        setMeetLink("");
      } else {
        toast.error(result.error || "Nao foi possivel cadastrar o link.");
      }
    });
  }

  return (
    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
      <button
        type="button"
        disabled={isPending}
        onClick={retry}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#d73cbe] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c42cab] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        Tentar novamente
      </button>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={meetLink}
          onChange={(event) => setMeetLink(event.target.value)}
          placeholder="https://meet.google.com/..."
          aria-label="Link manual do Google Meet"
          className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/60"
        />
        <button
          type="button"
          disabled={isPending || !meetLink.trim()}
          onClick={saveManualLink}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Link2 className="h-4 w-4" />
          Cadastrar link
        </button>
      </div>
    </div>
  );
}
