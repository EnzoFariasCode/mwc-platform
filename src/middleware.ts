import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

// --- MUDANÇA AQUI: Adicionado 'default' ---
export default async function middleware(request: NextRequest) {
  // 1. Defina quais rotas são protegidas
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = ["/login", "/cadastro", "/esqueci-senha"].includes(
    request.nextUrl.pathname
  );

  // 2. Pega o cookie de sessão
  const cookie = request.cookies.get("session")?.value;

  // 3. Verifica a validade da sessão
  // Se não tiver cookie, nem tenta validar, já considera nulo
  const session = cookie ? await verifySession(cookie) : null;

  // --- CENÁRIO 1: Usuário NÃO logado tentando acessar o Dashboard ---
  if (isDashboardRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // --- CENÁRIO 2: Usuário JÁ logado tentando acessar Login/Cadastro ---
  if (isAuthRoute && session?.sub) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  // Se estiver tudo certo, segue o fluxo normal
  return NextResponse.next();
}

// Configuração para o Middleware não rodar em arquivos estáticos
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
