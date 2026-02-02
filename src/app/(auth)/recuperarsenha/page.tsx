"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import {
  Mail,
  KeyRound,
  Lock,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  requestResetCode,
  verifyResetCode,
  resetPasswordWithCode,
} from "@/actions/auth/password-reset";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // AGORA SÃO 3 ETAPAS
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [isLoading, setIsLoading] = useState(false);

  // Estados dos inputs
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // ETAPA 1: Enviar Email
  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await requestResetCode(email);
    setIsLoading(false);

    if (res.success) {
      setStep("code"); // Vai para a tela de código
      toast.success("Código enviado para seu e-mail.");
    } else {
      toast.error(res.error);
    }
  };

  // ETAPA 2: Verificar Código
  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await verifyResetCode(email, code); // Nova função só para validar
    setIsLoading(false);

    if (res.success) {
      setStep("password"); // Vai para a tela de nova senha
      toast.success("Código validado com sucesso.");
    } else {
      toast.error(res.error);
    }
  };

  // ETAPA 3: Salvar Nova Senha
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    // Enviamos o código novamente para o backend confirmar a autenticidade final
    const res = await resetPasswordWithCode(email, code, newPassword);
    setIsLoading(false);

    if (res.success) {
      toast.success("Senha alterada com sucesso!");
      router.push("/login");
    } else {
      toast.error(res.error);
    }
  };

  // Título e Descrição Dinâmicos
  const renderHeader = () => {
    switch (step) {
      case "email":
        return {
          title: "Esqueceu a senha?",
          desc: "Digite seu e-mail para receber um código.",
        };
      case "code":
        return {
          title: "Verifique seu e-mail",
          desc: `Enviamos um código para ${email}`,
        };
      case "password":
        return {
          title: "Criar nova senha",
          desc: "Sua senha deve ser diferente da anterior.",
        };
    }
  };
  const header = renderHeader();

  return (
    <div className="space-y-6 animate-fade-in max-w-md mx-auto">
      {/* Botão Voltar */}
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Voltar para Login
      </Link>

      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-3xl font-bold text-foreground font-futura">
          {header.title}
        </h1>
        <p className="text-muted-foreground">{header.desc}</p>
      </div>

      {/* --- ETAPA 1: EMAIL --- */}
      {step === "email" && (
        <form
          onSubmit={handleRequestCode}
          className="space-y-4 animate-in slide-in-from-right-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground ml-1">
              Email Cadastrado
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Mail size={20} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Enviar Código"}
          </button>
        </form>
      )}

      {/* --- ETAPA 2: CÓDIGO --- */}
      {step === "code" && (
        <form
          onSubmit={handleVerifyCode}
          className="space-y-4 animate-in slide-in-from-right-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground ml-1">
              Código de 6 dígitos
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <KeyRound size={20} />
              </div>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground tracking-widest font-mono text-lg"
              />
            </div>
            <div className="flex justify-between items-center px-1">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-xs text-muted-foreground hover:text-primary underline"
              >
                Corrigir e-mail
              </button>
              <button
                type="button"
                onClick={handleRequestCode}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Reenviar código
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || code.length < 6}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Validar Código"
            )}
          </button>
        </form>
      )}

      {/* --- ETAPA 3: NOVA SENHA --- */}
      {step === "password" && (
        <form
          onSubmit={handleResetPassword}
          className="space-y-4 animate-in slide-in-from-right-4"
        >
          {/* Nova Senha */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground ml-1">
              Nova Senha
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-input border border-border text-foreground rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground ml-1">
              Confirmar Senha
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                className={`w-full bg-input border text-foreground rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:ring-1 transition-all placeholder:text-muted-foreground ${
                  confirmPassword && confirmPassword !== newPassword
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                    : "border-border focus:border-primary focus:ring-primary/50"
                }`}
              />
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-400 ml-1">
                As senhas não coincidem.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              isLoading || !newPassword || newPassword !== confirmPassword
            }
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Alterar Senha"}
          </button>
        </form>
      )}
    </div>
  );
}
