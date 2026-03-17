"use client";

import { useEffect, useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  confirmLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  onConfirm: (rating: number, comment?: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

export function ReviewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  confirmLabel = "Confirmar Avaliacao",
  successMessage = "Avaliacao enviada com sucesso!",
  errorMessage = "Erro ao enviar avaliacao.",
  onConfirm,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setComment("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await onConfirm(rating, comment);
    if (result.success) {
      toast.success(successMessage);
      onClose();
    } else {
      toast.error(result.error || errorMessage);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0B1121] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-slate-950">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white font-futura">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase">
              Sua Nota
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="p-2 rounded-lg bg-slate-900 border border-white/10 hover:border-yellow-500/50 transition-colors"
                  aria-label={`Nota ${value}`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      rating >= value
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-slate-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase">
              Comentario (Opcional)
            </label>
            <textarea
              rows={4}
              placeholder="Compartilhe sua experiencia..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#d73cbe] outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
