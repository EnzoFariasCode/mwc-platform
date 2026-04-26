import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

type MiddlewareAuthUser = {
  id?: string;
  userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  industry?: "TECH" | "HEALTH";
};

type MiddlewareRequest = NextRequest & {
  auth?: {
    user?: MiddlewareAuthUser;
  };
};

export default auth((request: MiddlewareRequest) => {
  const path = request.nextUrl.pathname;

  // 1. Definição de Rotas
  const isAuthRoute = ["/login", "/cadastro", "/recuperarsenha"].includes(path);
  // Protege tanto o dashboard antigo quanto o novo portal e área logada de saúde
  const isProtectedRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/portal") ||
    path.startsWith("/agendar-consulta/dashboard-profissional") ||
    path.startsWith("/agendar-consulta/historico");

  const user = request.auth?.user;
  const isLoggedIn = !!user?.id;

  // 2. Se tentar acessar área protegida sem estar logado -> Login
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // 3. Se estiver logado e tentar acessar Login/Cadastro -> Redirecionamento Inteligente
  if (isAuthRoute && isLoggedIn) {
    // Profissional de Saúde
    if (user.userType === "PROFESSIONAL" && user.industry === "HEALTH") {
      return NextResponse.redirect(
        new URL("/agendar-consulta/dashboard-profissional", request.nextUrl),
      );
    }
    // Profissional de Tecnologia
    if (user.userType === "PROFESSIONAL" && user.industry === "TECH") {
      return NextResponse.redirect(
        new URL("/dashboard/profissional", request.nextUrl),
      );
    }
    // Clientes/Pacientes ou outros -> Portal
    return NextResponse.redirect(new URL("/portal", request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
