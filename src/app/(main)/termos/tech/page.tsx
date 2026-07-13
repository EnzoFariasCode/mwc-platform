import { LegalDocumentPage } from "@/modules/legal/components/legal-document-page";
import { PROFESSIONAL_TERMS } from "@/modules/legal/terms-versions";

const sections = [
  {
    title: "1. Aplicacao",
    paragraphs: [
      "Estes termos se aplicam exclusivamente a profissionais com setor principal TECH que participam do Marketplace Tech. Consultas, aulas e orientacoes do MWC Online nao fazem parte deste documento.",
    ],
  },
  {
    title: "2. Projetos e propostas",
    paragraphs: [
      "O profissional pode localizar projetos, enviar propostas e executar o escopo aprovado pelo cliente. Valor, prazo, entregaveis e comunicacoes registrados na plataforma compoem o historico da contratacao.",
    ],
  },
  {
    title: "3. Planos e visibilidade",
    paragraphs: [
      "Os planos Gratuito, Starter e Advanced possuem limites e prioridade diferentes. Na busca e nas propostas, a prioridade segue Advanced, Starter e Gratuito, preservados filtros e criterios de qualidade dentro de cada grupo.",
    ],
  },
  {
    title: "4. Taxa e liberacao do saldo",
    paragraphs: [
      "A MWC aplica taxa de 10% sobre o valor do projeto processado. O saldo liquido e liberado na carteira do profissional depois que o cliente aprova a entrega, salvo disputa, reembolso, chargeback ou revisao financeira pendente.",
      "Apos a solicitacao de saque, o pagamento manual para a chave informada possui prazo estimado de ate 12 dias. O profissional deve confirmar valor, destino e prazo antes de enviar a solicitacao.",
    ],
  },
  {
    title: "5. Disputas e chargebacks",
    paragraphs: [
      "Cliente e profissional podem utilizar os recursos de revisao e disputa disponiveis. Valores podem permanecer suspensos ou ser revertidos durante uma mediacao ou chargeback aberto junto a operadora do cartao.",
    ],
  },
];

export default function TechTermsPage() {
  return (
    <LegalDocumentPage
      title="Termos Profissionais do Marketplace Tech"
      description="Regras especificas para profissionais que atuam com projetos, propostas e entregas no setor Tech."
      version={PROFESSIONAL_TERMS.TECH.version}
      sections={sections}
      activeDocument="tech"
    />
  );
}
