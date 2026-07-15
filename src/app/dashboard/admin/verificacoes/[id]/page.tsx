import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import {
  officialRegistryUrl,
  specialtyVerificationLabel,
  verificationStatusLabel,
} from "@/modules/health/lib/professional-verification-policy";
import { AdminVerificationActions } from "./AdminVerificationActions";

const documentLabels = {
  IDENTITY_DOCUMENT: "Documento oficial com foto",
  PROFESSIONAL_CREDENTIAL: "Carteira ou certidao profissional",
  QUALIFICATION_DOCUMENT: "Diploma ou certificado",
} as const;

export default async function AdminVerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole(["OWNER", "SUPPORT"]);
  const { id } = await params;
  const verification = await db.professionalVerification.findUnique({
    where: { id },
    include: {
      professional: { select: { id: true, name: true, displayName: true, email: true, phone: true, birthDate: true, city: true, state: true, teachingSubject: true, onlineSpecialty: true, isActive: true } },
      reviewer: { select: { name: true, email: true } },
      documents: { select: { id: true, type: true, fileName: true, mimeType: true, size: true, sha256: true, createdAt: true } },
    },
  });
  if (!verification) notFound();

  const isTeacher = verification.specialty === "TEACHER";
  const sourceUrl = verification.officialSourceUrl || officialRegistryUrl(verification.specialty);

  return (
    <PageContainer>
      <div className="space-y-6">
        <Link href="/dashboard/admin/verificacoes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Voltar para verificacoes</Link>
        <header className="rounded-lg border border-white/10 bg-slate-900/70 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#d73cbe]/10 text-[#d73cbe]"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold uppercase text-[#d73cbe]">{specialtyVerificationLabel(verification.specialty)}</p>
                <h1 className="mt-1 text-2xl font-bold text-white">{verification.professional.displayName || verification.professional.name}</h1>
                <p className="mt-1 text-sm text-slate-400">{verification.professional.email}</p>
              </div>
            </div>
            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300">{verificationStatusLabel(verification.status)}</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
            <h2 className="font-bold text-white">Identificacao e cadastro</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Data label="Nome legal" value={verification.professional.name} />
              <Data label="Telefone" value={verification.professional.phone || "Nao informado"} />
              <Data label="Nascimento" value={verification.professional.birthDate?.toLocaleDateString("pt-BR") || "Nao informado"} />
              <Data label="Localidade" value={[verification.professional.city, verification.professional.state].filter(Boolean).join(" / ") || "Nao informada"} />
              <Data label="Conta" value={verification.professional.isActive ? "Ativa" : "Suspensa"} />
              <Data label="Enviado em" value={verification.submittedAt?.toLocaleString("pt-BR") || "Rascunho"} />
            </dl>
          </section>

          <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
            <h2 className="font-bold text-white">Habilitacao declarada</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              {isTeacher ? <><Data label="Materia" value={verification.professional.teachingSubject || "Nao informada"} /><Data label="Formacao apresentada" value={verification.qualificationTitle || "Nao informada"} /></> : <><Data label="Conselho" value={verification.council} /><Data label="Regiao / UF" value={verification.registrationRegion || "Nao informada"} /><Data label="Numero" value={verification.registrationNumber || "Nao informado"} /><Data label="Consulta oficial" value={verification.officialCheckResult || "Pendente"} /></>}
            </dl>
            {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#d73cbe] hover:text-white"><ExternalLink className="h-4 w-4" /> Abrir cadastro oficial</a>}
          </section>
        </div>

        <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
          <h2 className="font-bold text-white">Documentos privados</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {verification.documents.map((document) => (
              <div key={document.id} className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 text-[#d73cbe]" /><div className="min-w-0 flex-1"><p className="font-bold text-white">{documentLabels[document.type]}</p><p className="mt-1 truncate text-xs text-slate-500">{document.fileName}</p><p className="mt-1 break-all text-[10px] text-slate-600">SHA-256: {document.sha256}</p></div></div>
                <a href={`/api/health/verification/document/${document.id}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white"><ExternalLink className="h-3.5 w-3.5" /> Visualizar documento</a>
              </div>
            ))}
          </div>
        </section>

        {verification.reviewReason && <section className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-5"><h2 className="font-bold text-amber-300">Ultima decisao</h2><p className="mt-2 text-sm text-amber-100/80">{verification.reviewReason}</p>{verification.reviewer && <p className="mt-2 text-xs text-amber-200/50">Por {verification.reviewer.name} ({verification.reviewer.email})</p>}</section>}

        <AdminVerificationActions verificationId={verification.id} status={verification.status} isTeacher={isTeacher} sourceUrl={sourceUrl} />
      </div>
    </PageContainer>
  );
}

function Data({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[10px] font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 text-slate-200">{value}</dd></div>;
}
