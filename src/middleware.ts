import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  // 1. Defina quais rotas são protegidas e quais são de auth
  const path = request.nextUrl.pathname;
  const isDashboardRoute = path.startsWith("/dashboard");
  const isAuthRoute = ["/login", "/cadastro", "/recuperar-senha"].includes(
    path
  );

  // 2. Pega o cookie de sessão
  const sessionCookie = request.cookies.get("session")?.value;

  // 3. Verifica a validade da sessão (Modo Leve - Sem Banco de Dados)
  let isValidSession = false;

  if (sessionCookie) {
    try {
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
      await jwtVerify(sessionCookie, secret, { algorithms: ["HS256"] });
      isValidSession = true;
    } catch (error) {
      isValidSession = false;
    }
  }

  // --- CENÁRIO 1: Usuário NÃO logado tentando acessar o Dashboard ---
  if (isDashboardRoute && !isValidSession) {
    const response = NextResponse.redirect(new URL("/login", request.nextUrl));
    if (sessionCookie) {
      response.cookies.delete("session");
    }
    return response;
  }

  // --- CENÁRIO 2: Usuário JÁ logado tentando acessar Login/Cadastro ---
  if (isAuthRoute && isValidSession) {
    return NextResponse.redirect(
      new URL("/dashboard/cliente", request.nextUrl)
    );
  }

  // Se estiver tudo certo, segue o fluxo normal
  return NextResponse.next();
}

// --- CORREÇÃO AQUI EMBAIXO ---
// Usamos o padrão oficial que ignora API, arquivos estáticos e favicon.
// Isso resolve o erro "Capturing groups are not allowed".
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
