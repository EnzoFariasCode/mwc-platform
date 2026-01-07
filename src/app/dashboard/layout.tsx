"use client";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { DashboardProvider } from "@/context/DashboardContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      {/* Viewport raiz */}
      <div className="h-screen h-[100dvh] flex bg-slate-950 overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Coluna principal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header fixo */}
          <DashboardHeader />

          {/* 
            Área de conteúdo
            ❗ NÃO define padding
            ❗ NÃO define scroll
            Cada página decide como se comporta
          */}
          <main className="flex-1 min-h-0 relative">{children}</main>
        </div>
      </div>
    </DashboardProvider>
  );
}
