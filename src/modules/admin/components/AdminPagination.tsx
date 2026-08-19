import Link from "next/link";

export function AdminPagination({
  page,
  totalPages,
  pathname,
}: {
  page: number;
  totalPages: number;
  pathname: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginacao"
      className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4 text-sm"
    >
      <Link
        href={`${pathname}?page=${Math.max(1, page - 1)}`}
        aria-disabled={page === 1}
        className={`rounded-lg border border-white/10 px-4 py-2 font-bold ${
          page === 1
            ? "pointer-events-none text-slate-700"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        Anterior
      </Link>
      <span className="text-slate-500">
        Pagina {page} de {totalPages}
      </span>
      <Link
        href={`${pathname}?page=${Math.min(totalPages, page + 1)}`}
        aria-disabled={page === totalPages}
        className={`rounded-lg border border-white/10 px-4 py-2 font-bold ${
          page === totalPages
            ? "pointer-events-none text-slate-700"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        Proxima
      </Link>
    </nav>
  );
}
