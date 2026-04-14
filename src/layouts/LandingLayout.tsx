import { ReactNode } from "react";
import LandingHeader from "@/modules/landing/landingComponents/LandingHeader"; // Ajuste o caminho se necessário
import FooterContact from "@/components/ui/FooterContact";

interface LandingLayoutProps {
  children: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <LandingHeader />
      <main className="flex-grow"> {children}</main>
      <FooterContact />
    </div>
  );
}
