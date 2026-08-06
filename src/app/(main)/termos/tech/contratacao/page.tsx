import { LegalDocumentPage } from "@/modules/legal/components/legal-document-page";
import { TECH_CONTRACT_TERMS } from "@/modules/legal/terms-versions";

const sections = [
  {
    title: "1. Objeto da contratacao",
    paragraphs: [
      "Estes termos regulam a contratacao, pelo cliente, de um projeto executado por um profissional do Marketplace Tech. A proposta selecionada, o escopo, o valor, o prazo, os entregaveis e as comunicacoes registradas na plataforma integram a contratacao.",
      "Antes do pagamento, o cliente deve revisar o projeto e a proposta escolhida. Alteracoes de escopo, prazo ou valor devem ser registradas na plataforma e aceitas pelas partes.",
    ],
  },
  {
    title: "2. Pagamento e retencao do valor",
    paragraphs: [
      "O pagamento e processado pela Stripe. Os dados completos do cartao nao sao armazenados pela MWC. A taxa de 10% da plataforma e descontada do repasse ao profissional e nao aumenta o total exibido ao cliente no checkout.",
      "Apos a aprovacao do pagamento, o valor permanece retido e mediado pela MWC. O repasse ao profissional ocorre depois da aprovacao da entrega pelo cliente ou da finalizacao automatica, desde que nao exista disputa, reembolso, chargeback ou revisao financeira pendente.",
    ],
  },
  {
    title: "3. Entrega, revisao e aprovacao",
    paragraphs: [
      "O profissional deve entregar o trabalho conforme o escopo e o prazo registrados. Depois da entrega, o cliente possui 7 dias para aprovar, solicitar revisao fundamentada ou abrir disputa por descumprimento.",
      "Se o cliente nao se manifestar nesse prazo, o projeto pode ser finalizado automaticamente e o pagamento liberado ao profissional. Pedidos de revisao devem guardar relacao com o escopo contratado e nao podem exigir trabalho adicional sem novo acordo.",
    ],
  },
  {
    title: "4. Cancelamento, reembolso e disputa",
    paragraphs: [
      "O cancelamento com solicitacao de estorno ao meio de pagamento fica disponivel pelo fluxo indicado na plataforma durante as primeiras 12 horas apos a confirmacao, desde que o servico ainda nao tenha sido executado ou entregue.",
      "Depois desse periodo, divergencias sobre escopo, prazo, qualidade ou entrega devem ser tratadas pelo fluxo de revisao ou disputa. Durante a analise, a MWC pode manter o valor suspenso e solicitar evidencias das partes. Reembolsos e reversoes dependem da situacao registrada, da decisao da mediacao e das regras do provedor de pagamento.",
    ],
  },
  {
    title: "5. Chargebacks e cooperacao",
    paragraphs: [
      "A abertura de chargeback junto ao emissor do meio de pagamento pode suspender ou reverter valores. Cliente e profissional devem fornecer informacoes verdadeiras e cooperar com a analise. O uso abusivo dos mecanismos de disputa ou chargeback pode resultar em restricao da conta, sem prejuizo das medidas aplicaveis.",
    ],
  },
  {
    title: "6. Registro do aceite",
    paragraphs: [
      "Ao marcar o checkbox no checkout e prosseguir, o cliente declara que leu e aceitou esta versao dos termos para a proposta indicada. A MWC pode registrar usuario, projeto, proposta, valor, moeda, versao, data, endereco IP, navegador e identificadores da sessao de pagamento para manter evidencia auditavel da contratacao.",
      "Os Termos Gerais de Uso e a Politica de Privacidade da MWC tambem se aplicam ao uso da conta e ao tratamento de dados pessoais.",
    ],
  },
];

export default function TechContractTermsPage() {
  return (
    <LegalDocumentPage
      title={TECH_CONTRACT_TERMS.label}
      description="Condicoes aceitas pelo cliente ao contratar e pagar uma proposta de projeto no Marketplace Tech."
      version={TECH_CONTRACT_TERMS.version}
      sections={sections}
      activeDocument="tech-contract"
    />
  );
}
