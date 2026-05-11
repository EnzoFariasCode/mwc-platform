import { NextResponse } from "next/server";
import { auth } from "@/auth";

// 🛡️ Blindagem de tipos para o usuário da sessão
// Estendemos o tipo base para garantir que o TS reconheça nossas propriedades customizadas
interface ExtendedAuthUser {
  id?: string;
  userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  industry?: "TECH" | "HEALTH";
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export default auth((req) => {
  const path = req.nextUrl.pathname;

  // 1. Definição de Rotas Críticas
  const isAuthRoute = ["/login", "/cadastro", "/recuperarsenha"].includes(path);

  // Proteção total: Dashboard antigo, Novo Portal e Área de Saúde
  const isProtectedRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/portal") ||
    path.startsWith("/agendar-consulta/dashboard-profissional") ||
    path.startsWith("/agendar-consulta/historico");

  // No Next-Auth v5, a sessão fica em req.auth
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user as ExtendedAuthUser | undefined;

  // 2. Bloqueio de Segurança: Acesso Protegido sem Login
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 3. Regras de Negócio: Usuário Logado tentando acessar Login/Cadastro
  if (isAuthRoute && isLoggedIn && user) {
    // Redirecionamento Inteligente baseado no Perfil e Indústria

    // Profissional de Saúde
    if (user.userType === "PROFESSIONAL" && user.industry === "HEALTH") {
      return NextResponse.redirect(
        new URL("/agendar-consulta/dashboard-profissional", req.nextUrl),
      );
    }

    // Profissional de Tecnologia
    if (user.userType === "PROFESSIONAL" && user.industry === "TECH") {
      return NextResponse.redirect(
        new URL("/dashboard/profissional", req.nextUrl),
      );
    }

    // Fallback para Clientes/Pacientes ou outros -> Portal
    return NextResponse.redirect(new URL("/portal", req.nextUrl));
  }

  return NextResponse.next();
});

// ⚙️ Matcher: Define onde o Proxy deve atuar (Ignora arquivos estáticos e APIs)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
