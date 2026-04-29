"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Video,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Timer,
  XCircle,
} from "lucide-react";

// 1. Mock de Consultas (Baseado no seu Modelo Appointment do Prisma)
const myAppointments = [
  {
    id: "app_1",
    proName: "Dr. Carlos Eduardo",
    specialty: "Psicólogo",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=250&q=80",
    date: "13 Abr, 2024",
    time: "14:00",
    status: "SCHEDULED", // Marcada
    meetLink: "https://meet.google.com/xyz-abc-123",
  },
  {
    id: "app_2",
    proName: "Dra. Mariana Rios",
    specialty: "Advogada",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80",
    date: "10 Abr, 2024",
    time: "10:30",
    status: "COMPLETED", // Realizada
    meetLink: null,
  },
];

export default function HistoricoConsultasPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-futura font-bold uppercase tracking-tight">
            Minhas <span className="text-[#d73cbe]">Consultas</span>
          </h1>
          <p className="text-slate-400 font-light">
            Gerencie seus horários e acesse suas salas de reunião.
          </p>
        </div>

        <div className="space-y-4">
          {myAppointments.map((app) => (
            <div
              key={app.id}
              className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/20 transition-all group"
            >
              {/* Lado Esquerdo: Profissional e Info */}
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0">
                  <Image
                    src={app.image}
                    alt={app.proName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight">
                    {app.proName}
                  </h3>
                  <p className="text-xs text-[#d73cbe] font-medium uppercase tracking-wider mb-2">
                    {app.specialty}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {app.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {app.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Status e Ação */}
              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                {/* Status Badge */}
                <div className="flex flex-col items-end gap-1">
                  {app.status === "SCHEDULED" && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase border border-blue-500/20">
                      <Timer className="w-3 h-3" /> Agendado
                    </span>
                  )}
                  {app.status === "COMPLETED" && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Realizado
                    </span>
                  )}
                </div>

                {/* Botão de Ação Dinâmico */}
                {app.status === "SCHEDULED" ? (
                  <a
                    href={app.meetLink || "#"}
                    target="_blank"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#d73cbe] hover:bg-[#b02da0] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#d73cbe]/20"
                  >
                    <Video className="w-4 h-4" /> Entrar no Meet
                  </a>
                ) : (
                  <button className="p-2.5 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-colors border border-white/5">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (Caso não tenha nada) */}
        {myAppointments.length === 0 && (
          <div className="text-center py-20 bg-white/[0.02] rounded-[32px] border border-dashed border-white/10">
            <p className="text-slate-500">
              Você ainda não possui agendamentos.
            </p>
            <Link
              href="/agendar-consulta"
              className="text-[#d73cbe] text-sm mt-4 inline-block hover:underline"
            >
              Começar agora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
