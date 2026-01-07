"use client";

import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string; // Para passar classes extras se precisar
}

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    // 1. Wrapper Externo: Garante scroll e padding
    <div className="h-full overflow-y-auto p-4 lg:p-8 scrollbar-thin scrollbar-thumb-primary/20">
      {/* 2. Wrapper Interno: Centraliza e limita a largura (container) */}
      <div
        className={`max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
