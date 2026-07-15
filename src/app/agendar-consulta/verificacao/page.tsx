import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { ProfessionalVerificationForm } from "@/modules/health/components/professional-verification-form";
import {
  expectedCouncilForSpecialty,
  specialtyVerificationLabel,
} from "@/modules/health/lib/professional-verification-policy";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProfessionalVerificationPage() {
  const session = await auth();
  if (
    !session?.user?.id ||
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    redirect("/portal");
  }

  const professional = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      onlineSpecialty: true,
      teachingSubject: true,
      professionalVerification: {
        select: {
          id: true,
          status: true,
          council: true,
          registrationNumber: true,
          registrationRegion: true,
          qualificationTitle: true,
          reviewReason: true,
          submittedAt: true,
          verifiedAt: true,
          expiresAt: true,
          documents: {
            select: { id: true, type: true, fileName: true, size: true },
          },
        },
      },
    },
  });

  if (!professional?.onlineSpecialty) {
    redirect("/agendar-consulta/dashboard-profissional");
  }

  const verification = professional.professionalVerification;

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-7">
        <Link href="/agendar-consulta/dashboard-profissional" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>
        <header className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#d73cbe]/10 text-[#d73cbe]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#d73cbe]">MWC Online</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">Verificacao profissional</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Categoria: {specialtyVerificationLabel(professional.onlineSpecialty)}. Seus documentos sao privados e acessiveis somente por voce e pela equipe autorizada de verificacao.
            </p>
          </div>
        </header>
        <ProfessionalVerificationForm
          specialty={professional.onlineSpecialty}
          teachingSubject={professional.teachingSubject}
          council={verification?.council ?? expectedCouncilForSpecialty(professional.onlineSpecialty)}
          verification={verification ? {
            ...verification,
            submittedAt: verification.submittedAt?.toISOString() ?? null,
            verifiedAt: verification.verifiedAt?.toISOString() ?? null,
            expiresAt: verification.expiresAt?.toISOString() ?? null,
          } : null}
        />
      </div>
    </main>
  );
}
