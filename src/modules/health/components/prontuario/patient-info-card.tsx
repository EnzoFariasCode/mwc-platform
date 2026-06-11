"use client";

import { Calendar, Mail, MapPin, Phone, User, Venus } from "lucide-react";

type Props = {
  record: {
    patientName: string;
    patientEmail: string | null;
    patientPhone: string | null;
    patientBirth: Date | null;
    patientGender: string | null;
    patientCity: string | null;
    specialty: string;
  };
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-white/5 py-3 last:border-0">
      <div className="mt-0.5 shrink-0 rounded-lg bg-white/5 p-1.5 text-slate-400">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-white">
          {value || "Nao informado"}
        </p>
      </div>
    </div>
  );
}

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(date),
  );
}

function formatGender(gender: string | null) {
  if (!gender) return null;
  if (gender === "M") return "Masculino";
  if (gender === "F") return "Feminino";
  return gender;
}

export function PatientInfoCard({ record }: Props) {
  return (
    <div className="sticky top-6 rounded-xl border border-white/10 bg-[#0f172a]/80 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d73cbe]/20 bg-[#d73cbe]/10 text-[#d73cbe]">
          <User className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Dados do Paciente
          </p>
          <p className="text-sm font-bold text-white">{record.patientName}</p>
        </div>
      </div>

      <div>
        <InfoRow icon={Mail} label="E-mail" value={record.patientEmail} />
        <InfoRow icon={Phone} label="Telefone" value={record.patientPhone} />
        <InfoRow
          icon={Calendar}
          label="Data de nascimento"
          value={formatDate(record.patientBirth)}
        />
        <InfoRow
          icon={Venus}
          label="Genero"
          value={formatGender(record.patientGender)}
        />
        <InfoRow icon={MapPin} label="Cidade" value={record.patientCity} />
      </div>

      <div className="mt-4 border-t border-white/5 pt-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Aviso de privacidade
        </p>
        <p className="text-xs leading-relaxed text-slate-500">
          Este prontuario e privado e visivel apenas para voce. O paciente nao
          tem acesso a nenhuma informacao registrada aqui.
        </p>
      </div>
    </div>
  );
}
