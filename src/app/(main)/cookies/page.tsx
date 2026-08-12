import { LegalDocumentPage } from "@/modules/legal/components/legal-document-page";
import { COOKIE_POLICY_VERSION } from "@/modules/legal/terms-versions";

const sections = [
  {
    title: "1. Controlador e contato",
    paragraphs: [
      "A Maximus World Click - MWC, inscrita no CNPJ 66.229.191/0001-76, com sede na Rua Kenkiti Shimomoto, Jardim Boa Vista (Zona Oeste), Sao Paulo - SP, CEP 05583-000, e responsavel pelas escolhas sobre cookies proprios utilizados na plataforma.",
      "Duvidas, pedidos ou revogacoes relacionados a cookies e dados pessoais podem ser enviados a suporte@maximusworldclick.com, canal de privacidade atualmente divulgado pela MWC.",
    ],
  },
  {
    title: "2. O que sao cookies",
    paragraphs: [
      "Cookies sao pequenos arquivos gravados pelo navegador quando uma pessoa acessa um site. Eles podem manter uma sessao conectada, proteger uma operacao, lembrar escolhas ou permitir que um fornecedor execute uma funcionalidade.",
      "Tecnologias semelhantes, como localStorage, guardam informacoes no navegador e seguem as mesmas escolhas quando utilizadas para finalidade de preferencia. Esta Politica chama essas tecnologias conjuntamente de cookies quando isso facilitar a leitura.",
    ],
  },
  {
    title: "3. Categorias e escolhas",
    paragraphs: [
      "Necessarios: viabilizam login, sessao, seguranca, prevencao a fraude, fluxo de autenticacao e registro da escolha de cookies. Permanecem ativos porque a plataforma nao funciona com seguranca sem eles.",
      "Funcionalidade: lembram escolhas como modo de visualizacao do painel e avisos ja exibidos. So sao utilizados depois da permissao e podem ser recusados sem impedir os recursos principais.",
      "Analiticos: mediriam audiencia, desempenho e navegacao. A MWC nao utiliza ferramenta dedicada de analytics na versao atual auditada; por isso, a categoria permanece desativada.",
      "Marketing: permitiriam publicidade, remarketing ou medicao de campanhas. A MWC nao utiliza Pixel, Google Ads ou tecnologia equivalente na versao atual auditada; por isso, a categoria permanece desativada.",
    ],
  },
  {
    title: "4. Cookies necessarios da MWC e Auth.js",
    paragraphs: [
      "authjs.session-token ou __Secure-authjs.session-token — mantem a sessao autenticada; proprio e necessario; normalmente permanece ate o encerramento ou expiracao da sessao configurada.",
      "authjs.csrf-token ou __Host-authjs.csrf-token — protege formularios e autenticacao contra requisicoes indevidas; proprio e necessario; duracao de sessao ou ate a renovacao pelo sistema.",
      "authjs.callback-url — preserva a pagina de retorno depois do login; proprio e necessario; duracao de sessao ou ate a conclusao do redirecionamento.",
      "authjs.pkce.code_verifier, authjs.state e authjs.nonce, inclusive variantes com prefixo seguro — protegem o login Google contra interceptacao, repeticao e falsificacao; proprios e necessarios; curta duracao, normalmente limitada ao fluxo de autenticacao.",
      "Os nomes podem receber prefixos __Secure- ou __Host- em ambiente HTTPS e podem variar em atualizacoes de seguranca do Auth.js, sem alteracao de finalidade.",
    ],
  },
  {
    title: "5. Cookies necessarios especificos da MWC",
    paragraphs: [
      "mwc_google_registration — guarda autorizacao temporaria, assinada e inacessivel a scripts, para comprovar maioridade e aceite antes de criar conta com Google; proprio e necessario; dura no maximo 10 minutos e e removido depois do uso.",
      "mwc_cookie_consent — guarda identificador, versao da politica, data e categorias escolhidas para aplicar e demonstrar a preferencia; proprio e necessario; dura ate 180 dias ou ate substituicao por nova escolha ou versao.",
    ],
  },
  {
    title: "6. Armazenamento de funcionalidade",
    paragraphs: [
      "dashboardViewMode — localStorage proprio; lembra se o profissional prefere visualizar o painel no modo cliente ou profissional; permanece ate exclusao pelo usuario, limpeza do navegador ou revogacao da categoria.",
      "profile_modal_seen — localStorage proprio; evita repetir um aviso de conclusao de perfil no mesmo navegador; permanece ate exclusao pelo usuario, limpeza do navegador ou revogacao da categoria.",
      "Ao recusar ou revogar Funcionalidade, a MWC remove essas chaves conhecidas e deixa de grava-las. Preferencias podem precisar ser escolhidas novamente a cada acesso.",
    ],
  },
  {
    title: "7. Cookies de terceiros",
    paragraphs: [
      "Ao escolher login Google ou acessar paginas externas do Google ou Stripe, esses fornecedores podem definir cookies em seus proprios dominios conforme suas politicas. A MWC nao consegue listar ou controlar integralmente cookies definidos fora de seu dominio.",
      "A criacao de eventos do Google Calendar, salas do Google Meet, pagamentos Stripe e entrega de e-mails pelo Resend ocorre principalmente entre servidores. Isso nao autoriza cookies de analytics ou marketing no site da MWC.",
    ],
  },
  {
    title: "8. Banner e consentimento granular",
    paragraphs: [
      "No primeiro acesso ou quando a versao mudar, o banner permite Aceitar todos os cookies atualmente disponiveis, Recusar nao essenciais ou Gerenciar por categoria. Recusar e aceitar possuem acesso equivalente, e nenhuma categoria opcional e preselecionada.",
      "Aceitar todos na versao atual ativa apenas Necessarios e Funcionalidade, pois Analiticos e Marketing nao estao instalados. Uma futura instalacao nao aproveitara esse aceite antigo: exigira atualizacao da politica e nova escolha quando aplicavel.",
    ],
  },
  {
    title: "9. Registro da escolha",
    paragraphs: [
      "Para responsabilizacao e auditoria, registramos identificador aleatorio do consentimento, usuario quando autenticado, versao da politica, categorias, acao escolhida, data, IP e navegador. Nao usamos esse registro para publicidade.",
      "Uma nova escolha gera novo evento de historico e substitui a preferencia ativa no navegador, permitindo demonstrar concessao, recusa e revogacao ao longo do tempo.",
    ],
  },
  {
    title: "10. Revogacao e configuracoes do navegador",
    paragraphs: [
      "A escolha pode ser alterada a qualquer momento pelo link Gerenciar cookies no rodape. A revogacao e tao acessivel quanto a concessao e nao afeta a legalidade do tratamento realizado anteriormente.",
      "O navegador tambem permite apagar ou bloquear cookies. O bloqueio de cookies necessarios pode impedir login, seguranca, recuperacao do fluxo e outras funcoes essenciais.",
    ],
  },
  {
    title: "11. Areas sensiveis do MWC Online",
    paragraphs: [
      "Nas rotas de busca, perfil, agendamento e checkout do MWC Online, categorias nao essenciais de terceiros permanecem bloqueadas pelo gerenciador atual, mesmo que Funcionalidade tenha sido aceita em outra area.",
      "A MWC nao utiliza analytics ou marketing em prontuarios, fichas, triagens, atendimentos ou paginas capazes de revelar interesse relacionado a saude. Qualquer mudanca exigira avaliacao especifica de risco e fundamento legal apropriado.",
    ],
  },
  {
    title: "12. Direitos do titular",
    paragraphs: [
      "O titular pode solicitar confirmacao, acesso, correcao, informacoes sobre compartilhamento, oposicao, revogacao e eliminacao nas hipoteses da LGPD. Cookies opcionais podem ser recusados ou revogados diretamente pelo gerenciador.",
      "Informacoes completas sobre bases legais, retencao, compartilhamentos e exercicio dos direitos estao na Politica de Privacidade da MWC, disponivel em /privacidade.",
    ],
  },
  {
    title: "13. Atualizacoes e vigencia",
    paragraphs: [
      "Esta Politica entra em vigor em setembro de 2026. Novos cookies, fornecedores ou finalidades serao incluidos na lista antes ou no inicio de seu uso, e uma nova escolha sera solicitada quando exigida.",
      "A duracao informada representa a configuracao ou finalidade prevista. O usuario pode eliminar cookies antes do prazo pelo gerenciador ou pelas configuracoes do navegador.",
    ],
  },
];

export default function CookiesPage() {
  return <LegalDocumentPage title="Politica de Cookies" description="Cookies e tecnologias locais usados pela MWC, suas finalidades, duracao e controles de escolha." version={COOKIE_POLICY_VERSION} sections={sections} activeDocument="cookies" />;
}
