export default function DashboardHome() {
  return (
    <div className="space-y-6">
      
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-futura">Visão Geral</h1>
          <p className="text-[var(--text-muted)]">Bem-vindo de volta, João!</p>
        </div>
        <button className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20">
          + Novo Projeto
        </button>
      </div>

      {/* Exemplo de Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <h3 className="text-[var(--text-muted)] text-sm font-medium mb-2">Ganhos Totais</h3>
            <p className="text-3xl font-bold text-white font-futura">R$ 1.250,00</p>
        </div>
        {/* Card 2 */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <h3 className="text-[var(--text-muted)] text-sm font-medium mb-2">Projetos Ativos</h3>
            <p className="text-3xl font-bold text-white font-futura">3</p>
        </div>
        {/* Card 3 */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <h3 className="text-[var(--text-muted)] text-sm font-medium mb-2">Propostas Enviadas</h3>
            <p className="text-3xl font-bold text-white font-futura">12</p>
        </div>
      </div>

      {/* Espaço vazio para conteúdo futuro */}
      <div className="h-64 rounded-2xl border-2 border-dashed border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
        Área de Feed / Atividades Recentes
      </div>

    </div>
  );
}