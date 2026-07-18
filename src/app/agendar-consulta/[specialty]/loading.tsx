export default function SpecialtyLoading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-b-[#d73cbe]" />
        <p className="text-sm text-slate-400">Carregando especialistas...</p>
      </div>
    </main>
  );
}
