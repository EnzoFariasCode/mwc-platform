"use client";

import { Suspense } from "react";
// Importe do local onde criamos no passo 1
import { ProfessionalSearch } from "@/modules/search/components/professional-search";

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <Suspense
        fallback={
          <div className="p-20 text-center text-white">Carregando busca...</div>
        }
      >
        {/* baseRoute="/search" significa que ao limpar filtros, ele volta para essa mesma página pública */}
        <ProfessionalSearch baseRoute="/search" />
      </Suspense>
    </div>
  );
}
