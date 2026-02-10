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
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity h-full py-4"
        >
          <Image
            src={Logo}
            alt="MCW Logo"
            className="h-12 w-auto object-contain"
            priority
          />
          <span className="text-white font-bold text-xl tracking-wider font-futura pt-1">
            MWC
          </span>
        </Link>

        <div className="flex-1"></div>

        <nav className="flex items-center gap-6">
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
              className="px-6 py-2 rounded-full text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2 rounded-full text-white font-bold text-sm bg-[#d73cbe] hover:bg-[#c02aa8] shadow-lg shadow-[#d73cbe]/20 hover:shadow-[#d73cbe]/40 transition-all transform hover:-translate-y-0.5"
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
