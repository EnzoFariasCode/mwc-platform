"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Star } from "lucide-react";
import { ReviewModal } from "@/modules/reviews/components/ReviewModal";
import { submitHealthAppointmentReview } from "@/modules/health/actions/submit-health-appointment-review";

export function HealthAppointmentReviewButton({
  appointmentId,
  professionalName,
  reviewed,
}: {
  appointmentId: string;
  professionalName: string;
  reviewed: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (reviewed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        Avaliacao enviada
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2.5 text-xs font-bold text-yellow-300 transition-colors hover:bg-yellow-500/20"
      >
        <Star className="h-4 w-4" />
        Avaliar atendimento
      </button>

      <ReviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Avaliar ${professionalName}`}
        subtitle="Sua nota e seu comentario poderao aparecer no perfil publico do profissional."
        confirmLabel="Publicar avaliacao"
        successMessage="Avaliacao publicada com sucesso."
        commentHint="Nao informe diagnosticos, documentos ou outros dados pessoais de saude."
        maxCommentLength={1000}
        onConfirm={async (rating, comment) => {
          const result = await submitHealthAppointmentReview(
            appointmentId,
            rating,
            comment,
          );
          if (result.success) router.refresh();
          return result;
        }}
      />
    </>
  );
}
