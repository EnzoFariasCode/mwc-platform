"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, ClipboardList, Save } from "lucide-react";
import { toast } from "sonner";
import { updateClientRecord } from "@/modules/health/actions/client-record-actions";

type SpecialtyField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
};

type Props = {
  record: {
    id: string;
    specialty: string;
    chiefComplaint: string | null;
    generalNotes: string | null;
    specialtyData: Record<string, unknown>;
    updatedAt: Date;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactRel: string | null;
    occupation: string | null;
    previousTreatments: string | null;
    familyHistory: string | null;
    continuousMedications: string | null;
    sessionValueAgreed: number | null;
    sessionFrequency: string | null;
    fixedSessionDay: string | null;
    fixedSessionTime: string | null;
    nutritionDiagnosedPathologies: string | null;
    nutritionFamilyHistory: string | null;
    nutritionMedications: string | null;
    intestinalFunction: string | null;
    sleepQuality: string | null;
    stressLevel: string | null;
    physicalActivity: string | null;
    waterIntakeLiters: number | null;
    alcoholConsumption: string | null;
    smokingStatus: string | null;
    foodAllergies: string | null;
    foodAversions: string | null;
    foodPreferences: string | null;
    foodPattern: string | null;
  };
};

const specialtyFields: Record<string, SpecialtyField[]> = {
  PSYCHOLOGIST: [
    { key: "cid", label: "CID-10", type: "text" },
    { key: "approach", label: "Abordagem terapeutica", type: "text" },
    { key: "medications", label: "Medicamentos em uso", type: "textarea" },
    {
      key: "mentalHealthHistory",
      label: "Historico de saude mental",
      type: "textarea",
    },
    {
      key: "riskLevel",
      label: "Nivel de risco",
      type: "select",
      options: ["low", "medium", "high"],
    },
    { key: "sessionFrequency", label: "Frequencia de sessoes", type: "text" },
  ],
  NUTRITIONIST: [
    { key: "weight", label: "Peso (kg)", type: "text" },
    { key: "height", label: "Altura (cm)", type: "text" },
    { key: "bmi", label: "IMC", type: "text" },
    { key: "goal", label: "Objetivo", type: "text" },
    {
      key: "foodRestrictions",
      label: "Restricoes alimentares",
      type: "textarea",
    },
    { key: "clinicalHistory", label: "Historico clinico", type: "textarea" },
    { key: "currentDiet", label: "Dieta atual", type: "textarea" },
  ],
  PERSONAL_TRAINER: [
    { key: "weight", label: "Peso (kg)", type: "text" },
    { key: "height", label: "Altura (cm)", type: "text" },
    { key: "bodyFatPercent", label: "% Gordura corporal", type: "text" },
    { key: "goal", label: "Objetivo", type: "text" },
    {
      key: "physicalLimitations",
      label: "Limitacoes fisicas",
      type: "textarea",
    },
    {
      key: "fitnessLevel",
      label: "Nivel de condicionamento",
      type: "select",
      options: ["beginner", "intermediate", "advanced"],
    },
    { key: "currentProgram", label: "Programa atual", type: "textarea" },
  ],
  LAWYER: [
    { key: "caseType", label: "Tipo de caso", type: "text" },
    { key: "processNumber", label: "Numero do processo", type: "text" },
    {
      key: "relevantDocuments",
      label: "Documentos relevantes",
      type: "textarea",
    },
    { key: "legalStatus", label: "Status juridico atual", type: "text" },
    { key: "opposingParty", label: "Parte contraria", type: "text" },
    { key: "nextHearing", label: "Proxima audiencia", type: "text" },
  ],
  ENGLISH_TEACHER: [
    {
      key: "currentLevel",
      label: "Nivel atual",
      type: "select",
      options: ["A1", "A2", "B1", "B2", "C1", "C2"],
    },
    { key: "goal", label: "Objetivo do aluno", type: "text" },
    { key: "materialsUsed", label: "Materiais utilizados", type: "textarea" },
    { key: "difficultyAreas", label: "Areas de dificuldade", type: "textarea" },
    { key: "homeworkNotes", label: "Tarefas e anotacoes", type: "textarea" },
  ],
};

