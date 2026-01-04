import { ReactNode } from 'react';
import LandingHeader from '@/components/landing/landingComponents/LandingHeader'; // Ajuste o caminho se necessário
import FooterContact from '@/components/ui/FooterContact';
// import Footer from '@/components/Footer'; // Se tiver footer, importe aqui

interface LandingLayoutProps {
  children: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <LandingHeader />
      
      <main className="flex-grow pt-20"> {/* pt-20 para compensar o header fixo */}
        {children}
      </main>
      <FooterContact />

    </div>
  );
}