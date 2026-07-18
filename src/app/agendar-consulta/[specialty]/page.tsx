import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Star, Video } from "lucide-react";

import { auth } from "@/auth";
import { MonthlyScheduleClient } from "@/app/agendar-consulta/perfil/[id]/monthly-schedule-client";
import { ProfileInitialsAvatar } from "@/modules/health/components/profile-initials-avatar";
import { getHealthSpecialtyById } from "@/modules/health/lib/specialties";
import { getProfessionalsBySpecialty } from "@/modules/users/actions/get-professionals";

type SpecialtyPageProps = {
  params: Promise<{ specialty: string }>;
};

export async function generateMetadata({
  params,
}: SpecialtyPageProps): Promise<Metadata> {
  const { specialty } = await params;
  const config = getHealthSpecialtyById(specialty);

  if (!config) return { title: "Especialidade indisponível | MWC Online" };

  return {
    title: `${config.name} online | MWC Online`,
    description: `Encontre especialistas em ${config.name}, compare perfis, valores e horários disponíveis.`,
  };
}

export default async function SpecialtyPage({ params }: SpecialtyPageProps) {
  const { specialty } = await params;
  const specialtyConfig = getHealthSpecialtyById(specialty);
  if (!specialtyConfig) notFound();

  const [result, session] = await Promise.all([
    getProfessionalsBySpecialty(specialtyConfig.id),
    auth(),
  ]);

  if (result.error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 pb-24 pt-8 font-poppins text-white">
        <div className="max-w-md text-center" role="alert">
          <h1 className="font-futura text-2xl font-bold uppercase">
            Não foi possível carregar os especialistas
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Ocorreu uma falha temporária. Tente novamente ou volte para a lista
            de especialidades.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/agendar-consulta/${specialtyConfig.id}`}
              className="rounded-lg bg-[#d73cbe] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#b02b9b]"
            >
              Tentar novamente
            </Link>
            <Link
              href="/agendar-consulta"
              className="rounded-lg border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Ver especialidades
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const professionals = result.data ?? [];

  return (
    <main className="min-h-screen bg-[#020617] pb-24 pt-8 font-poppins text-white">
      <div className="container mx-auto max-w-5xl px-4">
        <header className="mb-10">
          <Link
            href="/agendar-consulta"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para especialidades
          </Link>
          <h1 className="font-futura text-4xl font-bold uppercase tracking-tighter text-white md:text-5xl">
            Especialistas em{" "}
            <span className="text-[#d73cbe]">{specialtyConfig.name}</span>
          </h1>
        </header>

        {professionals.length === 0 ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center">
            <h2 className="text-xl font-bold text-white">
              Novos especialistas em breve
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
              Ainda não há profissionais disponíveis nesta especialidade.
              Consulte outra área ou tente novamente mais tarde.
            </p>
            <Link
              href="/agendar-consulta#especialidades"
              className="mt-6 inline-flex rounded-lg border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-white/5"
            >
              Explorar outras especialidades
            </Link>
          </section>
        ) : (
          <section className="space-y-8" aria-label="Especialistas disponíveis">
            {professionals.map((professional) => {
              const isOwnProfile = session?.user?.id === professional.id;
              const isTeacher = professional.onlineSpecialty === "TEACHER";

              return (
                <article
                  key={professional.id}
                  className="relative flex flex-col gap-8 overflow-hidden rounded-[32px] border border-white/10 bg-[#0f172a]/60 p-6 backdrop-blur-md transition-all hover:border-white/20 hover:shadow-2xl lg:flex-row lg:p-8"
                >
                  <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[#d73cbe]/5 blur-[80px]" />

                  <div className="z-10 flex flex-col gap-5 lg:w-[45%]">
                    <div className="flex items-start gap-5">
                      <ProfileInitialsAvatar
                        name={professional.name}
                        src={`/api/images/health-professional/${professional.id}`}
                        hasImage={professional.hasProfileImage}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-800 shadow-lg"
                        textClassName="text-xl"
                      />
                      <div className="pt-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h2 className="text-xl font-bold leading-tight text-white">
                            {professional.name}
                          </h2>
                          <ShieldCheck
                            className="h-4 w-4 text-emerald-500"
                            aria-label="Perfil profissional verificado"
                          />
                        </div>
                        <p className="mb-1 text-sm font-medium uppercase tracking-wide text-[#d73cbe]">
                          {isTeacher ? "Professor" : professional.jobTitle}
                        </p>
                        {isTeacher && (
                          <p className="mb-2 text-sm text-slate-400">
                            Especialidade: {professional.teachingSubject}
                          </p>
                        )}
                        <div
                          className="flex w-fit items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2 py-1"
                          aria-label={`Avaliação ${professional.rating.toFixed(1)} de 5`}
                        >
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm font-bold text-white">
                            {professional.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm font-light leading-relaxed text-slate-400">
                      {professional.bio ?? "Sem biografia disponível."}
                    </p>
                    <div className="mt-2 border-t border-white/5 pt-4">
                      <Link
                        href={`/agendar-consulta/perfil/${professional.id}`}
                        className="text-xs font-medium text-slate-400 underline underline-offset-4 transition-colors hover:text-white"
                      >
                        Ver perfil completo
                      </Link>
                    </div>
                  </div>

                  <div className="z-10 flex flex-col border-t border-white/10 pt-6 lg:w-[55%] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                    <MonthlyScheduleClient
                      readOnly={isOwnProfile}
                      pro={{
                        id: professional.id,
                        consultationFee: professional.consultationFee,
                        sessionDuration: professional.sessionDuration ?? 0,
                      }}
                    />
                    <div className="mt-4 flex w-fit items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500">
                      <Video className="h-4 w-4" />
                      Atendimento online
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
