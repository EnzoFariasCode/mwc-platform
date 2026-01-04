import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex">
      
      <DashboardSidebar />

      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        
        <DashboardHeader />

        {/* Conteúdo Dinâmico (As páginas filhas entram aqui) */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
             {children}
          </div>
        </main>
        
      </div>

    </div>
  );
}