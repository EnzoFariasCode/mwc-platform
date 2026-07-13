import { LegalDocumentPage } from "@/modules/legal/components/legal-document-page";
import { PROFESSIONAL_TERMS } from "@/modules/legal/terms-versions";

const sections = [
  {
    title: "1. Aplicacao",
    paragraphs: [
      "Estes termos se aplicam exclusivamente a profissionais com setor principal HEALTH que oferecem consultas, aulas ou orientacoes no MWC Online. Projetos e planos do Marketplace Tech nao fazem parte deste documento.",
    ],
  },
  {
    title: "2. Perfil e responsabilidade profissional",
    paragraphs: [
      "O profissional deve informar especialidade, experiencia e registro quando aplicavel, mantendo os dados atualizados. A exibicao dessas informacoes nao equivale a verificacao documental pela MWC, salvo indicacao expressa de processo concluido.",
    ],
  },
  {
    title: "3. Agenda e atendimento",
    paragraphs: [
      "O profissional define disponibilidade, duracao e valor. Depois da confirmacao do pagamento, paciente e profissional recebem acesso ao atendimento online no horario marcado.",
    ],
  },
  {
    title: "4. Taxa e liberacao do saldo",
    paragraphs: [
      "A MWC aplica taxa de 10% sobre o atendimento processado. O saldo liquido e liberado conforme a conclusao da consulta e as regras operacionais, inclusive conclusao automatica apos 24 horas quando aplicavel.",
      "Disputas, reembolsos e chargebacks podem suspender ou reverter valores. Apos a solicitacao de saque, o pagamento manual possui prazo estimado de ate 12 dias.",
    ],
  },
  {
    title: "5. Cancelamento, no-show e disputa",
    paragraphs: [
      "Cancelamentos do paciente com mais de 24 horas de antecedencia geram reembolso integral. Com menos de 24 horas, nao ha reembolso. Se o profissional cancelar ou nao comparecer, o paciente tem direito ao reembolso integral.",
      "O paciente pode abrir disputa apos o horario do atendimento. Durante a analise, o valor permanece retido ate a decisao registrada pela mediacao.",
    ],
  },
];

export default function OnlineTermsPage() {
  return (
    <LegalDocumentPage
      title="Termos Profissionais do MWC Online"
      description="Regras especificas para profissionais que oferecem consultas, aulas e orientacoes online."
      version={PROFESSIONAL_TERMS.HEALTH.version}
      sections={sections}
      activeDocument="online"
    />
  );
}
