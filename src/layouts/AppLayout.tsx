import { Outlet } from 'react-router-dom';
import FooterContact from '../components/ui/FooterContact';
import StandardHeader from '../components/ui/StandardHeader'; // Importando o novo header

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 font-sans">
      
      {/* Header Novo */}
      <StandardHeader />
      
      {/* pt-20 para o conteúdo não ficar escondido atrás do header fixo */}
      <main className="flex-1 w-full pt-20">
        <Outlet />
      </main>

      <FooterContact />
    </div>
  );
}