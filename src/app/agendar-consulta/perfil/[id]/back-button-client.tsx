"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButtonClient() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      Voltar para a pesquisa
    </button>
  );
}
