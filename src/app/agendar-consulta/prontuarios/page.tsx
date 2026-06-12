import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import { listProfessionalClientRecords } from "@/modules/health/actions/client-record-actions";
import { ClientRecordsList } from "@/modules/health/components/prontuario/client-records-list";

export default async function ProntuariosPage() {
  const session = await auth();

  if (
    !session?.user?.id ||
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    redirect("/agendar-consulta/dashboard-profissional");
  }

  const result = await listProfessionalClientRecords();

  if (!result.success) {
    redirect("/agendar-consulta/dashboard-profissional");
  }

  const records = (result.records ?? []).map((record) => ({
    ...record,
    lastSessionDate: record.lastSessionDate?.toISOString() ?? null,
    lastLegalActivityDate: record.lastLegalActivityDate?.toISOString() ?? null,
    updatedAt: record.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-10 font-poppins text-white selection:bg-[#d73cbe]/30">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/agendar-consulta/dashboard-profissional"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Voltar para o painel profissional"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="mb-1 flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#d73cbe]" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  MWC Online Saude
                </span>
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
                Prontuarios
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            {records.length}{" "}
            {records.length === 1
              ? "paciente registrado"
              : "pacientes registrados"}
          </p>
        </div>

        {records.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-24 text-center">
            <div className="mb-5 rounded-full bg-white/5 p-5">
              <BookOpen className="h-8 w-8 text-slate-600" />
            </div>
            <p className="font-medium text-slate-400">
              Nenhum prontuario registrado ainda.
            </p>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Os prontuarios sao criados automaticamente quando voce acessa o
              botao Prontuario dentro de uma consulta agendada.
            </p>
          </div>
        )}

        {records.length > 0 && <ClientRecordsList records={records} />}
      </div>
    </div>
  );
}
