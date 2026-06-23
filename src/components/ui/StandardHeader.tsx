import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/images/landingPage/logo.png";
import { getUserSession } from "@/lib/get-session";
import { LayoutDashboard } from "lucide-react";

function HeaderSvgButton({ text, href }: { text: string; href: string }) {
  return (
    <span className="group relative inline-flex h-11 min-w-[112px]">
      <Link
        href={href}
        className="relative z-10 inline-flex h-full min-w-[112px] cursor-pointer items-center justify-center bg-transparent px-5 text-sm font-bold text-white outline-none"
      >
        <svg
          viewBox="0 0 160 44"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full fill-none stroke-[#d73cbe] transition-all duration-1000 ease-in-out [stroke-dasharray:110_420] [stroke-dashoffset:110] group-hover:fill-[#d73cbe]/10 group-hover:[stroke-dashoffset:-420]"
        >
          <polyline points="159,1 159,43 1,43 1,1 159,1" strokeWidth="2" />
        </svg>
        <span className="relative z-20 whitespace-nowrap uppercase tracking-widest">
          {text}
        </span>
      </Link>
    </span>
  );
}

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
            <HeaderSvgButton text="Login" href="/login" />
          )}
        </nav>
      </div>
    </header>
  );
};

export default StandardHeader;
