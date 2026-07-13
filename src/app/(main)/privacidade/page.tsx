import { LegalDocumentPage } from "@/modules/legal/components/legal-document-page";

const sections = [
  {
    title: "1. Dados tratados",
    paragraphs: [
      "A MWC trata dados de cadastro, perfil, comunicacao, transacao e uso necessarios para operar a plataforma. Dados de cartao sao processados pela Stripe e nao sao armazenados diretamente nos servidores da MWC.",
    ],
  },
  {
    title: "2. Finalidades",
    paragraphs: [
      "Os dados sao usados para autenticacao, prevencao a fraude, execucao dos fluxos contratados, comunicacoes operacionais, suporte, mediacao de disputas e cumprimento de obrigacoes legais.",
    ],
  },
  {
    title: "3. Aceites e seguranca",
    paragraphs: [
      "Aceites legais podem registrar versao do documento, setor profissional, data, endereco IP e identificacao do navegador para manter um historico auditavel.",
    ],
  },
  {
    title: "4. Direitos do titular",
    paragraphs: [
      "O titular pode solicitar acesso, correcao ou informacoes sobre o tratamento de seus dados pelos canais oficiais de atendimento, observados os prazos e deveres legais de conservacao.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="Politica de Privacidade"
      description="Informacoes sobre os dados tratados pela MWC e as finalidades relacionadas ao funcionamento da plataforma."
      version="privacy-v1.0"
      sections={sections}
      activeDocument="privacy"
    />
  );
}
