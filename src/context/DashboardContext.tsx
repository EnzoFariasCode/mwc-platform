"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Removemos UserType e toggleUserType daqui porque agora a URL define isso
interface DashboardContextType {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  viewMode: "CLIENT" | "PROFESSIONAL";
  setViewMode: React.Dispatch<React.SetStateAction<"CLIENT" | "PROFESSIONAL">>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"CLIENT" | "PROFESSIONAL">("CLIENT");

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <DashboardContext.Provider
      value={{
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error(
      "useDashboard deve ser usado dentro de um DashboardProvider"
    );
  }
  return context;
}
