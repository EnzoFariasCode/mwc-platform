"use client";

import Link from "next/link";
import {
  CalendarClock,
  FileText,
  Mail,
  MapPin,
  NotebookPen,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

export type ClientRecordListItem = {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string | null;
  patientCity: string | null;
  specialty: string;
  chiefComplaint: string | null;
  totalNotes: number;
  lastSessionDate: string | null;
  totalLegalCases: number;
  lastLegalActivityDate: string | null;
  updatedAt: string;
};

type Props = {
  records: ClientRecordListItem[];
};

const specialtyLabel: Record<string, string> = {
  PSYCHOLOGIST: "Psicologia",
  NUTRITIONIST: "Nutricao",
  PERSONAL_TRAINER: "Personal Trainer",
  LAWYER: "Advocacia",
  ENGLISH_TEACHER: "Ingles",
};

const specialtyColor: Record<string, string> = {
  PSYCHOLOGIST: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  NUTRITIONIST: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  PERSONAL_TRAINER: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  LAWYER: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  ENGLISH_TEACHER: "bg-[#d73cbe]/10 text-[#d73cbe] border-[#d73cbe]/20",
};

function formatDate(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(date),
  );
}

function entryLabel(isLawyerRecord: boolean, totalEntries: number) {
  if (isLawyerRecord) {
    return totalEntries === 1 ? "caso" : "casos";
  }

  return totalEntries === 1 ? "nota" : "notas";
}

function dateOnly(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function activityDate(record: ClientRecordListItem) {
  return record.specialty === "LAWYER"
    ? record.lastLegalActivityDate
    : record.lastSessionDate;
}

export function ClientRecordsList({ records }: Props) {
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const visibleRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const recordDate = dateOnly(activityDate(record) ?? record.updatedAt);
        const matchesDate = filterDate ? recordDate === filterDate : true;

        const matchesSearch = term
          ? [
              record.patientName,
              record.patientEmail,
              record.patientCity,
              specialtyLabel[record.specialty],
              record.chiefComplaint,
            ]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(term))
          : true;

        return matchesDate && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(activityDate(a) ?? a.updatedAt).getTime();
        const dateB = new Date(activityDate(b) ?? b.updatedAt).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [filterDate, records, search, sortOrder]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-[#0f172a]/80 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_190px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#020617] py-3 pl-11 pr-4 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
              placeholder="Pesquisar prontuario por nome, email, cidade ou especialidade..."
            />
          </div>

          <div className="relative">
            <CalendarClock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
              className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] py-3 pl-11 pr-4 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
              aria-label="Filtrar por data"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as "desc" | "asc")
              }
              className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] py-3 pl-11 pr-4 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
              aria-label="Ordenar por data"
            >
              <option value="desc">Data decrescente</option>
              <option value="asc">Data crescente</option>
            </select>
          </div>
        </div>

        {(search || filterDate) && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilterDate("");
              }}
              className="cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-white"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {visibleRecords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-slate-500">
          Nenhum prontuario encontrado com os filtros atuais.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]/80">
          <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_120px] gap-4 border-b border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 md:grid">
            <span>Paciente</span>
            <span>Especialidade</span>
            <span>Registro</span>
            <span>Ultima atividade</span>
            <span className="text-right">Acao</span>
          </div>

          <div className="divide-y divide-white/10">
            {visibleRecords.map((record) => {
              const isLawyerRecord = record.specialty === "LAWYER";
              const totalEntries = isLawyerRecord
                ? record.totalLegalCases
                : record.totalNotes;
              const lastActivityDate = activityDate(record);
              const colorClass =
                specialtyColor[record.specialty] ??
                "bg-white/10 text-slate-300 border-white/10";
              const label = specialtyLabel[record.specialty] ?? record.specialty;

              return (
                <Link
                  key={record.id}
                  href={`/agendar-consulta/prontuario/${record.patientId}`}
                  className="group grid cursor-pointer gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03] md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_120px] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d73cbe]/20 bg-[#d73cbe]/10 text-[#d73cbe]">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white transition-colors group-hover:text-[#d73cbe]">
                          {record.patientName}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          {record.patientCity && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {record.patientCity}
                            </span>
                          )}
                          {record.patientEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {record.patientEmail}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {record.chiefComplaint && (
                      <p className="mt-2 line-clamp-1 text-xs text-slate-500 md:hidden">
                        {record.chiefComplaint}
                      </p>
                    )}
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass}`}
                    >
                      {label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <NotebookPen className="h-3.5 w-3.5 text-slate-600" />
                    {totalEntries} {entryLabel(isLawyerRecord, totalEntries)}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-600" />
                    {lastActivityDate ? formatDate(lastActivityDate) : "Sem data"}
                  </div>

                  <div className="flex justify-start md:justify-end">
                    <span className="inline-flex cursor-pointer items-center rounded-xl border border-[#d73cbe]/20 bg-[#d73cbe]/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#d73cbe] transition-colors group-hover:bg-[#d73cbe] group-hover:text-white">
                      Abrir
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
