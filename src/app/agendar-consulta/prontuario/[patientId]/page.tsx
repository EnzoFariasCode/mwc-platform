import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getOrCreateClientRecord } from "@/modules/health/actions/client-record-actions";
import { ClientRecordForm } from "@/modules/health/components/prontuario/client-record-form";
import { SessionNotesList } from "@/modules/health/components/prontuario/session-notes-list";
import { AddSessionNoteForm } from "@/modules/health/components/prontuario/add-session-note-form";
import { PatientInfoCard } from "@/modules/health/components/prontuario/patient-info-card";

type Props = {
  params: Promise<{ patientId: string }>;
};

const specialtyLabel: Record<string, string> = {
  PSYCHOLOGIST: "Psicologia",
  NUTRITIONIST: "Nutricao",
  PERSONAL_TRAINER: "Personal Trainer",
  LAWYER: "Advocacia",
  ENGLISH_TEACHER: "Ingles",
};

export default async function ProntuarioPage({ params }: Props) {
  const { patientId } = await params;
  const session = await auth();

  if (
    !session?.user?.id ||
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    redirect("/agendar-consulta/dashboard-profissional");
  }

  const hasPatientRelationship = await db.appointment.findFirst({
    where: {
      professionalId: session.user.id,
      patientId,
    },
    select: { id: true },
  });

  if (!hasPatientRelationship) {
    redirect("/agendar-consulta/dashboard-profissional");
  }

  const result = await getOrCreateClientRecord(patientId);

  if (!result.success || !result.record) {
    redirect("/agendar-consulta/dashboard-profissional");
  }

  const record = result.record;
  const label = specialtyLabel[record.specialty] ?? record.specialty;

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
                  Prontuario
                </span>
                <span className="inline-flex items-center rounded-full border border-[#d73cbe]/20 bg-[#d73cbe]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d73cbe]">
                  {label}
                </span>
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
                {record.patientName}
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Criado em{" "}
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
              new Date(record.createdAt),
            )}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            <ClientRecordForm record={record} />
            <AddSessionNoteForm
              clientRecordId={record.id}
              patientId={patientId}
            />
            <SessionNotesList notes={record.sessionNotes} />
          </div>
          <div>
            <PatientInfoCard record={record} />
          </div>
        </div>
      </div>
    </div>
  );
}
