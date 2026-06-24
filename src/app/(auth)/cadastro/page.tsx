"use client";

import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  Check,
  Calendar,
  Smile,
  Loader2,
  CheckCircle2,
  Briefcase,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { registerUser } from "@/modules/auth/actions/register-user";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs transition-colors ${met ? "text-green-500" : "text-muted-foreground"}`}
    >
      {met ? (
        <CheckCircle2 size={12} />
      ) : (
        <div className="w-3 h-3 rounded-full border border-current" />
      )}
      <span>{text}</span>
    </div>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const action = searchParams.get("action");
  const proId = searchParams.get("proId");
  const proName = searchParams.get("proName");

  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<
    "" | "TECH" | "HEALTH"
  >("");

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordFocus, setPasswordFocus] = useState(false);

  const reqs = {
    length: password.length >= 8 && password.length <= 20,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    numberOrSymbol: /[\d\W]/.test(password),
  };

  const isPasswordValid = Object.values(reqs).every(Boolean);

  const queryParams = proId
    ? `?action=chat&proId=${proId}&proName=${encodeURIComponent(proName || "")}`
    : "";
  const callbackUrl =
    action === "chat" && proId
      ? `/dashboard/chat?newChat=${proId}`
      : "/portal";

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error("A senha nao atende aos requisitos de seguranca.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams();
    params.set("registered", "true");

    if (action === "chat" && proId) {
      params.set("action", "chat");
      params.set("proId", proId);
      if (proName) params.set("proName", proName);
    }

    router.push(`/login?${params.toString()}`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center lg:text-left space-y-2">
        <h1 className="text-3xl font-bold text-foreground font-futura uppercase">
          Crie sua conta
        </h1>

        {proName ? (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3 text-left animate-in slide-in-from-top-2 mb-4">
            <div className="p-1.5 bg-primary rounded-full mt-0.5 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                Voce esta se cadastrando para falar com{" "}
                <span className="text-primary">{proName}</span>.
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Crie sua conta em segundos e inicie a conversa.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Ja tem uma conta?{" "}
            <Link
              href={`/login${queryParams}`}
              className="text-primary hover:underline font-medium transition-all"
            >
              Fazer Login
            </Link>
          </p>
        )}
      </div>

      <form className="space-y-5" onSubmit={handleRegister}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground ml-1">
            Nome Completo
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <User size={20} />
            </div>
            <input
              name="name"
              type="text"
              placeholder="Seu nome civil completo"
              required
              className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground ml-1">
            Como quer ser chamado?
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Smile size={20} />
            </div>
            <input
              name="displayName"
              type="text"
              placeholder="Ex: Joao da Silva"
              required
              className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground ml-1">
            Data de Nascimento
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10">
              <Calendar size={20} />
            </div>
            <input
              name="birthDate"
              type="date"
              required
              style={{ colorScheme: "dark" }}
              className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground [&::-webkit-calendar-picker-indicator]:opacity-0 md:[&::-webkit-calendar-picker-indicator]:opacity-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground ml-1">
            Email Profissional
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Mail size={20} />
            </div>
            <input
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground ml-1">
            Senha
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Lock size={20} />
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Crie uma senha forte"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocus(true)}
              className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {(passwordFocus || password.length > 0) && (
            <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-card border border-border rounded-lg animate-in fade-in slide-in-from-top-1">
              <PasswordRequirement met={reqs.length} text="8 a 20 caracteres" />
              <PasswordRequirement met={reqs.upper} text="Letra maiuscula" />
              <PasswordRequirement met={reqs.lower} text="Letra minuscula" />
              <PasswordRequirement
                met={reqs.numberOrSymbol}
                text="Numero ou simbolo"
              />
            </div>
          )}
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isPro"
              id="isPro"
              checked={isPro}
              onChange={(e) => {
                const nextIsPro = e.target.checked;
                setIsPro(nextIsPro);
                if (!nextIsPro) {
                  setSelectedIndustry("");
                }
              }}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
            />
            <label
              htmlFor="isPro"
              className="text-sm font-medium text-foreground cursor-pointer select-none"
            >
              Cadastrar como Profissional
            </label>
          </div>

          {isPro && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/20 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Area de atuacao principal
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
                    <Briefcase size={18} />
                  </div>
                  <select
                    name="industry"
                    required={isPro}
                    value={selectedIndustry}
                    onChange={(e) =>
                      setSelectedIndustry(
                        e.target.value as "" | "TECH" | "HEALTH",
                      )
                    }
                    className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="text-muted-foreground">
                      Selecione o seu setor...
                    </option>
                    <option value="TECH">Tecnologia, Design & Negocios</option>
                    <option value="HEALTH">
                      MWC Online - Consultorias e Atendimentos
                    </option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Qual sua especialidade principal?
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
                    <Briefcase size={18} />
                  </div>
                  {selectedIndustry === "HEALTH" ? (
                    <select
                      key="health-job-title"
                      name="jobTitle"
                      required={isPro}
                      defaultValue=""
                      className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-sm appearance-none cursor-pointer"
                    >
                      <option
                        value=""
                        disabled
                        className="text-muted-foreground"
                      >
                        Selecione sua especialidade...
                      </option>
                      <option value="Personal Trainer">Personal Trainer</option>
                      <option value="Nutricionista">Nutricionista</option>
                      <option value="Professor(a) de Ingles">
                        Professor(a) de Ingles
                      </option>
                      <option value="Psicologo(a)">Psicologo(a)</option>
                      <option value="Advogado(a)">Advogado(a)</option>
                    </select>
                  ) : (
                    <input
                      key="default-job-title"
                      name="jobTitle"
                      type="text"
                      required={isPro}
                      placeholder="Ex: Desenvolvedor, Designer, Product Manager..."
                      className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground text-sm"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tempo de experiencia
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
                    <Clock size={18} />
                  </div>
                  <select
                    name="experienceLevel"
                    required={isPro}
                    defaultValue=""
                    className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="text-muted-foreground">
                      Selecione...
                    </option>
                    <option value="0">Menos de 1 ano</option>
                    <option value="2">Entre 1 a 3 anos</option>
                    <option value="5">Entre 3 a 5 anos</option>
                    <option value="8">Mais de 5 anos</option>
                    <option value="12">Mais de 10 anos</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <div className="relative mt-0.5 flex items-center">
                    <input
                      type="checkbox"
                      name="professionalTermsAccepted"
                      required={isPro}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border bg-input transition-all checked:border-primary checked:bg-primary"
                    />
                    <Check className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100" />
                  </div>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    Li e aceito os termos profissionais da MWC Online,
                    incluindo taxa da plataforma de 10%, regras de repasse em
                    escrow, liberacao de saldo apos conclusao, politica de
                    cancelamento pelo profissional, no-show do paciente e
                    regras de saque.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 pt-2">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id="terms"
              required
              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border bg-input checked:border-primary checked:bg-primary transition-all"
            />
            <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100" />
          </div>
          <label
            htmlFor="terms"
            className="text-xs text-muted-foreground cursor-pointer select-none leading-relaxed"
          >
            Eu concordo com os{" "}
            <Link href="/termos" className="text-foreground hover:underline">
              Termos de Uso
            </Link>{" "}
            gerais da plataforma, incluindo as regras da MWC Online para
            agendamentos, pagamentos, cancelamentos e reembolsos, e com a{" "}
            <Link
              href="/privacidade"
              className="text-foreground hover:underline"
            >
              Politica de Privacidade
            </Link>
            .
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading || !isPasswordValid}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Criando conta...
            </>
          ) : proName ? (
            "Criar Conta e Iniciar Chat"
          ) : (
            "Criar Conta Gratuita"
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou cadastre-se com
          </span>
        </div>
      </div>

      <div>
        <button
          type="button"
          disabled={isLoading || isSocialLoading}
          onClick={() => {
            setIsSocialLoading(true);
            signIn("google", { callbackUrl });
          }}
          className="flex w-full cursor-pointer items-center justify-center gap-2 bg-card hover:bg-card/80 border border-border hover:border-gray-600 text-gray-300 py-2.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-wait"
        >
          {isSocialLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="font-medium">Redirecionando...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="font-medium">Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-muted-foreground">Carregando...</div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}


