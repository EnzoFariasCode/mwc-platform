"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import logoImg from "@/assets/images/landingPage/logo.png";

export function WelcomeModal() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => setIsOpen(false), 300);
  };

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      handleClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted || !isOpen) return null;

  const modal = (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "animate-in fade-in"
      }`}
    >
      <div
        className={`bg-card border border-border shadow-2xl shadow-primary/10 rounded-3xl p-10 max-w-md md:max-w-lg w-full mx-4 flex flex-col items-center text-center transition-all duration-300 ease-out ${
          isClosing
            ? "-translate-y-24 opacity-0"
            : "animate-in slide-in-from-top-64 fade-in"
        }`}
      >
        <div className="w-40 h-auto mb-6">
          <Image
            src={logoImg}
            alt="MWC Logo"
            width={128}
            height={128}
            className="object-contain"
            priority
          />
        </div>

        <h2 className="text-2xl font-bold text-foreground font-futura mb-2">
          Bem-vindo à MWC!
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Conectando você aos melhores profissionais.
        </p>

        <button
          onClick={handleClose}
          className="cursor-pointer w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5"
        >
          Acessar Plataforma
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
