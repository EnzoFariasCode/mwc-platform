"use client";

import { PageContainer } from "@/components/dashboard/PageContainer"; // Seu container padrão
import { Suspense } from "react";
import { ProfessionalSearch } from "@/components/features/professional-search";

export default function DashboardSearchPage() {
  return (
    <PageContainer>
      <Suspense
        fallback={
          <div className="p-20 text-center text-white">Carregando busca...</div>
        }
      >
        <ProfessionalSearch baseRoute="/dashboard/encontrar-profissionais" />
      </Suspense>
    </PageContainer>
  );
}
