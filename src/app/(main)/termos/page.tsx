import { LegalDocumentPage } from "@/modules/legal/components/legal-document-page";
import { GENERAL_TERMS_VERSION } from "@/modules/legal/terms-versions";

const sections = [
  {
    title: "1. Conta e elegibilidade",
    paragraphs: [
      "O usuario deve fornecer informacoes verdadeiras, manter seus dados atualizados e proteger suas credenciais de acesso. A conta e pessoal e nao pode ser cedida sem autorizacao da MWC.",
    ],
  },
  {
    title: "2. Uso da plataforma",
    paragraphs: [
      "A plataforma oferece recursos de perfil, comunicacao, contratacao e acompanhamento. O usuario deve utilizar esses recursos de forma licita, respeitosa e compativel com a finalidade informada em cada fluxo.",
      "Condutas fraudulentas, assedio, envio de conteudo ilegal, tentativa de contornar controles de seguranca ou uso indevido de dados podem resultar em restricao ou encerramento da conta.",
    ],
  },
  {
    title: "3. Pagamentos e mediacao",
    paragraphs: [
      "Quando houver uma operacao paga, o processamento ocorre pelos meios exibidos no respectivo fluxo. A MWC registra os status da operacao e pode mediar cancelamentos, reembolsos e disputas conforme os termos especificos aplicaveis.",
      "Estes Termos Gerais nao substituem as regras do Marketplace Tech ou do MWC Online. O usuario profissional aceita somente o documento correspondente ao seu setor principal.",
    ],
  },
  {
    title: "4. Comunicacoes e registros",
    paragraphs: [
      "O usuario autoriza o envio de comunicacoes operacionais relacionadas a conta, seguranca, pagamentos e atividades realizadas na plataforma. Aceites podem ser registrados com versao, data, endereco IP e identificacao do navegador.",
    ],
  },
  {
    title: "5. Atualizacoes",
    paragraphs: [
      "Alteracoes relevantes destes termos receberao uma nova versao. Quando necessario, a plataforma solicitara novo aceite antes da continuidade de um fluxo afetado.",
    ],
  },
];

export default function GeneralTermsPage() {
  return (
    <LegalDocumentPage
      title="Termos Gerais de Uso"
      description="Regras comuns para criacao de conta, seguranca, comunicacao e uso da plataforma MWC. Este documento nao inclui regras exclusivas de projetos Tech ou atendimentos Online."
      version={GENERAL_TERMS_VERSION}
      sections={sections}
      activeDocument="general"
    />
  );
}
