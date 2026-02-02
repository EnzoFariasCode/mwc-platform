"use client";

import Link from "next/link";
import { Mail, Lock, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect, useRef } from "react";
import { loginUser } from "@/actions/auth/login-user";
import { toast } from "sonner";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const action = searchParams.get("action");
  const proName = searchParams.get("proName");
  const proId = searchParams.get("proId");
  const registered = searchParams.get("registered");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false); // <--- NOVO ESTADO

  // Ref para garantir que o toast só dispare uma vez
  const toastShown = useRef(false);

  useEffect(() => {
    if (registered === "true" && !toastShown.current) {
      toastShown.current = true; // Trava disparo duplo

      toast.success("Conta criada com sucesso!", {
        description: "Faça login para continuar.",
        duration: 5000,
      });

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("registered");
      router.replace(`/login?${newParams.toString()}`, { scroll: false });
    }
  }, [registered, router, searchParams]);

  const registerUrl = proId
    ? `/cadastro?action=chat&proId=${proId}&proName=${encodeURIComponent(
        proName || "",
      )}`
    : "/cadastro";

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);

    // Chama a action
    const result = await loginUser(formData);

    if (result?.error) {
      setErrorMessage(result.error);
      toast.error(result.error);
      setIsLoading(false); // Destrava para tentar de novo
    } else {
      toast.success("Login realizado!");

      // Redirecionamento forçado para garantir leitura de cookie
      if (action === "chat" && proId) {
        window.location.href = `/dashboard/chat?newChat=${proId}`;
      } else {
        window.location.href = "/dashboard/cliente";
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center lg:text-left space-y-2">
        <h1 className="text-3xl font-bold text-foreground font-futura">
          Bem-vindo de volta!
        </h1>

        {proName && (
          <div className="mt-4 mb-4 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3 text-left animate-in slide-in-from-top-2">
            <div className="p-1.5 bg-primary rounded-full mt-0.5 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                Você está a um passo de falar com{" "}
                <span className="text-primary">{proName}</span>.
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Faça login para iniciar o chat gratuitamente.
              </p>
            </div>
          </div>
        )}

        <p className="text-gray-400">
          Não tem uma conta?{" "}
          <Link
            href={registerUrl}
            className="text-primary hover:underline font-medium transition-all"
          >
            Crie gratuitamente
          </Link>
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center animate-in fade-in">
          {errorMessage}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleLogin}>
        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 ml-1">
            Email
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
              <Mail size={20} />
            </div>
            <input
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full bg-card/50 border border-input text-foreground rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-sm font-medium text-gray-300">Senha</label>
            <Link
              href="/recuperarsenha"
              className="text-xs text-gray-500 hover:text-primary transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
              <Lock size={20} />
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"} // <--- TIPO DINÂMICO
              required
              placeholder="••••••••"
              className="w-full bg-card/50 border border-input text-foreground rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-gray-600"
            />
            {/* BOTÃO OLHINHO */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary cursor-pointer hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verificando...
            </>
          ) : proName ? (
            "Entrar e Abrir Chat"
          ) : (
            "Entrar na Plataforma"
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-gray-500">Ou entre com</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="flex cursor-pointer items-center justify-center gap-2 bg-card hover:bg-card/80 border border-border hover:border-gray-600 text-gray-300 py-2.5 rounded-xl transition-all">
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
        </button>
        <button className="flex cursor-pointer items-center justify-center gap-2 bg-card hover:bg-card/80 border border-border hover:border-gray-600 text-gray-300 py-2.5 rounded-xl transition-all">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74s2.57-.99 3.87-.75c.68.03 2.19.47 3.12 1.87-3.02 1.63-2.5 5.8 1.12 7.15-.65 1.55-1.5 3.08-3.19 3.96zm-5.63-14c.48-2.62 2.4-4.5 4.58-4.28.34 2.89-3 6.06-4.58 4.28z" />
          </svg>
          <span className="font-medium">Apple</span>
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="text-center text-gray-500">Carregando...</div>}
    >
      <LoginContent />
    </Suspense>
  );
}
