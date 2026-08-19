import { db } from "@/lib/prisma";
import { getUserSession } from "@/lib/get-session";
import { canAccessAdminRoles } from "@/modules/admin/lib/admin-permissions";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const document = await db.professionalVerificationDocument.findUnique({
    where: { id },
    select: {
      bytes: true,
      mimeType: true,
      fileName: true,
      verification: { select: { professionalId: true } },
    },
  });

  if (!document) {
    return NextResponse.json(
      { error: "Documento nao encontrado." },
      { status: 404 },
    );
  }

  const isOwner = document.verification.professionalId === session.id;
  const isAuthorizedAdmin =
    session.userType === "ADMIN" &&
    canAccessAdminRoles(session.adminRole, ["OWNER", "SUPPORT"]);

  if (!isOwner && !isAuthorizedAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const disposition = document.mimeType === "application/pdf" ? "inline" : "inline";

  return new NextResponse(document.bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `${disposition}; filename="${document.fileName}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Security-Policy": "sandbox; default-src 'none';",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
