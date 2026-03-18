"use client";

import { useState } from "react";
import { X, UploadCloud, Link as LinkIcon, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitDelivery } from "@/modules/proposals/actions/submit-delivery";

interface DeliverProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
}

export function DeliverProjectModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
}: DeliverProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const result = await submitDelivery(projectId, link, description);

    if (result.success) {
      toast.success("Projeto entregue! Aguardando aprovação do cliente.");
      onClose();
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0B1121] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-slate-950">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white font-futura flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#d73cbe]" /> Entregar
                Projeto
              </h2>
              <p className="text-xs text-slate-400 mt-1 truncate max-w-[300px]">
                {projectTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs text-blue-300 leading-relaxed">
              <strong>Importante:</strong> Certifique-se de que o cliente tem
              acesso aos arquivos. Ao enviar, o status mudará para &quot;Em Análise&quot;
              e o pagamento será liberado após a aprovação.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase">
              Link dos Arquivos (Drive, GitHub, Figma)
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="url"
                placeholder="https://..."
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-[#d73cbe] outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase">
              Comentários da Entrega
            </label>
            <textarea
              rows={4}
              placeholder="Descreva o que foi feito nesta entrega..."
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#d73cbe] outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Enviar para Aprovação
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
