"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { createSessionNote } from "@/modules/health/actions/client-record-actions";

type Props = {
  clientRecordId: string;
  patientId: string;
  specialty: string;
};

const moodOptions = [
  "Ansioso",
  "Calmo",
  "Depressivo",
  "Receptivo",
  "Agitado",
  "Resistente",
  "Emocionado",
  "Fechado",
];

const englishSkillOptions = ["Speaking", "Listening", "Reading", "Writing"];

export function AddSessionNoteForm({
  clientRecordId,
  specialty,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [content, setContent] = useState("");
  const [evolution, setEvolution] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [moodOnArrival, setMoodOnArrival] = useState<string[]>([]);
  const [techniquesUsed, setTechniquesUsed] = useState("");
  const [nutritionWeight, setNutritionWeight] = useState("");
  const [nutritionHeight, setNutritionHeight] = useState("");
  const [waistCircumference, setWaistCircumference] = useState("");
  const [abdomenCircumference, setAbdomenCircumference] = useState("");
  const [hipCircumference, setHipCircumference] = useState("");
  const [armCircumference, setArmCircumference] = useState("");
  const [skinfolds, setSkinfolds] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [visceralFat, setVisceralFat] = useState("");
  const [foodRecall24h, setFoodRecall24h] = useState("");
  const [dietAdherenceScore, setDietAdherenceScore] = useState("");
  const [dietAdherenceNotes, setDietAdherenceNotes] = useState("");
  const [nutritionPlan, setNutritionPlan] = useState("");
  const [nutritionFilesNotes, setNutritionFilesNotes] = useState("");
  const [englishAttendance, setEnglishAttendance] = useState("");
  const [englishLessonTopic, setEnglishLessonTopic] = useState("");
  const [englishFocusedSkills, setEnglishFocusedSkills] = useState<string[]>(
    [],
  );
  const [englishMaterialUsed, setEnglishMaterialUsed] = useState("");
  const [englishEngagementLevel, setEnglishEngagementLevel] = useState("");
  const [englishRecurringErrors, setEnglishRecurringErrors] = useState("");
  const [englishHomework, setEnglishHomework] = useState("");
  const [englishPreviousHomeworkStatus, setEnglishPreviousHomeworkStatus] =
    useState("");
  const [englishNextLessonPlan, setEnglishNextLessonPlan] = useState("");
  const [englishFilesNotes, setEnglishFilesNotes] = useState("");

  const parsedWeight = Number(nutritionWeight.replace(",", "."));
  const parsedHeight = Number(nutritionHeight.replace(",", "."));
  const normalizedHeight =
    Number.isFinite(parsedHeight) && parsedHeight > 3
      ? parsedHeight / 100
      : parsedHeight;
  const calculatedBmi =
    Number.isFinite(parsedWeight) &&
    parsedWeight > 0 &&
    Number.isFinite(normalizedHeight) &&
    normalizedHeight > 0
      ? parsedWeight / (normalizedHeight * normalizedHeight)
      : null;

  const handleSubmit = () => {
    if (content.trim().length < 10) {
      toast.error("A nota deve ter pelo menos 10 caracteres.");
      return;
    }

    startTransition(async () => {
      const psychologyExtra =
        specialty === "PSYCHOLOGIST"
          ? [
              moodOnArrival.length > 0
                ? `Estado inicial: ${moodOnArrival.join(", ")}`
                : "",
              techniquesUsed ? `Tecnicas: ${techniquesUsed}` : "",
            ]
              .filter(Boolean)
              .join("\n")
          : "";

      const fullContent = psychologyExtra
        ? `${content}\n\n---\n${psychologyExtra}`
        : content;

      const nutritionExtra =
        specialty === "NUTRITIONIST"
          ? [
              "Evolucao nutricional:",
              nutritionWeight ? `Peso atual: ${nutritionWeight} kg` : "",
              nutritionHeight ? `Estatura: ${nutritionHeight} m/cm` : "",
              calculatedBmi ? `IMC calculado: ${calculatedBmi.toFixed(2)}` : "",
              waistCircumference ? `Cintura: ${waistCircumference} cm` : "",
              abdomenCircumference
                ? `Abdomen: ${abdomenCircumference} cm`
                : "",
              hipCircumference ? `Quadril: ${hipCircumference} cm` : "",
              armCircumference ? `Braco: ${armCircumference} cm` : "",
              skinfolds ? `Dobras cutaneas: ${skinfolds}` : "",
              bodyFatPercent ? `% gordura: ${bodyFatPercent}` : "",
              muscleMass ? `Massa muscular: ${muscleMass} kg` : "",
              visceralFat ? `Gordura visceral: ${visceralFat}` : "",
              foodRecall24h ? `Recordatorio 24h: ${foodRecall24h}` : "",
              dietAdherenceScore
                ? `Adesao a dieta anterior: ${dietAdherenceScore}/10`
                : "",
              dietAdherenceNotes
                ? `Dificuldades/adesao: ${dietAdherenceNotes}`
                : "",
              nutritionPlan ? `Plano alimentar/metas: ${nutritionPlan}` : "",
              nutritionFilesNotes
                ? `Arquivos/exames enviados: ${nutritionFilesNotes}`
                : "",
            ]
              .filter(Boolean)
              .join("\n")
          : "";

      const finalContent = nutritionExtra
        ? `${fullContent}\n\n---\n${nutritionExtra}`
        : fullContent;

      const englishExtra =
        specialty === "ENGLISH_TEACHER"
          ? [
              "Diario de aula:",
              englishAttendance ? `Presenca: ${englishAttendance}` : "",
              englishLessonTopic ? `Topico da aula: ${englishLessonTopic}` : "",
              englishFocusedSkills.length > 0
                ? `Habilidades focadas: ${englishFocusedSkills.join(", ")}`
                : "",
              englishMaterialUsed ? `Material utilizado: ${englishMaterialUsed}` : "",
              englishEngagementLevel
                ? `Participacao/engajamento: ${englishEngagementLevel}`
                : "",
              englishRecurringErrors
                ? `Erros recorrentes/pontos de atencao: ${englishRecurringErrors}`
                : "",
              englishHomework ? `Homework enviado: ${englishHomework}` : "",
              englishPreviousHomeworkStatus
                ? `Homework anterior: ${englishPreviousHomeworkStatus}`
                : "",
              englishNextLessonPlan
                ? `Planejamento da proxima aula: ${englishNextLessonPlan}`
                : "",
              englishFilesNotes
                ? `Meus envios/materiais: ${englishFilesNotes}`
                : "",
            ]
              .filter(Boolean)
              .join("\n")
          : "";

      const noteContent = englishExtra
        ? `${finalContent}\n\n---\n${englishExtra}`
        : finalContent;

      const result = await createSessionNote(clientRecordId, {
        sessionDate,
        content: noteContent,
        evolution: evolution || undefined,
        nextSteps: nextSteps || undefined,
        privateNotes: privateNotes || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Nota de sessao registrada.");
      setContent("");
      setEvolution("");
      setNextSteps("");
      setPrivateNotes("");
      setMoodOnArrival([]);
      setTechniquesUsed("");
      setNutritionWeight("");
      setNutritionHeight("");
      setWaistCircumference("");
      setAbdomenCircumference("");
      setHipCircumference("");
      setArmCircumference("");
      setSkinfolds("");
      setBodyFatPercent("");
      setMuscleMass("");
      setVisceralFat("");
      setFoodRecall24h("");
      setDietAdherenceScore("");
      setDietAdherenceNotes("");
      setNutritionPlan("");
      setNutritionFilesNotes("");
      setEnglishAttendance("");
      setEnglishLessonTopic("");
      setEnglishFocusedSkills([]);
      setEnglishMaterialUsed("");
      setEnglishEngagementLevel("");
      setEnglishRecurringErrors("");
      setEnglishHomework("");
      setEnglishPreviousHomeworkStatus("");
      setEnglishNextLessonPlan("");
      setEnglishFilesNotes("");
      setIsOpen(false);
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#d73cbe]/20 bg-[#d73cbe]/5 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[#d73cbe]/10"
      >
        <div className="flex items-center gap-3">
          <PlusCircle className="h-5 w-5 text-[#d73cbe]" />
          <span className="text-sm font-bold uppercase tracking-tight text-white">
            Registrar nova nota de sessao
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-4 px-6 pb-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
              Data da sessao
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(event) => setSessionDate(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
            />
          </div>

          {specialty === "PSYCHOLOGIST" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Estado inicial do paciente
              </label>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() =>
                      setMoodOnArrival((prev) =>
                        prev.includes(mood)
                          ? prev.filter((item) => item !== mood)
                          : [...prev, mood],
                      )
                    }
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                      moodOnArrival.includes(mood)
                        ? "border-[#d73cbe]/50 bg-[#d73cbe]/20 text-[#d73cbe]"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
          )}

          {specialty === "NUTRITIONIST" && (
            <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Avaliacao Antropometrica
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Peso atual (kg)
                  </label>
                  <input
                    type="number"
                    value={nutritionWeight}
                    onChange={(event) => setNutritionWeight(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Estatura (m ou cm)
                  </label>
                  <input
                    type="number"
                    value={nutritionHeight}
                    onChange={(event) => setNutritionHeight(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    IMC automatico
                  </label>
                  <div className="rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm font-bold text-[#d73cbe]">
                    {calculatedBmi ? calculatedBmi.toFixed(2) : "Preencha peso e altura"}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Cintura (cm)
                  </label>
                  <input
                    type="number"
                    value={waistCircumference}
                    onChange={(event) =>
                      setWaistCircumference(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Abdomen (cm)
                  </label>
                  <input
                    type="number"
                    value={abdomenCircumference}
                    onChange={(event) =>
                      setAbdomenCircumference(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Quadril (cm)
                  </label>
                  <input
                    type="number"
                    value={hipCircumference}
                    onChange={(event) =>
                      setHipCircumference(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Braco (cm)
                  </label>
                  <input
                    type="number"
                    value={armCircumference}
                    onChange={(event) =>
                      setArmCircumference(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Dobras cutaneas
                  </label>
                  <input
                    type="text"
                    value={skinfolds}
                    onChange={(event) => setSkinfolds(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    placeholder="Ex: triceps 12mm, subescapular 18mm..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    % gordura
                  </label>
                  <input
                    type="number"
                    value={bodyFatPercent}
                    onChange={(event) =>
                      setBodyFatPercent(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Massa muscular (kg)
                  </label>
                  <input
                    type="number"
                    value={muscleMass}
                    onChange={(event) => setMuscleMass(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Gordura visceral
                  </label>
                  <input
                    type="text"
                    value={visceralFat}
                    onChange={(event) => setVisceralFat(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {specialty === "ENGLISH_TEACHER" && (
            <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Metadados da Aula
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Presenca
                  </label>
                  <select
                    value={englishAttendance}
                    onChange={(event) =>
                      setEnglishAttendance(event.target.value)
                    }
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  >
                    <option value="">Selecionar...</option>
                    <option value="presente">Presente</option>
                    <option value="falta_justificada">Falta justificada</option>
                    <option value="falta_nao_justificada">
                      Falta nao justificada
                    </option>
                    <option value="atraso">Atraso</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Topico da aula
                  </label>
                  <input
                    type="text"
                    value={englishLessonTopic}
                    onChange={(event) =>
                      setEnglishLessonTopic(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    placeholder="Ex: Present Perfect, Business Vocabulary..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Habilidades focadas na sessao
                </label>
                <div className="flex flex-wrap gap-2">
                  {englishSkillOptions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() =>
                        setEnglishFocusedSkills((prev) =>
                          prev.includes(skill)
                            ? prev.filter((item) => item !== skill)
                            : [...prev, skill],
                        )
                      }
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                        englishFocusedSkills.includes(skill)
                          ? "border-[#d73cbe]/50 bg-[#d73cbe]/20 text-[#d73cbe]"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Material utilizado
                </label>
                <input
                  type="text"
                  value={englishMaterialUsed}
                  onChange={(event) =>
                    setEnglishMaterialUsed(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  placeholder="Livro, unidade, artigo, video, audio..."
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
              Nota da sessao <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={5}
              placeholder="Descreva o que foi trabalhado nesta sessao..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
              Evolucao do paciente
            </label>
            <textarea
              value={evolution}
              onChange={(event) => setEvolution(event.target.value)}
              rows={3}
              placeholder="Como o paciente evoluiu desde a ultima sessao..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
            />
          </div>

          {specialty === "NUTRITIONIST" && (
            <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Conduta e Prescricao
              </p>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Recordatorio 24h / Diario alimentar
                </label>
                <textarea
                  value={foodRecall24h}
                  onChange={(event) => setFoodRecall24h(event.target.value)}
                  rows={4}
                  placeholder="Anote o que o paciente relatou ter comido..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-[0.5fr_1.5fr]">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Adesao (1 a 10)
                  </label>
                  <input
                    type="number"
                    value={dietAdherenceScore}
                    onChange={(event) =>
                      setDietAdherenceScore(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    min="1"
                    max="10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Dificuldades encontradas
                  </label>
                  <input
                    type="text"
                    value={dietAdherenceNotes}
                    onChange={(event) =>
                      setDietAdherenceNotes(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                    placeholder="Fome, rotina, compulsao, falta de preparo..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Plano alimentar / Metas ate o retorno
                </label>
                <textarea
                  value={nutritionPlan}
                  onChange={(event) => setNutritionPlan(event.target.value)}
                  rows={4}
                  placeholder="Mudancas na dieta, metas e combinados..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Meus envios / Arquivos e exames
                </label>
                <textarea
                  value={nutritionFilesNotes}
                  onChange={(event) =>
                    setNutritionFilesNotes(event.target.value)
                  }
                  rows={3}
                  placeholder="Registre exames, PDFs de dieta ou arquivos recebidos/enviados. O upload real pode ser integrado depois."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                />
              </div>
            </div>
          )}

          {specialty === "ENGLISH_TEACHER" && (
            <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Desempenho, Homework e Proximos Passos
              </p>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Participacao / engajamento
                </label>
                <select
                  value={englishEngagementLevel}
                  onChange={(event) =>
                    setEnglishEngagementLevel(event.target.value)
                  }
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
                  Erros recorrentes / Pontos de atencao
                </label>
                <textarea
                  value={englishRecurringErrors}
                  onChange={(event) =>
                    setEnglishRecurringErrors(event.target.value)
                  }
                  rows={3}
                  placeholder="Pronuncia, gramatica, vocabulário ou confusoes recorrentes..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Homework enviado
                  </label>
                  <textarea
                    value={englishHomework}
                    onChange={(event) => setEnglishHomework(event.target.value)}
                    rows={3}
                    placeholder="Licao de casa enviada ao aluno..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Status do homework anterior
                  </label>
                  <select
                    value={englishPreviousHomeworkStatus}
                    onChange={(event) =>
                      setEnglishPreviousHomeworkStatus(event.target.value)
                    }
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors focus:border-[#d73cbe]/50 focus:outline-none"
                  >
                    <option value="">Selecionar...</option>
                    <option value="entregue">Entregue</option>
                    <option value="nao_entregue">Nao entregue</option>
                    <option value="parcial">Feito parcialmente</option>
                    <option value="nao_aplicavel">Nao aplicavel</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Planejamento para a proxima aula
                </label>
                <textarea
                  value={englishNextLessonPlan}
                  onChange={(event) =>
                    setEnglishNextLessonPlan(event.target.value)
                  }
                  rows={3}
                  placeholder="Rascunho interno da proxima aula..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Meus envios / Materiais e arquivos
                </label>
                <textarea
                  value={englishFilesNotes}
                  onChange={(event) => setEnglishFilesNotes(event.target.value)}
                  rows={3}
                  placeholder="Registre PDFs, audios, exercicios, gabaritos ou links enviados. O upload real pode ser integrado depois."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
                />
              </div>
            </div>
          )}

          {specialty === "PSYCHOLOGIST" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Intervencoes e tecnicas utilizadas
              </label>
              <textarea
                value={techniquesUsed}
                onChange={(event) => setTechniquesUsed(event.target.value)}
                rows={2}
                placeholder="Ex: Reestruturacao cognitiva, exposicao gradual, mindfulness..."
                className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
              Proximos passos / Tarefas
            </label>
            <textarea
              value={nextSteps}
              onChange={(event) => setNextSteps(event.target.value)}
              rows={3}
              placeholder="O que ficou combinado para a proxima sessao..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              Anotacoes privadas
              <span className="text-[10px] font-normal normal-case tracking-normal text-slate-600">
                (apenas voce ve)
              </span>
            </label>
            <textarea
              value={privateNotes}
              onChange={(event) => setPrivateNotes(event.target.value)}
              rows={3}
              placeholder="Impressoes pessoais, hipoteses, lembretes internos..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/50 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="cursor-pointer rounded-xl bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/10 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || content.trim().length < 10}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#d73cbe] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#c032a8] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              Salvar nota
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
