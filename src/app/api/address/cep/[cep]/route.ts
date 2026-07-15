import { auth } from "@/auth";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ cep: string }>;
};

type ViaCepResponse = {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const { cep: rawCep } = await params;
  const cep = rawCep.replace(/\D/g, "");

  if (!/^\d{8}$/.test(cep)) {
    return NextResponse.json(
      { error: "Informe um CEP valido com 8 digitos." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`ViaCEP respondeu com status ${response.status}.`);
    }

    const address = (await response.json()) as ViaCepResponse;

    if (address.erro) {
      return NextResponse.json(
        { error: "CEP nao encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      cep: address.cep || cep,
      address: address.logradouro?.trim() || "",
      neighborhood: address.bairro?.trim() || "",
      city: address.localidade?.trim() || "",
      state: address.uf?.trim().toUpperCase() || "",
    });
  } catch (error) {
    console.error("[CEP] Falha ao consultar ViaCEP:", error);
    return NextResponse.json(
      { error: "Nao foi possivel consultar o CEP agora." },
      { status: 502 },
    );
  }
}
