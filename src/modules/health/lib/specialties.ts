export type HealthSpecialtyId =
  | "psicologia"
  | "nutricao"
  | "personal"
  | "ingles"
  | "advogado";

export type HealthSpecialty = {
  id: HealthSpecialtyId;
  name: string;
  description: string;
  image: string;
  color: string;
  accentText: string;
  accentBg: string;
  terms: string[];
};

export const healthSpecialties: HealthSpecialty[] = [
  {
    id: "psicologia",
    name: "Psicologia",
    description:
      "Terapia online para ansiedade, depressao, autoestima e autoconhecimento.",
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80",
    color:
      "group-hover:border-[#d73cbe]/50 group-hover:shadow-[0_0_30px_rgba(215,60,190,0.15)]",
    accentText: "text-[#d73cbe]",
    accentBg: "bg-[#d73cbe]",
    terms: [
      "Psicologo",
      "Psicologo(a)",
      "Psicologa",
      "Psicologa(a)",
      "Psicologia",
      "Psicólogo",
      "Psicólogo(a)",
      "Psicóloga",
      "Psicóloga(a)",
    ],
  },
  {
    id: "nutricao",
    name: "Nutricao",
    description: "Planos alimentares, emagrecimento, hipertrofia e rotina.",
    image:
      "https://images.pexels.com/photos/15391542/pexels-photo-15391542.jpeg?auto=compress&cs=tinysrgb&w=600",
    color:
      "group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    accentText: "text-emerald-400",
    accentBg: "bg-emerald-500",
    terms: ["Nutricionista", "Nutricao", "Nutrição"],
  },
  {
    id: "personal",
    name: "Personal Trainer",
    description: "Treinos personalizados e acompanhamento de rotina fisica.",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
    color:
      "group-hover:border-orange-500/50 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]",
    accentText: "text-orange-400",
    accentBg: "bg-orange-500",
    terms: ["Personal Trainer", "Personal", "Educador Fisico", "Educador Físico"],
  },
  {
    id: "ingles",
    name: "Professor de Ingles",
    description: "Aulas online focadas em conversacao, negocios e fluencia.",
    image:
      "https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=600&q=80",
    color:
      "group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    accentText: "text-blue-400",
    accentBg: "bg-blue-500",
    terms: [
      "Professor de Ingles",
      "Professor de Inglês",
      "Ingles",
      "Inglês",
      "English Teacher",
    ],
  },
  {
    id: "advogado",
    name: "Advogado",
    description: "Consultoria juridica online, contratos, duvidas e mediacao.",
    image:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80",
    color:
      "group-hover:border-amber-500/50 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    accentText: "text-amber-400",
    accentBg: "bg-amber-500",
    terms: ["Advogado", "Advogada", "Juridico", "Jurídico"],
  },
];

export function getHealthSpecialtyById(id: string) {
  return healthSpecialties.find((specialty) => specialty.id === id);
}
