import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  FileText,
  Mail,
  MapPin,
  NotebookPen,
} from "lucide-react";
import { listProfessionalClientRecords } from "@/modules/health/actions/client-record-actions";

const specialtyLabel: Record<string, string> = {
  PSYCHOLOGIST: "Psicologia",
  NUTRITIONIST: "Nutricao",
  PERSONAL_TRAINER: "Personal Trainer",
  LAWYER: "Advocacia",
  ENGLISH_TEACHER: "Ingles",
};

const specialtyColor: Record<string, string> = {
  PSYCHOLOGIST: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  NUTRITIONIST: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  PERSONAL_TRAINER: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  LAWYER: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  ENGLISH_TEACHER: "bg-[#d73cbe]/10 text-[#d73cbe] border-[#d73cbe]/20",
};

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(date),
  );
}

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

  const records = result.records ?? [];

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

        {records.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {records.map((record) => {
              const colorClass =
                specialtyColor[record.specialty] ??
                "bg-white/10 text-slate-300 border-white/10";
              const label = specialtyLabel[record.specialty] ?? record.specialty;

              return (
                <Link
                  key={record.id}
                  href={`/agendar-consulta/prontuario/${record.patientId}`}
                  className="group flex flex-col gap-4 rounded-xl border border-white/5 bg-[#0f172a]/80 p-5 transition-all hover:border-[#d73cbe]/20 hover:bg-[#0f172a]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d73cbe]/20 bg-[#d73cbe]/10 text-[#d73cbe]">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold leading-tight text-white transition-colors group-hover:text-[#d73cbe]">
                          {record.patientName}
                        </p>
                        {record.patientCity && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" />
                            {record.patientCity}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass}`}
                    >
                      {label}
                    </span>
                  </div>

                  {record.chiefComplaint && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">
                      {record.chiefComplaint}
                    </p>
                  )}

                  <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <NotebookPen className="h-3.5 w-3.5" />
                      {record.totalNotes}{" "}
                      {record.totalNotes === 1 ? "nota" : "notas"}
                    </span>
                    {record.lastSessionDate ? (
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Ultima sessao: {formatDate(record.lastSessionDate)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {record.patientEmail}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