const riskLabels: Record<string, string> = {
  low: "Baixo",
  medium: "Medio",
  high: "Alto",
};

const fitnessLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediario",
  advanced: "Avancado",
};

function getSelectLabel(key: string, value: string) {
  if (key === "riskLevel") return riskLabels[value] ?? value;
  if (key === "fitnessLevel") return fitnessLabels[value] ?? value;
  return value;
}

function getFieldValue(data: Record<string, unknown>, key: string) {
  const value = data[key];
  if (value === null || value === undefined) return "";
  return String(value);
}

export function ClientRecordForm({ record }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showSpecialty, setShowSpecialty] = useState(true);
  const [chiefComplaint, setChiefComplaint] = useState(
    record.chiefComplaint ?? "",
  );
  const [generalNotes, setGeneralNotes] = useState(record.generalNotes ?? "");
  const [specialtyData, setSpecialtyData] = useState<Record<string, unknown>>(
    record.specialtyData ?? {},
  );
  const [emergencyContactName, setEmergencyContactName] = useState(
    record.emergencyContactName ?? "",
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    record.emergencyContactPhone ?? "",
  );
  const [emergencyContactRel, setEmergencyContactRel] = useState(
    record.emergencyContactRel ?? "",
  );
  const [occupation, setOccupation] = useState(record.occupation ?? "");
  const [previousTreatments, setPreviousTreatments] = useState(
    record.previousTreatments ?? "",
  );
  const [familyHistory, setFamilyHistory] = useState(
    record.familyHistory ?? "",
  );
  const [continuousMedications, setContinuousMedications] = useState(
    record.continuousMedications ?? "",
  );
  const [sessionValueAgreed, setSessionValueAgreed] = useState(
    record.sessionValueAgreed != null ? String(record.sessionValueAgreed) : "",
  );
  const [sessionFrequency, setSessionFrequency] = useState(
    record.sessionFrequency ?? "",
  );
  const [fixedSessionDay, setFixedSessionDay] = useState(
    record.fixedSessionDay ?? "",
  );
  const [fixedSessionTime, setFixedSessionTime] = useState(
    record.fixedSessionTime ?? "",
  );
  const [nutritionDiagnosedPathologies, setNutritionDiagnosedPathologies] =
    useState(record.nutritionDiagnosedPathologies ?? "");
  const [nutritionFamilyHistory, setNutritionFamilyHistory] = useState(
    record.nutritionFamilyHistory ?? "",
  );
  const [nutritionMedications, setNutritionMedications] = useState(
    record.nutritionMedications ?? "",
  );
  const [intestinalFunction, setIntestinalFunction] = useState(
    record.intestinalFunction ?? "",
  );
  const [sleepQuality, setSleepQuality] = useState(record.sleepQuality ?? "");
  const [stressLevel, setStressLevel] = useState(record.stressLevel ?? "");
  const [physicalActivity, setPhysicalActivity] = useState(
    record.physicalActivity ?? "",
  );
  const [waterIntakeLiters, setWaterIntakeLiters] = useState(
    record.waterIntakeLiters != null ? String(record.waterIntakeLiters) : "",
  );
  const [alcoholConsumption, setAlcoholConsumption] = useState(
    record.alcoholConsumption ?? "",
  );
  const [smokingStatus, setSmokingStatus] = useState(
    record.smokingStatus ?? "",
  );
  const [foodAllergies, setFoodAllergies] = useState(
    record.foodAllergies ?? "",
  );
  const [foodAversions, setFoodAversions] = useState(
    record.foodAversions ?? "",
  );
  const [foodPreferences, setFoodPreferences] = useState(
    record.foodPreferences ?? "",
  );
  const [foodPattern, setFoodPattern] = useState(record.foodPattern ?? "");

  const fields = specialtyFields[record.specialty] ?? [];

  const handleSpecialtyChange = (key: string, value: string) => {
    setSpecialtyData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateClientRecord(record.id, {
        chiefComplaint,
        generalNotes,
        specialtyData,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRel,
        occupation,
        previousTreatments,
        familyHistory,
        continuousMedications,
        sessionValueAgreed: sessionValueAgreed
          ? Number(sessionValueAgreed)
          : null,
        sessionFrequency,
        fixedSessionDay,
        fixedSessionTime,
        nutritionDiagnosedPathologies,
        nutritionFamilyHistory,
        nutritionMedications,
        intestinalFunction,
        sleepQuality,
        stressLevel,
        physicalActivity,
        waterIntakeLiters: waterIntakeLiters
          ? Number(waterIntakeLiters)
          : null,
        alcoholConsumption,
        smokingStatus,
        foodAllergies,
        foodAversions,
        foodPreferences,
        foodPattern,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Prontuario salvo com sucesso.");
    });
  };

  return (
    <div className="space-y-6 rounded-xl border border-white/10 bg-[#0f172a]/80 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#d73cbe]/10 p-2 text-[#d73cbe]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold uppercase tracking-tight text-white">
            Dados Clinicos
          </h2>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#d73cbe] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#c032a8] active:scale-95 disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
          Queixa principal / Motivo do atendimento
        </label>
        <textarea
          value={chiefComplaint}
          onChange={(event) => setChiefComplaint(event.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
          placeholder="Descreva o motivo principal do atendimento..."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
          Observacoes gerais
        </label>
        <textarea
          value={generalNotes}
          onChange={(event) => setGeneralNotes(event.target.value)}
          rows={4}
          className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
          placeholder="Anotacoes gerais sobre o paciente..."
        />
      </div>

      {record.specialty === "PSYCHOLOGIST" && (
        <>
          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Contato de Emergencia
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Nome
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(event) =>
                    setEmergencyContactName(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  placeholder="Nome do contato"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Telefone
                </label>
                <input
                  type="text"
                  value={emergencyContactPhone}
                  onChange={(event) =>
                    setEmergencyContactPhone(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Parentesco
                </label>
                <input
                  type="text"
                  value={emergencyContactRel}
                  onChange={(event) =>
                    setEmergencyContactRel(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  placeholder="Ex: Mae, Conjuge"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Profissao
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(event) => setOccupation(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Ex: Professora, Engenheiro"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Medicamentos continuos
              </label>
              <input
                type="text"
                value={continuousMedications}
                onChange={(event) =>
                  setContinuousMedications(event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Ex: Sertralina 50mg"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
              Tratamentos anteriores
            </label>
            <textarea
              value={previousTreatments}
              onChange={(event) => setPreviousTreatments(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
              placeholder="Historico de tratamentos psicologicos ou psiquiatricos anteriores..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
              Historico familiar relevante
            </label>
            <textarea
              value={familyHistory}
              onChange={(event) => setFamilyHistory(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
              placeholder="Historico familiar relevante para o tratamento..."
            />
          </div>

          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Configuracoes do Tratamento
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Valor acordado por sessao (R$)
                </label>
                <input
                  type="number"
                  value={sessionValueAgreed}
                  onChange={(event) =>
                    setSessionValueAgreed(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Frequencia
                </label>
                <select
                  value={sessionFrequency}
                  onChange={(event) =>
                    setSessionFrequency(event.target.value)
                  }
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                >
                  <option value="">Selecionar...</option>
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                  <option value="sob_demanda">Sob demanda</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Dia fixo
                </label>
                <select
                  value={fixedSessionDay}
                  onChange={(event) => setFixedSessionDay(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                >
                  <option value="">Sem dia fixo</option>
                  <option value="segunda">Segunda-feira</option>
                  <option value="terca">Terca-feira</option>
                  <option value="quarta">Quarta-feira</option>
                  <option value="quinta">Quinta-feira</option>
                  <option value="sexta">Sexta-feira</option>
                  <option value="sabado">Sabado</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Horario fixo
                </label>
                <input
                  type="time"
                  value={fixedSessionTime}
                  onChange={(event) => setFixedSessionTime(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {record.specialty === "NUTRITIONIST" && (
        <>
          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Historico Clinico e Familiar
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Patologias diagnosticadas
              </label>
              <textarea
                value={nutritionDiagnosedPathologies}
                onChange={(event) =>
                  setNutritionDiagnosedPathologies(event.target.value)
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Ex: diabetes, hipertensao, hipotireoidismo, colesterol alto..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Historico familiar de doencas
              </label>
              <textarea
                value={nutritionFamilyHistory}
                onChange={(event) =>
                  setNutritionFamilyHistory(event.target.value)
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Doencas cardiovasculares, cancer, diabetes, obesidade..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Medicamentos continuos e suplementos
              </label>
              <textarea
                value={nutritionMedications}
                onChange={(event) =>
                  setNutritionMedications(event.target.value)
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Medicamentos, vitaminas, fitoterapicos e suplementos atuais..."
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Rastreamento Metabolico e Habitos
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Funcionamento intestinal
                </label>
                <select
                  value={intestinalFunction}
                  onChange={(event) =>
                    setIntestinalFunction(event.target.value)
                  }
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                >
                  <option value="">Selecionar...</option>
                  <option value="diario">Diario</option>
                  <option value="constipado">Constipado</option>
                  <option value="solto">Solto</option>
                  <option value="irregular">Irregular</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Qualidade do sono
                </label>
                <select
                  value={sleepQuality}
                  onChange={(event) => setSleepQuality(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                >
                  <option value="">Selecionar...</option>
                  <option value="boa">Boa</option>
                  <option value="regular">Regular</option>
                  <option value="ruim">Ruim</option>
                  <option value="insonia">Insonia</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Nivel de estresse
                </label>
                <select
                  value={stressLevel}
                  onChange={(event) => setStressLevel(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                >
                  <option value="">Selecionar...</option>
                  <option value="baixo">Baixo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Consumo de agua (litros/dia)
                </label>
                <input
                  type="number"
                  value={waterIntakeLiters}
                  onChange={(event) => setWaterIntakeLiters(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  placeholder="Ex: 2.5"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Consumo de alcool
                </label>
                <select
                  value={alcoholConsumption}
                  onChange={(event) =>
                    setAlcoholConsumption(event.target.value)
                  }
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                >
                  <option value="">Selecionar...</option>
                  <option value="nao">Nao</option>
                  <option value="social">Social</option>
                  <option value="frequente">Frequente</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Tabagismo
                </label>
                <select
                  value={smokingStatus}
                  onChange={(event) => setSmokingStatus(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                >
                  <option value="">Selecionar...</option>
                  <option value="nao">Nao</option>
                  <option value="ex_fumante">Ex-fumante</option>
                  <option value="fumante">Fumante</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Pratica de atividade fisica
              </label>
              <textarea
                value={physicalActivity}
                onChange={(event) => setPhysicalActivity(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Tipo, frequencia e duracao..."
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Perfil Alimentar
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Padrao alimentar
                </label>
                <select
                  value={foodPattern}
                  onChange={(event) => setFoodPattern(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                >
                  <option value="">Selecionar...</option>
                  <option value="onivoro">Onivoro</option>
                  <option value="vegetariano">Vegetariano</option>
                  <option value="vegano">Vegano</option>
                  <option value="flexitariano">Flexitariano</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Preferencias alimentares
                </label>
                <input
                  type="text"
                  value={foodPreferences}
                  onChange={(event) => setFoodPreferences(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  placeholder="Alimentos preferidos"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Alergias ou intolerancias alimentares
              </label>
              <textarea
                value={foodAllergies}
                onChange={(event) => setFoodAllergies(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Ex: gluten, lactose, frutos do mar..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Aversoes alimentares
              </label>
              <textarea
                value={foodAversions}
                onChange={(event) => setFoodAversions(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="O que o paciente nao come de jeito nenhum..."
              />
            </div>
          </div>
        </>
      )}

      {fields.length > 0 && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowSpecialty((value) => !value)}
            className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-300"
          >
            {showSpecialty ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Dados especificos da especialidade
          </button>

          {showSpecialty && (
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={getFieldValue(specialtyData, field.key)}
                      onChange={(event) =>
                        handleSpecialtyChange(field.key, event.target.value)
                      }
                      rows={3}
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={getFieldValue(specialtyData, field.key)}
                      onChange={(event) =>
                        handleSpecialtyChange(field.key, event.target.value)
                      }
                      className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    >
                      <option value="">Selecionar...</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {getSelectLabel(field.key, option)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={getFieldValue(specialtyData, field.key)}
                      onChange={(event) =>
                        handleSpecialtyChange(field.key, event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
