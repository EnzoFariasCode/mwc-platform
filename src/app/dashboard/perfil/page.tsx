"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import {
  Camera,
  MapPin,
  Link as LinkIcon,
  Github,
  Linkedin,
  Mail,
  Edit3,
  Plus,
  CheckCircle2,
  Award,
  Star,
  ShieldCheck,
} from "lucide-react";

export default function PerfilPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        {/* --- HEADER DO PERFIL (Capa + Avatar) --- */}
        <div className="relative bg-card border border-border rounded-2xl overflow-hidden group">
          {/* Capa / Banner */}
          <div className="h-48 bg-gradient-to-r from-blue-900 via-primary/40 to-purple-900 relative">
            <button className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-lg backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* Dados Principais */}
          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-4 flex justify-between items-end">
              {/* Avatar Grande */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-card bg-slate-800 flex items-center justify-center text-4xl font-bold text-white relative overflow-hidden">
                  {/* Imagem ou Iniciais */}
                  <span className="z-10">JS</span>
                  {/* Botão Editar Avatar */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-20">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                {/* Badge de Verificado */}
                <div
                  className="absolute bottom-2 right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-card"
                  title="Identidade Verificada"
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 mb-2">
                <button className="px-4 py-2 bg-card border border-border hover:border-primary/50 text-foreground rounded-xl font-bold text-sm transition-all cursor-pointer">
                  Ver como Público
                </button>
                <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 cursor-pointer">
                  Salvar Alterações
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground font-futura flex items-center gap-3">
                  João Silva
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <Edit3 className="w-5 h-5" />
                  </button>
                </h1>
                <p className="text-lg text-primary font-medium mt-1">
                  Desenvolvedor Fullstack | React & Node.js
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> São Paulo, Brasil
                  </span>
                  <span className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" /> joaosilva.dev
                  </span>
                  <span className="flex items-center gap-1 text-green-400 font-bold">
                    <ClockIcon /> Responde em ~1h
                  </span>
                </div>
              </div>

              {/* Card de Stats Rápido */}
              <div className="bg-background/50 p-4 rounded-xl border border-border flex gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold">
                    Valor/Hora
                  </p>
                  <p className="text-xl font-bold text-foreground">R$ 120</p>
                </div>
                <div className="w-px bg-border h-10" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold">
                    Avaliação
                  </p>
                  <div className="flex items-center gap-1 justify-center">
                    <span className="text-xl font-bold text-foreground">
                      5.0
                    </span>
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- GRID DE CONTEÚDO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUNA ESQUERDA (Principal) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sobre */}
            <SectionCard title="Sobre Mim">
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                Sou um desenvolvedor apaixonado com mais de 5 anos de
                experiência em criar soluções web robustas e escaláveis.
                Especialista em ecossistema JavaScript. Tenho experiência
                comprovada em: • Desenvolvimento de Front-end com React e
                Next.js • Back-end com Node.js e NestJS • Bancos de dados SQL e
                NoSQL Meu objetivo é entregar não apenas código, mas valor real
                para o seu negócio através da tecnologia.
              </p>
            </SectionCard>

            {/* Habilidades */}
            <SectionCard title="Habilidades e Tecnologias">
              <div className="flex flex-wrap gap-2">
                {[
                  "React.js",
                  "Next.js",
                  "TypeScript",
                  "Node.js",
                  "Tailwind CSS",
                  "PostgreSQL",
                  "Docker",
                  "AWS",
                  "Figma",
                ].map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-slate-300 hover:border-primary/50 transition-colors cursor-default"
                  >
                    {skill}
                  </span>
                ))}
                <button className="px-3 py-1.5 border border-dashed border-border text-muted-foreground rounded-lg text-sm hover:text-primary hover:border-primary transition-colors flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>
            </SectionCard>

            {/* Portfólio (Grid) */}
            <SectionCard title="Portfólio Recente">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="group relative aspect-video bg-slate-800 rounded-xl overflow-hidden border border-border cursor-pointer"
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-bold bg-slate-900">
                      Projeto Exemplo {item}
                    </div>
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <p className="text-white font-bold mb-2">
                        E-commerce Fitness
                      </p>
                      <span className="text-xs text-slate-300 px-2 py-1 border border-white/20 rounded">
                        Ver Detalhes
                      </span>
                    </div>
                  </div>
                ))}
                <div className="aspect-video border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer gap-2">
                  <Plus className="w-6 h-6" />
                  <span className="text-sm font-bold">Adicionar Projeto</span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* COLUNA DIREITA (Lateral) */}
          <div className="space-y-6">
            {/* Nível do Perfil */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-foreground">Força do Perfil</h3>
                <span className="text-primary font-bold">85%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2 mb-4">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: "85%" }}
                ></div>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Foto de
                  Perfil
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Bio
                  preenchida
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />{" "}
                  Adicionar Linkedin
                </li>
              </ul>
            </div>

            {/* Verificações */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                Verificações
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Identidade</span>
                  <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">
                    Verificado
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Email</span>
                  <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">
                    Verificado
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Pagamento</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">
                    Pendente
                  </span>
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-foreground mb-4">Redes Sociais</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer text-left">
                  <Github className="w-5 h-5 text-white" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Github</p>
                    <p className="text-xs text-slate-500">Conectar conta</p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500" />
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer text-left">
                  <Linkedin className="w-5 h-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">LinkedIn</p>
                    <p className="text-xs text-slate-500">Conectar conta</p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// Sub-componente para os Cards de Seção
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 relative group">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground font-futura">
          {title}
        </h2>
        <button className="p-2 hover:bg-background rounded-lg text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
