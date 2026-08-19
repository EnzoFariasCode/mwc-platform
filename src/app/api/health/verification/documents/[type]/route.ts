import { createHash } from "crypto";
import { db } from "@/lib/prisma";
import { getUserSession } from "@/lib/get-session";
import {
  canProfessionalEditVerification,
  expectedCouncilForSpecialty,
  requiredVerificationDocuments,
} from "@/modules/health/lib/professional-verification-policy";
import {
  safeVerificationFileName,
  validateVerificationFile,
} from "@/modules/health/lib/verification-file";
import type { ProfessionalVerificationDocumentType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ type: string }> };

function isDocumentType(
  value: string,
): value is ProfessionalVerificationDocumentType {
  return [
    "IDENTITY_DOCUMENT",
    "PROFESSIONAL_CREDENTIAL",
    "QUALIFICATION_DOCUMENT",
  ].includes(value);
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await getUserSession();

  if (
    !session ||
    session.userType !== "PROFESSIONAL" ||
    session.industry !== "HEALTH"
  ) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const { type } = await params;
  if (!isDocumentType(type)) {
    return NextResponse.json(
      { error: "Tipo de documento invalido." },
      { status: 400 },
    );
  }

  const professional = await db.user.findUnique({
    where: { id: session.id },
    select: {
      onlineSpecialty: true,
      professionalVerification: {
        select: { id: true, specialty: true, status: true },
      },
    },
  });

  if (!professional?.onlineSpecialty) {
    return NextResponse.json(
      { error: "Defina sua categoria profissional primeiro." },
      { status: 400 },
    );
  }

  if (!requiredVerificationDocuments(professional.onlineSpecialty).includes(type)) {
    return NextResponse.json(
      { error: "Documento incompativel com sua categoria." },
      { status: 400 },
    );
  }

  const existing = professional.professionalVerification;
  if (existing && !canProfessionalEditVerification(existing.status)) {
    return NextResponse.json(
      { error: "Esta verificacao nao pode ser alterada agora." },
      { status: 409 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Selecione um arquivo." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const validationError = validateVerificationFile({
    mimeType: file.type,
    bytes,
  });

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const verification = await db.$transaction(async (tx) => {
    let verificationId = existing?.id;

    if (existing && existing.specialty !== professional.onlineSpecialty) {
      await tx.professionalVerification.delete({ where: { id: existing.id } });
      verificationId = undefined;
    }

    if (!verificationId) {
      const created = await tx.professionalVerification.create({
        data: {
          professionalId: session.id,
          specialty: professional.onlineSpecialty!,
          council: expectedCouncilForSpecialty(professional.onlineSpecialty!),
        },
        select: { id: true },
      });
      verificationId = created.id;
    }

    const document = await tx.professionalVerificationDocument.upsert({
      where: {
        verificationId_type: { verificationId, type },
      },
      create: {
        verificationId,
        type,
        fileName: safeVerificationFileName(file.name),
        mimeType: file.type,
        size: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        bytes,
      },
      update: {
        fileName: safeVerificationFileName(file.name),
        mimeType: file.type,
        size: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        bytes,
      },
      select: { id: true, type: true, fileName: true, size: true },
    });

    return { verificationId, document };
  });

  revalidatePath("/agendar-consulta/verificacao");
  revalidatePath("/agendar-consulta/dashboard-profissional");

  return NextResponse.json({ success: true, ...verification });
}
