"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type UserType = "client" | "professional";

interface DashboardContextType {
  userType: UserType;
  toggleUserType: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType>("professional"); // Padrão
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleUserType = () => {
    setUserType((prev) =>
      prev === "professional" ? "client" : "professional"
    );
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <DashboardContext.Provider
      value={{
        userType,
        toggleUserType,
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
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
