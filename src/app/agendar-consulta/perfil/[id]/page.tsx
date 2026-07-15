import { notFound, redirect } from "next/navigation";
import { formatProfessionalCredential } from "@/modules/health/lib/professional-credentials";
import { GraduationCap, Star, MapPin, Video, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { isProfessionalVerificationApproved } from "@/modules/health/lib/professional-verification-policy";
import { getHealthProfessionalById } from "@/modules/health/services/professional-service";
import { ProfileInitialsAvatar } from "@/modules/health/components/profile-initials-avatar";
import { ProfileViewClient } from "./profile-view-client";
import { MonthlyScheduleClient } from "./monthly-schedule-client";
import { BackButtonClient } from "./back-button-client"; // <-- Importamos o novo botão inteligente

export default async function ProfessionalHealthProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pro, session] = await Promise.all([getHealthProfessionalById(id), auth()]);

  if (
    !pro &&
    session?.user?.id === id &&
    session.user.userType === "PROFESSIONAL" &&
    session.user.industry === "HEALTH"
  ) {
    const owner = await db.user.findUnique({
      where: { id },
      select: {
        professionalVerification: {
          select: { status: true, expiresAt: true },
        },
      },
    });

    redirect(
      isProfessionalVerificationApproved(owner?.professionalVerification)
        ? "/agendar-consulta/dashboard-profissional?notice=profile-incomplete"
        : "/agendar-consulta/verificacao?notice=profile-unavailable",
    );
  }

  if (!pro) {
    notFound();
  }

  const proName = pro.displayName || pro.name;
  const isOwnProfile = session?.user?.id === id;
  const isTeacher = pro.onlineSpecialty === "TEACHER";
  const documentReg = formatProfessionalCredential(pro.documentReg);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center mb-8">
          {/* NOSSO NOVO BOTÃO INTELIGENTE */}
          <BackButtonClient />

          <ProfileViewClient proId={id} proData={pro} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* COLUNA ESQUERDA: INFO DO PROFISSIONAL */}
          <div className="w-full lg:w-2/3 space-y-8">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#d73cbe]/5 rounded-full blur-[100px] pointer-events-none" />

              <ProfileInitialsAvatar
                name={proName}
                src={`/api/images/user/${id}`}
                hasImage={pro.hasProfileImage}
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shrink-0 border-2 border-white/10 shadow-2xl bg-slate-800"
                textClassName="text-3xl"
              />

              <div className="flex flex-col justify-center relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#d73cbe]/20 text-[#d73cbe] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#d73cbe]/20">
                    {isTeacher ? "Professor" : pro.jobTitle || "Especialista MWC"}
                  </span>
                  {!isTeacher && documentReg && (
                    <span className="bg-white/5 text-slate-400 px-3 py-1 rounded-full text-[10px] font-medium border border-white/5">
                      {documentReg}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-futura font-bold text-white mb-2 uppercase tracking-tight">
                  {proName}
                </h1>

                {isTeacher && (
                  <p className="mb-4 text-sm text-slate-400">
                    Especialidade: {pro.teachingSubject}
                  </p>
                )}

                {!isTeacher && pro.approach && (
                  <p className="text-slate-400 text-sm mb-4">
                    Abordagem:{" "}
                    <span className="text-white font-medium">
                      {pro.approach}
                    </span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-6 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">
                      {(pro.rating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-slate-500 text-sm">
                      ({pro.ratingCount ?? 0} avaliações)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    {pro.city || "Brasil"}, {pro.state || "BR"}
                  </div>
                </div>
              </div>
            </div>

            {/* SOBRE */}
            <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-8">
              <h2 className="text-xl font-futura font-bold text-white mb-4 uppercase tracking-wide">
                {isTeacher ? "Sobre o professor" : "Sobre o especialista"}
              </h2>
              <p className="text-slate-400 leading-relaxed font-light whitespace-pre-wrap">
                {pro.bio ||
                  "Este profissional ainda não preencheu sua biografia detalhada."}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 flex gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl h-fit">
                  <Video className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">
                    Atendimento online
                  </h3>
                  <p className="text-sm text-slate-400">
                    {isTeacher
                      ? "Atendimento online por videochamada."
                      : "Atendimento online por videochamada segura."}
                  </p>
                </div>
              </div>
              <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 flex gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl h-fit">
                  {isTeacher ? (
                    <GraduationCap className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">
                    {isTeacher
                      ? "Especialidade de ensino"
                      : "Registro profissional"}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {isTeacher
                      ? pro.teachingSubject
                      : "Identificacao profissional informada e exibida no perfil."}
                  </p>
                </div>
              </div>
            </div>

            <section className="space-y-5 border-t border-white/10 pt-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-futura font-bold uppercase tracking-wide text-white">
                    {isTeacher ? "Avaliacoes de alunos" : "Avaliacoes de clientes"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {isTeacher
                      ? "Experiencias publicadas apos aulas concluidas."
                      : "Experiencias publicadas apos atendimentos concluidos."}
                  </p>
                </div>
                {pro.ratingCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <strong className="text-white">{pro.rating.toFixed(1)}</strong>
                    <span>
                      {pro.ratingCount} {pro.ratingCount === 1 ? "avaliacao" : "avaliacoes"}
                    </span>
                  </div>
                )}
              </div>

              {pro.reviews.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {pro.reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-lg border border-white/10 bg-[#0f172a]/60 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white">
                            {review.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {review.authorName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Intl.DateTimeFormat("pt-BR", {
                                month: "short",
                                year: "numeric",
                              }).format(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-1 text-sm font-bold text-yellow-400"
                          aria-label={`${review.rating} de 5 estrelas`}
                        >
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          {review.rating}.0
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                          {review.comment}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 px-6 py-10 text-center">
                  <Star className="mx-auto h-6 w-6 text-slate-600" />
                  <p className="mt-3 text-sm text-slate-500">
                    Este profissional ainda nao recebeu avaliacoes publicas.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* COLUNA DIREITA: CALENDÁRIO INTELIGENTE */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-28">
            <MonthlyScheduleClient
              readOnly={isOwnProfile}
              pro={{
                ...pro,
                sessionDuration: pro.sessionDuration ?? undefined,
                consultationFee: pro.consultationFee
                  ? Number(pro.consultationFee)
                  : undefined,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
