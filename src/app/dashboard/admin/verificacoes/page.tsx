import Link from "next/link";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import {
  specialtyVerificationLabel,
  verificationStatusLabel,
} from "@/modules/health/lib/professional-verification-policy";

export default async function AdminVerificationsPage() {
  await requireAdminRole(["OWNER", "SUPPORT"]);

  const verifications = await db.professionalVerification.findMany({
    where: { status: { not: "DRAFT" } },
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
    take: 100,
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

  const pending = verifications.filter((item) =>
    ["PENDING", "UNDER_REVIEW"].includes(item.status),
  ).length;

  return (
    <PageContainer>
      <div className="space-y-7">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d73cbe]/20 bg-[#d73cbe]/10 px-3 py-1 text-xs font-bold uppercase text-[#d73cbe]">
              <ShieldCheck className="h-3.5 w-3.5" /> MWC Online
            </div>
            <h1 className="mt-3 text-2xl font-bold text-white">Verificacoes profissionais</h1>
            <p className="mt-1 text-sm text-slate-400">
              Analise documentos, consulte o conselho oficial e libere o profissional.
            </p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <p className="text-xs font-bold uppercase text-amber-300">Aguardando</p>
            <p className="mt-1 text-2xl font-bold text-white">{pending}</p>
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/70">
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
        </section>
      </div>
    </PageContainer>
  );
}
