import { auth } from "@/auth";
import Link from "next/link";
import { Briefcase, Activity, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";

export default async function PortalPage() {
  const session = await auth();

  if (!session) redirect("/login");

  const firstName = session.user?.name?.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-poppins flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#d73cbe]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-futura font-bold mb-4 uppercase tracking-tighter">
            Olá, <span className="text-[#d73cbe]">{firstName}</span>
          </h1>
          <p className="text-slate-400 text-lg">
            O que você deseja acessar hoje?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Link href="/dashboard/cliente" className="group">
            <div className="h-full bg-[#0f172a]/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 transition-all duration-500 hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-3 font-futura uppercase">
                MWC Projetos
              </h2>
              <p className="text-slate-400 font-light leading-relaxed mb-8">
                Contrate desenvolvedores, designers e outros profissionais para
                tirar suas ideias do papel.
              </p>
              <div className="flex items-center gap-2 text-blue-400 font-semibold group-hover:gap-4 transition-all">
                Acessar projetos <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          <Link href="/agendar-consulta" className="group">
            <div className="h-full bg-[#0f172a]/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 transition-all duration-500 hover:border-[#d73cbe]/50 hover:shadow-[0_0_40px_rgba(215,60,190,0.15)] hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#d73cbe]/10 rounded-2xl flex items-center justify-center text-[#d73cbe] mb-6 group-hover:scale-110 transition-transform">
                <Activity className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-3 font-futura uppercase">
                MWC Health
              </h2>
              <p className="text-slate-400 font-light leading-relaxed mb-8">
                Cuide da sua saúde com psicólogos, nutricionistas e
                especialistas em bem-estar.
              </p>
              <div className="flex items-center gap-2 text-[#d73cbe] font-semibold group-hover:gap-4 transition-all">
                Ir para agendamentos <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/api/auth/signout"
            className="text-slate-500 hover:text-white text-sm transition-colors flex items-center justify-center gap-2"
          >
            Sair da conta
          </Link>
        </div>
      </div>
    </div>
  );
}
