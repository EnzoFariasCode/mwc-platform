import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Em Next.js 15, params é uma Promise.
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        profileImageBytes: true,
        profileImageType: true,
      },
    });

    if (!user || !user.profileImageBytes) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(user.profileImageBytes, {
      headers: {
        "Content-Type": user.profileImageType || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Erro API Imagem:", error);
    return new NextResponse(null, { status: 500 });
  }
}
