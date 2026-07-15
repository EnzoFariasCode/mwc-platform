"use client";

import { submitProfessionalVerification } from "@/modules/health/actions/professional-verification-actions";
import {
  canProfessionalEditVerification,
  verificationStatusLabel,
} from "@/modules/health/lib/professional-verification-policy";
import type {
  HealthSpecialty,
  ProfessionalCouncil,
  ProfessionalVerificationDocumentType,
  ProfessionalVerificationStatus,
} from "@prisma/client";
import {
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileUp,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type DocumentItem = {
  id: string;
  type: ProfessionalVerificationDocumentType;
  fileName: string;
  size: number;
};

type VerificationData = {
  id: string;
  status: ProfessionalVerificationStatus;
  council: ProfessionalCouncil;
  registrationNumber: string | null;
  registrationRegion: string | null;
  qualificationTitle: string | null;
  reviewReason: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  documents: DocumentItem[];
} | null;

const documentLabels: Record<ProfessionalVerificationDocumentType, string> = {
  IDENTITY_DOCUMENT: "Documento oficial com foto",
  PROFESSIONAL_CREDENTIAL: "Carteira ou certidao profissional",
  QUALIFICATION_DOCUMENT: "Diploma ou certificado",
};

function fileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.ceil(size / 1024)} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function ProfessionalVerificationForm({
  specialty,
  teachingSubject,
  council,
  verification,
}: {
  specialty: HealthSpecialty;
  teachingSubject: string | null;
  council: ProfessionalCouncil;
  verification: VerificationData;
}) {
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
  const [uploadingType, setUploadingType] =
    useState<ProfessionalVerificationDocumentType | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>(
    verification?.documents ?? [],
  );
  const editable = canProfessionalEditVerification(verification?.status);
  const isTeacher = specialty === "TEACHER";
  const requiredTypes: ProfessionalVerificationDocumentType[] = isTeacher
    ? ["IDENTITY_DOCUMENT", "QUALIFICATION_DOCUMENT"]
    : ["IDENTITY_DOCUMENT", "PROFESSIONAL_CREDENTIAL"];

  async function uploadDocument(
    type: ProfessionalVerificationDocumentType,
    file: File,
  ) {
    setUploadingType(type);
    const formData = new FormData();
    formData.set("file", file);

    try {
      const response = await fetch(
        `/api/health/verification/documents/${type}`,
        { method: "POST", body: formData },
      );
      const result = (await response.json()) as {
        error?: string;
        document?: DocumentItem;
      };

      if (!response.ok || !result.document) {
        throw new Error(result.error || "Nao foi possivel enviar o arquivo.");
      }

      setDocuments((current) => [
        ...current.filter((document) => document.type !== type),
        result.document!,
      ]);
      toast.success("Documento enviado com seguranca.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no envio.");
    } finally {
      setUploadingType(null);
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitProfessionalVerification(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Documentos enviados para analise.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#d73cbe]/10 text-[#d73cbe]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">
                Situacao da verificacao
              </p>
              <h2 className="text-lg font-bold text-white">
                {verificationStatusLabel(verification?.status)}
              </h2>
            </div>
          </div>
          {verification?.verifiedAt && (
            <span className="text-xs text-emerald-300">
              Aprovado em {new Date(verification.verifiedAt).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>

        {verification?.reviewReason && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <strong className="block text-amber-300">Retorno da analise</strong>
            <p className="mt-1">{verification.reviewReason}</p>
          </div>
        )}
      </section>

      <form action={handleSubmit} className="space-y-6">
        <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5 md:p-6">
          <h2 className="text-lg font-bold text-white">Dados profissionais</h2>
          <p className="mt-1 text-sm text-slate-400">
            O nome dos documentos deve corresponder ao nome cadastrado na MWC.
          </p>

          {isTeacher ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Materia ou area de ensino">
                <input value={teachingSubject || "Nao informada"} readOnly className="h-11 w-full rounded-lg border border-white/5 bg-slate-950/50 px-3 text-sm text-slate-500 outline-none" />
              </Field>
              <Field label="Formacao ou certificacao apresentada">
                <input
                  name="qualificationTitle"
                  defaultValue={verification?.qualificationTitle || ""}
                  disabled={!editable}
                  required
                  placeholder="Ex: Licenciatura em Matematica"
                  className="h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-[#d73cbe] disabled:text-slate-500"
                />
              </Field>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Field label="Conselho">
                <input value={council} readOnly className="h-11 w-full rounded-lg border border-white/5 bg-slate-950/50 px-3 text-sm text-slate-500 outline-none" />
              </Field>
              <Field label="Regiao / UF">
                <input
                  name="registrationRegion"
                  defaultValue={verification?.registrationRegion || ""}
                  disabled={!editable}
                  required
                  maxLength={12}
                  placeholder="Ex: 06 ou SP"
                  className="h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm uppercase text-white outline-none focus:border-[#d73cbe] disabled:text-slate-500"
                />
              </Field>
              <Field label="Numero do registro">
                <input
                  name="registrationNumber"
                  defaultValue={verification?.registrationNumber || ""}
                  disabled={!editable}
                  required
                  maxLength={50}
                  placeholder="Somente o numero"
                  className="h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-[#d73cbe] disabled:text-slate-500"
                />
              </Field>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5 md:p-6">
          <h2 className="text-lg font-bold text-white">Documentos privados</h2>
          <p className="mt-1 text-sm text-slate-400">
            PDF, JPG, PNG ou WEBP, com no maximo 5 MB por arquivo.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {requiredTypes.map((type) => {
              const document = documents.find((item) => item.type === type);
              return (
                <div key={type} className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{documentLabels[type]}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {document ? `${document.fileName} - ${fileSize(document.size)}` : "Arquivo pendente"}
                      </p>
                    </div>
                    {document ? <FileCheck2 className="h-5 w-5 text-emerald-400" /> : <FileUp className="h-5 w-5 text-slate-500" />}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {document && (
                      <a
                        href={`/api/health/verification/document/${document.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Visualizar
                      </a>
                    )}
                    {editable && (
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#d73cbe] px-3 py-2 text-xs font-bold text-white hover:bg-[#b02da0]">
                        {uploadingType === type ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
                        {document ? "Substituir" : "Enviar"}
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png,image/webp"
                          className="sr-only"
                          disabled={uploadingType !== null}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) uploadDocument(type, file);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {editable && (
          <section className="rounded-lg border border-[#d73cbe]/20 bg-[#d73cbe]/5 p-5">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
              <input type="checkbox" name="privacyAccepted" value="true" required className="mt-1 h-4 w-4 accent-[#d73cbe]" />
              <span>
                Confirmo que os documentos sao autenticos e autorizo seu tratamento exclusivamente para verificacao de identidade e habilitacao profissional, conforme a politica de privacidade da MWC.
              </span>
            </label>
            <button
              type="submit"
              disabled={isSubmitting || uploadingType !== null}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#d73cbe] px-5 py-3 text-sm font-bold text-white hover:bg-[#b02da0] disabled:cursor-wait disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Enviar para analise
            </button>
          </section>
        )}
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}
