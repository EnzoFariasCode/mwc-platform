"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  Gavel,
  PlusCircle,
  Search,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import {
  createLegalCase,
  createLegalCaseActivity,
  type LegalCaseSummary,
} from "@/modules/health/actions/legal-case-actions";

type Props = {
  clientRecordId: string;
  initialCases: LegalCaseSummary[];
};

const activityTypes = [
  "Reuniao com cliente",
  "Redacao de peca/peticao",
  "Audiencia",
  "Analise de documentos",
  "Despacho com juiz",
  "Publicacao/Movimentacao",
  "Outro",
];

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSimpleDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatTimeSpent(minutes: number | null) {
  if (!minutes || minutes <= 0) return "Sem timesheet";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}min`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h${String(remainingMinutes).padStart(2, "0")}`;
}

function toDateTimeInputValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function activityAccent(type: string, hasDeadline: boolean) {
  if (hasDeadline) return "border-red-400";
  if (type.toLowerCase().includes("audiencia")) return "border-amber-300";
  if (type.toLowerCase().includes("reuniao")) return "border-blue-300";
  if (type.toLowerCase().includes("publicacao")) return "border-purple-300";
  return "border-emerald-300";
}

function statusLabel(status: string) {
  if (status === "ARCHIVED") return "Arquivado";
  if (status === "SUSPENDED") return "Suspenso";
  if (status === "CLOSED") return "Encerrado";
  return "Ativo";
}

