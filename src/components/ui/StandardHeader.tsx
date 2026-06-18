import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/images/landingPage/logo.png";
import { getUserSession } from "@/lib/get-session";
import { LayoutDashboard } from "lucide-react";

const StandardHeader = async () => {
  const session = await getUserSession();

  // AJUSTE AQUI:
  // Se for Profissional -> /dashboard/profissional
  // Se for Cliente (qualquer outro) -> /dashboard/cliente (Visão Geral)
  const dashboardLink =
    session?.role === "PROFESSIONAL"
      ? "/dashboard/profissional"
      : "/dashboard/cliente";

  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/10 backdrop-blur-md bg-slate-950/80 transition-all duration-300">
      <div className="container mx-auto flex h-20 items-center justify-between px-3 sm:px-4">
        <Link
          href="/"
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity h-full py-4"
        >
          <Image
            src={Logo}
            alt="MWC Logo"
            className="h-10 w-auto object-contain sm:h-12"
            priority
          />
          <span className="pt-1 font-futura text-lg font-bold tracking-wider text-white sm:text-xl">
            MWC
          </span>
        </Link>

        <div className="flex-1"></div>

        <nav className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-300 hover:text-[#d73cbe] transition-colors hidden sm:block"
          >
            Página Inicial
          </Link>

          <Link
            href="/beWorker#planos"
            className="text-sm font-medium text-slate-300 hover:text-[#d73cbe] transition-colors hidden sm:block"
          >
            Planos
          </Link>

          {session ? (
            <Link
              href={dashboardLink}
              className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-500/40 sm:px-6"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[#d73cbe] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#d73cbe]/20 transition-all hover:-translate-y-0.5 hover:bg-[#c02aa8] hover:shadow-[#d73cbe]/40 sm:px-6"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default StandardHeader;
