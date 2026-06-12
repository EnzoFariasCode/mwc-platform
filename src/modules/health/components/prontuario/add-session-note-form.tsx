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

      const result = await createSessionNote(clientRecordId, {
        sessionDate,
        content: finalContent,
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