export function LegalCasesPanel({ clientRecordId, initialCases }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [expandedCaseId, setExpandedCaseId] = useState(
    initialCases[0]?.id ?? "",
  );
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [legalArea, setLegalArea] = useState("");
  const [processNumber, setProcessNumber] = useState("");
  const [court, setCourt] = useState("");
  const [clientPosition, setClientPosition] = useState("");
  const [opposingParty, setOpposingParty] = useState("");
  const [opposingCounsel, setOpposingCounsel] = useState("");
  const [factsSummary, setFactsSummary] = useState("");
  const [feeType, setFeeType] = useState("");
  const [feeDetails, setFeeDetails] = useState("");

  const [activityDate, setActivityDate] = useState(
    toDateTimeInputValue(new Date()),
  );
  const [activityType, setActivityType] = useState("");
  const [timeSpentMinutes, setTimeSpentMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [reminderDays, setReminderDays] = useState("");
  const [filesNotes, setFilesNotes] = useState("");

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return initialCases;

    return initialCases.filter((item) =>
      [
        item.title,
        item.legalArea,
        item.processNumber,
        item.opposingParty,
        item.court,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [initialCases, search]);

  const resetCaseForm = () => {
    setTitle("");
    setLegalArea("");
    setProcessNumber("");
    setCourt("");
    setClientPosition("");
    setOpposingParty("");
    setOpposingCounsel("");
    setFactsSummary("");
    setFeeType("");
    setFeeDetails("");
  };

  const resetActivityForm = () => {
    setActivityDate(toDateTimeInputValue(new Date()));
    setActivityType("");
    setTimeSpentMinutes("");
    setDescription("");
    setDeadlineDate("");
    setReminderDays("");
    setFilesNotes("");
  };

  const handleCreateCase = () => {
    if (title.trim().length < 3) {
      toast.error("Informe o titulo interno do caso.");
      return;
    }

    startTransition(async () => {
      const result = await createLegalCase(clientRecordId, {
        title,
        legalArea,
        processNumber,
        court,
        clientPosition,
        opposingParty,
        opposingCounsel,
        factsSummary,
        feeType,
        feeDetails,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Caso juridico criado.");
      resetCaseForm();
      setIsNewCaseOpen(false);
      if (result.caseId) setExpandedCaseId(result.caseId);
      router.refresh();
    });
  };

  const handleCreateActivity = (legalCaseId: string) => {
    if (!activityType) {
      toast.error("Selecione o tipo de atividade.");
      return;
    }

    if (description.trim().length < 10) {
      toast.error("Descreva o andamento com pelo menos 10 caracteres.");
      return;
    }

    startTransition(async () => {
      const result = await createLegalCaseActivity(legalCaseId, {
        activityDate,
        activityType,
        timeSpentMinutes: timeSpentMinutes
          ? Number.parseInt(timeSpentMinutes, 10)
          : null,
        description,
        deadlineDate,
        reminderDays: reminderDays ? Number.parseInt(reminderDays, 10) : null,
        filesNotes,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Andamento registrado.");
      resetActivityForm();
      router.refresh();
    });
  };

  return (
    <div className="space-y-5 rounded-xl border border-white/10 bg-[#0f172a]/80 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#d73cbe]/10 p-2 text-[#d73cbe]">
            <Gavel className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight text-white">
              Casos e Processos
            </h2>
            <p className="text-xs text-slate-500">
              Organize cada demanda juridica separadamente.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewCaseOpen((value) => !value)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#d73cbe] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#c032a8] active:scale-95"
        >
          <PlusCircle className="h-4 w-4" />
          Novo caso
        </button>
      </div>

      {isNewCaseOpen && (
        <div className="space-y-4 rounded-xl border border-[#d73cbe]/20 bg-[#d73cbe]/5 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Dados fixos do caso/processo
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Titulo interno <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Ex: Acao indenizatoria vs Companhia Aerea"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Area do direito
              </label>
              <select
                value={legalArea}
                onChange={(event) => setLegalArea(event.target.value)}
                className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
              >
                <option value="">Selecionar...</option>
                <option value="Civel">Civel</option>
                <option value="Trabalhista">Trabalhista</option>
                <option value="Familia">Familia</option>
                <option value="Tributario">Tributario</option>
                <option value="Criminal">Criminal</option>
                <option value="Empresarial">Empresarial</option>
                <option value="Previdenciario">Previdenciario</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Numero do processo
              </label>
              <input
                type="text"
                value={processNumber}
                onChange={(event) => setProcessNumber(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Forum / Vara / Comarca
              </label>
              <input
                type="text"
                value={court}
                onChange={(event) => setCourt(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Posicao do cliente
              </label>
              <select
                value={clientPosition}
                onChange={(event) => setClientPosition(event.target.value)}
                className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
              >
                <option value="">Selecionar...</option>
                <option value="Autor">Autor</option>
                <option value="Reu">Reu</option>
                <option value="Requerente">Requerente</option>
                <option value="Requerido">Requerido</option>
                <option value="Interessado">Interessado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Parte contraria
              </label>
              <input
                type="text"
                value={opposingParty}
                onChange={(event) => setOpposingParty(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Advogado da parte contraria
              </label>
              <input
                type="text"
                value={opposingCounsel}
                onChange={(event) => setOpposingCounsel(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Breve relato dos fatos
              </label>
              <textarea
                value={factsSummary}
                onChange={(event) => setFactsSummary(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Tipo de honorarios
              </label>
              <select
                value={feeType}
                onChange={(event) => setFeeType(event.target.value)}
                className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
              >
                <option value="">Selecionar...</option>
                <option value="Valor fixo">Valor fixo</option>
                <option value="Percentual no exito">Percentual no exito</option>
                <option value="Por hora">Por hora</option>
                <option value="Misto">Misto</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Detalhes dos honorarios
              </label>
              <input
                type="text"
                value={feeDetails}
                onChange={(event) => setFeeDetails(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Ex: R$ 3.000 fixo + 20% no exito"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewCaseOpen(false)}
              className="cursor-pointer rounded-xl bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateCase}
              disabled={isPending}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#d73cbe] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#c032a8] active:scale-95 disabled:cursor-wait disabled:opacity-60"
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Salvar caso
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#020617] py-3 pl-11 pr-4 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
          placeholder="Buscar por titulo, processo, parte contraria ou comarca..."
        />
      </div>

      {filteredCases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-slate-500">
          Nenhum caso juridico encontrado para este cliente.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((legalCase) => {
            const isExpanded = expandedCaseId === legalCase.id;

            return (
              <div
                key={legalCase.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-[#020617]/70"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCaseId(isExpanded ? "" : legalCase.id)
                  }
                  className="flex w-full cursor-pointer items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#d73cbe]/20 bg-[#d73cbe]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d73cbe]">
                        {statusLabel(legalCase.status)}
                      </span>
                      {legalCase.legalArea && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {legalCase.legalArea}
                        </span>
                      )}
                    </div>
                    <h3 className="truncate text-base font-bold text-white">
                      {legalCase.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {legalCase.processNumber || "Processo ainda nao informado"}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
                  ) : (
                    <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-5 border-t border-white/10 px-5 py-5">
                    <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
                      <p>
                        <span className="font-bold text-slate-300">
                          Forum/Vara:
                        </span>{" "}
                        {legalCase.court || "Nao informado"}
                      </p>
                      <p>
                        <span className="font-bold text-slate-300">
                          Posicao:
                        </span>{" "}
                        {legalCase.clientPosition || "Nao informado"}
                      </p>
                      <p>
                        <span className="font-bold text-slate-300">
                          Parte contraria:
                        </span>{" "}
                        {legalCase.opposingParty || "Nao informado"}
                      </p>
                      <p>
                        <span className="font-bold text-slate-300">
                          Adv. contrario:
                        </span>{" "}
                        {legalCase.opposingCounsel || "Nao informado"}
                      </p>
                      <p>
                        <span className="font-bold text-slate-300">
                          Honorarios:
                        </span>{" "}
                        {[legalCase.feeType, legalCase.feeDetails]
                          .filter(Boolean)
                          .join(" - ") || "Nao informado"}
                      </p>
                    </div>

                    {legalCase.factsSummary && (
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-slate-400">
                        <p className="mb-2 font-bold text-slate-300">
                          Relato dos fatos
                        </p>
                        {legalCase.factsSummary}
                      </div>
                    )}

                    <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Registrar andamento
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                            Data e hora
                          </label>
                          <input
                            type="datetime-local"
                            value={activityDate}
                            onChange={(event) =>
                              setActivityDate(event.target.value)
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                            Tipo de atividade
                          </label>
                          <select
                            value={activityType}
                            onChange={(event) =>
                              setActivityType(event.target.value)
                            }
                            className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                          >
                            <option value="">Selecionar...</option>
                            {activityTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                            Tempo gasto em minutos
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={timeSpentMinutes}
                            onChange={(event) =>
                              setTimeSpentMinutes(event.target.value)
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                            placeholder="Ex: 90"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                            Prazo fatal
                          </label>
                          <input
                            type="date"
                            value={deadlineDate}
                            onChange={(event) =>
                              setDeadlineDate(event.target.value)
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                            Lembrete interno em dias
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={reminderDays}
                            onChange={(event) =>
                              setReminderDays(event.target.value)
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                            placeholder="Ex: 3"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                          Descricao do andamento{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={description}
                          onChange={(event) =>
                            setDescription(event.target.value)
                          }
                          rows={4}
                          className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                          placeholder="Ex: Publicacao recebida para contestar em 15 dias..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                          Meus envios / Documentos e provas
                        </label>
                        <textarea
                          value={filesNotes}
                          onChange={(event) => setFilesNotes(event.target.value)}
                          rows={3}
                          className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                          placeholder="Registre PDFs, procuracoes, contratos, provas, peticoes ou links. O upload real pode ser integrado depois."
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCreateActivity(legalCase.id)}
                          disabled={isPending}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#d73cbe] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#c032a8] active:scale-95 disabled:cursor-wait disabled:opacity-60"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Salvar andamento
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                        <Timer className="h-4 w-4" />
                        Linha do tempo
                      </div>
                      {legalCase.activities.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-slate-500">
                          Nenhum andamento registrado neste caso.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {legalCase.activities.map((activity) => (
                            <div
                              key={activity.id}
                              className={`border-l-4 ${activityAccent(
                                activity.activityType,
                                Boolean(activity.deadlineDate),
                              )} rounded-r-xl bg-[#020617] px-4 py-3`}
                            >
                              <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  {formatDate(activity.activityDate)}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {formatTimeSpent(activity.timeSpentMinutes)}
                                </span>
                                <span className="inline-flex items-center gap-1 font-bold text-slate-300">
                                  <FileText className="h-3.5 w-3.5" />
                                  {activity.activityType}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-sm text-slate-300">
                                {activity.description}
                              </p>
                              {activity.deadlineDate && (
                                <p className="mt-2 text-xs font-bold text-red-300">
                                  Prazo fatal:{" "}
                                  {formatSimpleDate(activity.deadlineDate)}
                                  {activity.reminderDays != null
                                    ? ` | Lembrar ${activity.reminderDays} dia(s) antes`
                                    : ""}
                                </p>
                              )}
                              {activity.filesNotes && (
                                <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500">
                                  Meus envios: {activity.filesNotes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
