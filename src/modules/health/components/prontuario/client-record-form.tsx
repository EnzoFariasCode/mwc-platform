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
    englishCurrentLevel: string | null;
    englishMainGoal: string | null;
    englishPreviousExperience: string | null;
    englishInitialDifficulties: string | null;
    englishClassMode: string | null;
    englishClassFrequency: string | null;
    englishClassDuration: string | null;
    englishBillingAmount: number | null;
    legalPersonType: string | null;
    legalNationality: string | null;
    legalCpf: string | null;
    legalRg: string | null;
    legalMaritalStatus: string | null;
    legalCompanyName: string | null;
    legalTradeName: string | null;
    legalCnpj: string | null;
    legalStateRegistration: string | null;
    legalRepresentativeName: string | null;
    legalRepresentativeCpf: string | null;
    legalContactEmail: string | null;
    legalContactPhones: string | null;
    legalAddress: string | null;
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
  const [englishCurrentLevel, setEnglishCurrentLevel] = useState(
    record.englishCurrentLevel ?? "",
  );
  const [englishMainGoal, setEnglishMainGoal] = useState(
    record.englishMainGoal ?? "",
  );
  const [englishPreviousExperience, setEnglishPreviousExperience] = useState(
    record.englishPreviousExperience ?? "",
  );
  const [englishInitialDifficulties, setEnglishInitialDifficulties] = useState(
    record.englishInitialDifficulties ?? "",
  );
  const [englishClassMode, setEnglishClassMode] = useState(
    record.englishClassMode ?? "",
  );
  const [englishClassFrequency, setEnglishClassFrequency] = useState(
    record.englishClassFrequency ?? "",
  );
  const [englishClassDuration, setEnglishClassDuration] = useState(
    record.englishClassDuration ?? "",
  );
  const [englishBillingAmount, setEnglishBillingAmount] = useState(
    record.englishBillingAmount != null
      ? String(record.englishBillingAmount)
      : "",
  );
  const [legalPersonType, setLegalPersonType] = useState(
    record.legalPersonType ?? "PF",
  );
  const [legalNationality, setLegalNationality] = useState(
    record.legalNationality ?? "",
  );
  const [legalCpf, setLegalCpf] = useState(record.legalCpf ?? "");
  const [legalRg, setLegalRg] = useState(record.legalRg ?? "");
  const [legalMaritalStatus, setLegalMaritalStatus] = useState(
    record.legalMaritalStatus ?? "",
  );
  const [legalCompanyName, setLegalCompanyName] = useState(
    record.legalCompanyName ?? "",
  );
  const [legalTradeName, setLegalTradeName] = useState(
    record.legalTradeName ?? "",
  );
  const [legalCnpj, setLegalCnpj] = useState(record.legalCnpj ?? "");
  const [legalStateRegistration, setLegalStateRegistration] = useState(
    record.legalStateRegistration ?? "",
  );
  const [legalRepresentativeName, setLegalRepresentativeName] = useState(
    record.legalRepresentativeName ?? "",
  );
  const [legalRepresentativeCpf, setLegalRepresentativeCpf] = useState(
    record.legalRepresentativeCpf ?? "",
  );
  const [legalContactEmail, setLegalContactEmail] = useState(
    record.legalContactEmail ?? "",
  );
  const [legalContactPhones, setLegalContactPhones] = useState(
    record.legalContactPhones ?? "",
  );
  const [legalAddress, setLegalAddress] = useState(record.legalAddress ?? "");

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
        englishCurrentLevel,
        englishMainGoal,
        englishPreviousExperience,
        englishInitialDifficulties,
        englishClassMode,
        englishClassFrequency,
        englishClassDuration,
        englishBillingAmount: englishBillingAmount
          ? Number(englishBillingAmount)
          : null,
        legalPersonType,
        legalNationality,
        legalCpf,
        legalRg,
        legalMaritalStatus,
        legalCompanyName,
        legalTradeName,
        legalCnpj,
        legalStateRegistration,
        legalRepresentativeName,
        legalRepresentativeCpf,
        legalContactEmail,
        legalContactPhones,
        legalAddress,
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

      {record.specialty === "ENGLISH_TEACHER" && (
        <>
          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Perfil de Aprendizagem e Objetivos
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Nivel atual
                </label>
                <select
                  value={englishCurrentLevel}
                  onChange={(event) =>
                    setEnglishCurrentLevel(event.target.value)
                  }
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                >
                  <option value="">Selecionar...</option>
                  <option value="iniciante">Iniciante</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Motivo principal do estudo
                </label>
                <select
                  value={englishMainGoal}
                  onChange={(event) => setEnglishMainGoal(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                >
                  <option value="">Selecionar...</option>
                  <option value="viagem">Viagem</option>
                  <option value="trabalho">Trabalho</option>
                  <option value="certificacao">Certificacao TOEFL/IELTS</option>
                  <option value="lazer">Lazer</option>
                  <option value="conversacao">Conversacao</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Experiencias anteriores com o idioma
              </label>
              <textarea
                value={englishPreviousExperience}
                onChange={(event) =>
                  setEnglishPreviousExperience(event.target.value)
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Ja estudou antes? Morou fora? Teve contato profissional?"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Dificuldades mapeadas inicialmente
              </label>
              <textarea
                value={englishInitialDifficulties}
                onChange={(event) =>
                  setEnglishInitialDifficulties(event.target.value)
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Ex: trava ao falar, nao entende nativos, gramatica fraca..."
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Configuracoes de Contrato
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Modalidade
                </label>
                <select
                  value={englishClassMode}
                  onChange={(event) => setEnglishClassMode(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                >
                  <option value="">Selecionar...</option>
                  <option value="online">Online</option>
                  <option value="presencial">Presencial</option>
                  <option value="hibrido">Hibrido</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Frequencia
                </label>
                <input
                  type="text"
                  value={englishClassFrequency}
                  onChange={(event) =>
                    setEnglishClassFrequency(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  placeholder="Ex: 2x por semana"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Carga horaria
                </label>
                <input
                  type="text"
                  value={englishClassDuration}
                  onChange={(event) =>
                    setEnglishClassDuration(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  placeholder="Ex: 1 hora por aula"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Mensalidade ou hora/aula (R$)
                </label>
                <input
                  type="number"
                  value={englishBillingAmount}
                  onChange={(event) =>
                    setEnglishBillingAmount(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {record.specialty === "LAWYER" && (
        <>
          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Cadastro do Cliente
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Tipo de pessoa
              </label>
              <select
                value={legalPersonType}
                onChange={(event) => setLegalPersonType(event.target.value)}
                className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
              >
                <option value="PF">Pessoa Fisica</option>
                <option value="PJ">Pessoa Juridica</option>
              </select>
            </div>

            {legalPersonType === "PF" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Nacionalidade
                  </label>
                  <input
                    type="text"
                    value={legalNationality}
                    onChange={(event) =>
                      setLegalNationality(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Profissao
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(event) => setOccupation(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Estado civil
                  </label>
                  <select
                    value={legalMaritalStatus}
                    onChange={(event) =>
                      setLegalMaritalStatus(event.target.value)
                    }
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  >
                    <option value="">Selecionar...</option>
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viuvo(a)</option>
                    <option value="uniao_estavel">Uniao estavel</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={legalCpf}
                    onChange={(event) => setLegalCpf(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    RG
                  </label>
                  <input
                    type="text"
                    value={legalRg}
                    onChange={(event) => setLegalRg(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Razao social
                  </label>
                  <input
                    type="text"
                    value={legalCompanyName}
                    onChange={(event) =>
                      setLegalCompanyName(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Nome fantasia
                  </label>
                  <input
                    type="text"
                    value={legalTradeName}
                    onChange={(event) => setLegalTradeName(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={legalCnpj}
                    onChange={(event) => setLegalCnpj(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Inscricao estadual
                  </label>
                  <input
                    type="text"
                    value={legalStateRegistration}
                    onChange={(event) =>
                      setLegalStateRegistration(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Representante legal
                  </label>
                  <input
                    type="text"
                    value={legalRepresentativeName}
                    onChange={(event) =>
                      setLegalRepresentativeName(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    CPF do representante
                  </label>
                  <input
                    type="text"
                    value={legalRepresentativeCpf}
                    onChange={(event) =>
                      setLegalRepresentativeCpf(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Contatos e Endereco
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  E-mail
                </label>
                <input
                  type="email"
                  value={legalContactEmail}
                  onChange={(event) => setLegalContactEmail(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Telefones
                </label>
                <input
                  type="text"
                  value={legalContactPhones}
                  onChange={(event) =>
                    setLegalContactPhones(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  placeholder="Telefone, WhatsApp, comercial..."
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Endereco completo
              </label>
              <textarea
                value={legalAddress}
                onChange={(event) => setLegalAddress(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                placeholder="Rua, numero, complemento, bairro, cidade, UF, CEP..."
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
