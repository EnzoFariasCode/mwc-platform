import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/get-session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const access = await getAdminAccess(["OWNER", "FINANCE"]);

  if (access.status === "UNAUTHENTICATED") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  if (access.status === "FORBIDDEN") {
    return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { id } = await params;
  const receipts = await db.$queryRaw<
    Array<{
      receiptFileBytes: Buffer | null;
      receiptFileType: string | null;
      receiptFileName: string | null;
    }>
  >`
    SELECT "receiptFileBytes", "receiptFileType", "receiptFileName"
    FROM "AdminAuditLog"
    WHERE "id" = ${id}
    LIMIT 1
  `;
  const receipt = receipts[0];

  if (!receipt?.receiptFileBytes || !receipt.receiptFileType) {
    return NextResponse.json(
      { error: "Comprovante nao encontrado." },
      { status: 404 },
    );
  }

  return new NextResponse(receipt.receiptFileBytes as unknown as BodyInit, {
    headers: {
      "Content-Type": receipt.receiptFileType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        receipt.receiptFileName || "comprovante",
      )}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
