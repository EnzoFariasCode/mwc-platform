"use client";

import {
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";

// Ajuste o caminho da imagem se necessário
import heroBg from "@/assets/images/HowToBeWorker/hero-bg.jpg";
import FooterContact from "@/components/ui/FooterContact";
export default function HowToBeWorkerPage() {
  return (
    <div className="flex flex-col gap-0 bg-slate-950">
      {/* === HERO SECTION === */}
      <section className="relative py-24 lg:py-32 overflow-hidden min-h-[650px] flex items-center">
        {/* Background Fixed */}
        <div
          className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-fixed bg-center-bottom opacity-60"
          style={{
            backgroundImage: `url(${heroBg.src})`,
            backgroundSize: "cover",
          }}
          role="img"
          aria-label="Mulher profissional sorrindo"
        />

        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/70"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#d73cbe] rounded-full blur-[120px] opacity-20 pointer-events-none z-0" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-futura text-white mb-6 leading-tight drop-shadow-2xl">
            Transforme suas habilidades <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d73cbe] to-violet-400">
              em Renda Extra e Recorrente
            </span>
          </h1>

          <p className="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-lg font-medium">
            O método mais seguro e descomplicado do mercado. Você foca no
            trabalho, nós garantimos o pagamento e a segurança.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 rounded-full bg-[#d73cbe] hover:bg-[#c02aa8] text-white font-bold text-lg shadow-lg shadow-[#d73cbe]/25 transition-all hover:-translate-y-1"
            >
              Começar Agora
            </Link>

            <Link
              href="#como-funciona"
              className="px-8 py-4 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white font-medium text-lg transition-all backdrop-blur-sm flex items-center justify-center"
            >
              Entender o Processo
            </Link>
          </div>
        </div>
      </section>

      {/* === COMO FUNCIONA === */}
      <section id="como-funciona" className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4 font-futura">
              Como Funciona?
            </h2>
            <p className="text-slate-400">
              Sem burocracia desnecessária. Simples e direto.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-[#d73cbe]" />}
              title="1. Receba & Dê Lances"
              desc="Visualize projetos postados por clientes reais e envie sua proposta na hora."
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-violet-400" />}
              title="2. Chat Interno"
              desc="Negocie detalhes e tire dúvidas diretamente com o cliente pelo nosso chat seguro."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8 text-emerald-400" />}
              title="3. Segurança Total"
              desc="O valor do serviço fica retido conosco. Você tem a garantia que vai receber."
            />
            <FeatureCard
              icon={<Wallet className="w-8 h-8 text-blue-400" />}
              title="4. Receba o Valor"
              desc="Assim que o cliente aprovar a entrega, o valor é liberado para sua conta."
            />
          </div>
        </div>
      </section>

      {/* === DASHBOARD PREVIEW === */}
      <section className="py-20 border-t border-white/5 bg-slate-950">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold text-white font-futura">
              Controle total na palma da mão
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Diferente de outros sites, aqui você tem um Dashboard completo.
              Acompanhe suas notas, feedbacks de clientes, faturamento mensal e
              status de cada projeto em tempo real.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="text-[#d73cbe] w-5 h-5" /> Gestão de
                reputação (Avaliações)
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="text-[#d73cbe] w-5 h-5" /> Histórico
                financeiro detalhado
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="text-[#d73cbe] w-5 h-5" /> Chat
                centralizado
              </li>
            </ul>
          </div>
          <div className="flex-1 w-full h-64 md:h-96 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#d73cbe]/5 group-hover:bg-[#d73cbe]/10 transition-colors"></div>
            <p className="text-slate-500 font-medium">
              Imagem do Dashboard do Profissional
            </p>
          </div>
        </div>
      </section>

      {/* === PLANOS === */}
      <section id="planos" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-futura">
              Escolha seu nível de atuação
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Comece gratuitamente ou acelere seus resultados com nossos planos
              Pro.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            <PlanCard
              title="Iniciante"
              price="Grátis"
              features={[
                "1 Trabalho por vez",
                "Acesso ao Chat",
                "Dashboard Básico",
                "Taxa padrão de serviço",
              ]}
            />

            <PlanCard
              title="Starter"
              price="R$ 14,99"
              period="/mês"
              isPopular
              features={[
                "Até 3 trabalhos simultâneos",
                "Selo de Verificado",
                "Perfil Recomendado na busca",
                "Suporte Prioritário",
                "Taxa reduzida",
              ]}
              buttonColor="bg-[#d73cbe] hover:bg-[#c02aa8]"
            />

            <PlanCard
              title="Advanced"
              price="R$ 24,99"
              period="/mês"
              highlight="Melhor Custo-Benefício"
              borderGlow
              features={[
                "Até 5 trabalhos simultâneos",
                "Selo de Verificado Gold",
                "Super Recomendado (Topo)",
                "Destaque na Landing Page Oficial",
                "Dashboard de Analytics Avançado",
                "Menor taxa do mercado",
              ]}
              buttonColor="bg-gradient-to-r from-violet-600 to-[#d73cbe] hover:opacity-90"
            />
          </div>
        </div>
      </section>
      <FooterContact />
    </div>
  );
}

// --- SUBCOMPONENTES ---

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-1">
      <div className="mb-4 p-3 rounded-lg bg-slate-950 w-fit border border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  period,
  features,
  isPopular,
  highlight,
  borderGlow,
  buttonColor,
}: any) {
  return (
    <div
      className={`relative p-8 rounded-3xl border flex flex-col h-full ${
        borderGlow
          ? "border-[#d73cbe]/50 shadow-[0_0_30px_rgba(215,60,190,0.15)]"
          : "border-white/10 bg-white/5"
      } ${isPopular ? "bg-slate-900" : ""}`}
    >
      {highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-[#d73cbe] text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
          {highlight}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-slate-300 font-medium mb-2">{title}</h3>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold text-white font-futura">
            {price}
          </span>
          <span className="text-slate-500 mb-1 text-sm">{period}</span>
        </div>
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {features.map((item: string, idx: number) => (
          <li
            key={idx}
            className="flex items-start gap-3 text-sm text-slate-300"
          >
            <CheckCircle2 className="w-5 h-5 text-[#d73cbe] shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      <button
        className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
          buttonColor || "bg-slate-800 hover:bg-slate-700"
        }`}
      >
        Escolher {title}
      </button>
    </div>
  );
}
