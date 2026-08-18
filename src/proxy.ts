import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canAccessProfessionalSectorRoute,
  getAccountDashboardPath,
  getPostLoginPath,
  getRequiredProfessionalIndustry,
} from "@/modules/auth/lib/account-access";

interface ExtendedAuthUser {
  id?: string;
  userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  industry?: "TECH" | "HEALTH";
  isActive?: boolean;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isAuthRoute = ["/login", "/cadastro", "/recuperarsenha"].includes(
    path,
  );
  const isProtectedRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/portal") ||
    path.startsWith("/checkout-saude") ||
    path.startsWith("/agendar-consulta/historico") ||
    path.startsWith("/agendar-consulta/meu-perfil") ||
    getRequiredProfessionalIndustry(path) !== null;

  const isLoggedIn = Boolean(req.auth);
  const user = req.auth?.user as ExtendedAuthUser | undefined;

  if (isLoggedIn && user?.isActive === false && !isAuthRoute) {
    return NextResponse.redirect(
      new URL("/login?error=account_suspended", req.nextUrl),
    );
  }

  if (isLoggedIn && user?.isActive === false && isAuthRoute) {
    return NextResponse.next();
  }

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", `${path}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // A navegacao e a digitacao direta da URL seguem a mesma regra de setor.
  if (
    isLoggedIn &&
    user &&
    !canAccessProfessionalSectorRoute(path, user)
  ) {
    return NextResponse.redirect(
      new URL(getAccountDashboardPath(user), req.nextUrl),
    );
  }

  if (isAuthRoute && isLoggedIn && user) {
    return NextResponse.redirect(new URL(getPostLoginPath(user), req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
