"use client";

import { X, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface DelMyProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
  isLoading: boolean;
}

export function DelMyProjectsModal({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
  isLoading,
}: DelMyProjectsModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-slate-900 border border-red-500/30 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-300 transform ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-10"
        }`}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 text-red-500">
            <Trash2 size={32} />
          </div>

          <h2 className="text-xl font-bold text-white font-futura mb-2">
            Excluir Projeto?
          </h2>

          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Tem certeza que deseja excluir o projeto <br />
            <span className="text-white font-bold">"{projectTitle}"</span>?
          </p>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 flex items-start gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">
              Esta ação é irreversível. Todas as propostas e conversas
              vinculadas a este projeto também serão perdidas.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Excluir
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
