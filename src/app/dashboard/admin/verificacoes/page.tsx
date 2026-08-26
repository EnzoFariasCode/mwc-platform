import Link from "next/link";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import {
  specialtyVerificationLabel,
  verificationStatusLabel,
} from "@/modules/health/lib/professional-verification-policy";
import { AdminPagination } from "@/modules/admin/components/AdminPagination";
import { AdminPageHeader } from "@/modules/admin/components/AdminPageHeader";
import { AdminMetricCard } from "@/modules/admin/components/AdminMetricCard";

const PAGE_SIZE = 25;

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminRole(["OWNER", "SUPPORT"]);
  const params = await searchParams;
  const requestedPage = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const where = { status: { not: "DRAFT" as const } };
  const [totalItems, pending] = await Promise.all([
    db.professionalVerification.count({ where }),
    db.professionalVerification.count({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const verifications = await db.professionalVerification.findMany({
    where,
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      status: true,
      specialty: true,
      council: true,
      registrationNumber: true,
      submittedAt: true,
      updatedAt: true,
      professional: { select: { name: true, email: true } },
      _count: { select: { documents: true } },
    },
  });

  return (
    <PageContainer>
      <div className="space-y-8">
        <AdminPageHeader
          eyebrow="MWC Online"
          title="Verificações profissionais"
          description="Analise documentos, consulte o conselho oficial e libere o profissional para receber agendamentos."
          icon={ShieldCheck}
          actions={
            <div className="w-full min-w-44 sm:w-auto">
              <AdminMetricCard
                label="Aguardando análise"
                value={pending}
                icon={FileCheck2}
                tone="warning"
              />
            </div>
          }
        />

        <section className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-white/10 bg-slate-950 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Profissional</th>
                  <th className="px-5 py-4">Categoria</th>
                  <th className="px-5 py-4">Registro</th>
                  <th className="px-5 py-4">Documentos</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Analise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {verifications.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <p className="font-bold text-white">{item.professional.name}</p>
                      <p className="text-xs text-slate-500">{item.professional.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{specialtyVerificationLabel(item.specialty)}</td>
                    <td className="px-5 py-4 text-slate-300">
                      {item.council === "NOT_APPLICABLE" ? "Nao se aplica" : `${item.council} ${item.registrationNumber || "-"}`}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{item._count.documents}/2</td>
                    <td className="px-5 py-4">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300">
                        {verificationStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/dashboard/admin/verificacoes/${item.id}`} className="inline-flex items-center gap-2 rounded-lg bg-[#d73cbe]/10 px-3 py-2 text-xs font-bold text-[#d73cbe] hover:bg-[#d73cbe] hover:text-white">
                        <FileCheck2 className="h-3.5 w-3.5" /> Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {verifications.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Nenhuma verificacao enviada.</p>}
          <AdminPagination
            page={page}
            totalPages={totalPages}
            pathname="/dashboard/admin/verificacoes"
          />
        </section>
      </div>
    </PageContainer>
  );
}
