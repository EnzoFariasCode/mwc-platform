import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ROTA GET: Busca a imagem do banco e exibe no navegador (MANTIDA INTACTA)
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
    console.error("Erro API Imagem GET:", error);
    return new NextResponse(null, { status: 500 });
  }
}

// NOVA ROTA POST: Recebe o arquivo do Front-end e salva no banco
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Extrai o formulário da requisição
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 },
      );
    }

    // --- 🛡️ TRAVA DE SEGURANÇA: LIMITE DE 2MB ---
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB em bytes

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "A imagem é muito grande. O tamanho máximo permitido é 2MB." },
        { status: 400 },
      );
    }
    // ---------------------------------------------

    // Converte o arquivo (File) para Buffer (formato que o Prisma entende para campos Bytes)
    const buffer = Buffer.from(await file.arrayBuffer());

    // Atualiza o usuário no banco de dados
    await db.user.update({
      where: { id },
      data: {
        profileImageBytes: buffer,
        profileImageType: file.type, // Salva se é image/png, image/jpeg, etc.
      },
    });

    return NextResponse.json({
      success: true,
      message: "Imagem salva com sucesso!",
    });
  } catch (error) {
    console.error("Erro API Imagem POST:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar a imagem" },
      { status: 500 },
    );
  }
}
