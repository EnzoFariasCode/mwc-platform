import StandardHeader from '@/components/ui/StandardHeader';
// import FooterContact from '@/modules/landing/landingComponents/FooterContact'; // Podemos reutilizar o footer se quiser

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* O Header Padrão do Sistema */}
      <StandardHeader />
      
      {/* O conteúdo da página com padding-top para não ficar embaixo do header fixo */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* Se quiser o footer em todas as páginas internas, descomente abaixo */}
      {/* <FooterContact /> */}
    </div>
  );
}
