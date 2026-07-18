"use client";

import Link from "next/link";

export default function ProfessionalProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white">
      <div className="max-w-md text-center" role="alert">
        <h1 className="font-futura text-2xl font-bold uppercase">
          Não foi possível carregar o perfil
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Ocorreu uma falha temporária. Tente novamente em instantes.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-[#d73cbe] px-5 py-3 text-sm font-bold transition-colors hover:bg-[#b02b9b]"
          >
            Tentar novamente
          </button>
          <Link
            href="/agendar-consulta"
            className="rounded-lg border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Ver especialidades
          </Link>
        </div>
      </div>
    </main>
  );
}
