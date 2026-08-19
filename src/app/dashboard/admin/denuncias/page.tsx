import Link from "next/link";
import { AlertTriangle, ArrowRight, Flag, ShieldCheck } from "lucide-react";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { AdminPagination } from "@/modules/admin/components/AdminPagination";

const statusLabels = {
  OPEN: "Aberta",
  UNDER_REVIEW: "Em analise",
  RESOLVED: "Resolvida",
  DISMISSED: "Sem penalidade",
} as const;

const reasonLabels = {
  HARASSMENT: "Assedio ou comportamento abusivo",
  FRAUD: "Fraude ou tentativa de golpe",
  SPAM: "Spam",
  EXTERNAL_PAYMENT: "Pagamento externo",
  INAPPROPRIATE_CONTENT: "Conteudo inapropriado",
  THREAT: "Ameaca",
  OTHER: "Outro",
} as const;

const PAGE_SIZE = 25;

export default async function AdminChatReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminUser();
  const params = await searchParams;
  const requestedPage = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const [totalItems, statusCounts, priorityCount] = await Promise.all([
    db.chatReport.count(),
    db.chatReport.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.chatReport.count({
      where: {
        isPriority: true,
        status: { in: ["OPEN", "UNDER_REVIEW"] },
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const reports = await db.chatReport.findMany({
    orderBy: [{ isPriority: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      reason: true,
      description: true,
      status: true,
      isPriority: true,
      createdAt: true,
      reporter: { select: { name: true, displayName: true, email: true } },
      reportedUser: {
        select: { name: true, displayName: true, email: true },
      },
    },
  });

  const openCount =
    statusCounts.find((item) => item.status === "OPEN")?._count._all ?? 0;
  const reviewCount =
    statusCounts.find((item) => item.status === "UNDER_REVIEW")?._count._all ?? 0;

  return (
    <PageContainer>
      <div className="space-y-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </div>
            <h1 className="text-2xl font-bold text-white">
              Denuncias do chat Tech
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Analise relatos com a conversa preservada e registre toda decisao
              administrativa com justificativa.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Abertas" value={openCount} />
            <Metric label="Em analise" value={reviewCount} />
            <Metric label="Prioritarias" value={priorityCount} />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <Flag className="mb-4 h-10 w-10 text-slate-600" />
              <h2 className="font-bold text-white">Nenhuma denuncia registrada</h2>
              <p className="mt-2 text-sm text-slate-500">
                Novos relatos enviados pelo chat aparecerao aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/dashboard/admin/denuncias/${report.id}`}
                  className="group flex flex-col gap-4 p-5 transition-colors hover:bg-white/[0.03] md:flex-row md:items-center"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      report.isPriority
                        ? "bg-red-500/15 text-red-300"
                        : "bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {report.isPriority ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Flag className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white">
                        {reasonLabels[report.reason]}
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                        {statusLabels[report.status]}
                      </span>
                      {report.isPriority && (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">
                          Projeto financeiro ativo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {report.description}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Denunciante: {report.reporter.displayName || report.reporter.name} ({report.reporter.email}) · Denunciado: {report.reportedUser.displayName || report.reportedUser.name} ({report.reportedUser.email})
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                    {report.createdAt.toLocaleString("pt-BR")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-red-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
          <AdminPagination
            page={page}
            totalPages={totalPages}
            pathname="/dashboard/admin/denuncias"
          />
        </section>
      </div>
    </PageContainer>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
