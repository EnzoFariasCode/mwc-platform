import { LegalDocumentPage } from "@/modules/legal/components/legal-document-page";
import { GENERAL_TERMS_VERSION } from "@/modules/legal/terms-versions";

const sections = [
  {
    title: "1. Identificacao da MWC",
    paragraphs: [
      "A plataforma e operada por Maximus World Click - MWC, inscrita no CNPJ sob o numero 66.229.191/0001-76, com endereco na Rua Kenkiti Shimomoto, Jardim Boa Vista (Zona Oeste), Sao Paulo - SP, CEP 05583-000, doravante denominada \"MWC\".",
      "Duvidas, solicitacoes e reclamacoes podem ser encaminhadas para suporte@maximusworldclick.com.",
    ],
  },
  {
    title: "2. Objeto e papel da plataforma",
    paragraphs: [
      "A MWC e uma plataforma digital de intermediacao que aproxima clientes e profissionais, disponibilizando recursos de busca, perfil, comunicacao, propostas, agendamento, contratacao, pagamento e acompanhamento de servicos.",
      "A MWC nao presta diretamente os servicos anunciados pelos profissionais e nao integra a relacao profissional, trabalhista, societaria ou de representacao entre os usuarios. Cada profissional atua de forma independente e responde pela regularidade, qualidade, prazo e execucao do servico que oferecer.",
    ],
  },
  {
    title: "3. Aceitacao e documentos aplicaveis",
    paragraphs: [
      "Ao criar uma conta ou utilizar funcionalidade que exija autenticacao, o usuario declara ter lido e aceitado estes Termos Gerais e a Politica de Privacidade vigentes no momento do aceite.",
      "Determinadas atividades tambem estao sujeitas a termos especificos, incluindo os Termos Profissionais do Marketplace Tech, os Termos de Contratacao de Projetos Tech, os Termos Profissionais do MWC Online e as regras de pagamento apresentadas no respectivo fluxo. Em caso de conflito, o termo especifico prevalece apenas quanto a atividade que regulamenta.",
    ],
  },
  {
    title: "4. Acesso publico e funcionalidades restritas",
    paragraphs: [
      "Visitantes podem navegar pelas paginas publicas, consultar planos, realizar buscas e visualizar listas de profissionais sem criar uma conta.",
      "Acoes como acessar detalhes restritos de perfil, iniciar contato, enviar ou aceitar proposta, contratar servico, realizar pagamento ou agendar atendimento exigem cadastro e autenticacao. A MWC pode alterar quais funcionalidades exigem conta para proteger usuarios, dados e operacoes.",
    ],
  },
  {
    title: "5. Elegibilidade",
    paragraphs: [
      "A plataforma e destinada exclusivamente a pessoas com 18 anos completos ou mais e plenamente capazes para os atos da vida civil. Ao se cadastrar, o usuario declara atender a esse requisito.",
      "A MWC pode solicitar informacoes ou documentos para confirmar identidade, idade, qualificacao profissional ou regularidade do cadastro, conforme a funcionalidade utilizada.",
    ],
  },
  {
    title: "6. Cadastro e seguranca da conta",
    paragraphs: [
      "O usuario deve fornecer informacoes verdadeiras, completas e atualizadas, manter seus dados corretos e proteger suas credenciais. A conta e pessoal e nao pode ser cedida, compartilhada ou utilizada em nome de terceiro sem autorizacao da MWC.",
      "O usuario deve comunicar imediatamente ao suporte qualquer suspeita de acesso indevido. Atividades realizadas por meio da conta poderao ser atribuidas ao respectivo titular, sem prejuizo da apuracao de fraude ou falha de seguranca.",
    ],
  },
  {
    title: "7. Regras de uso e condutas proibidas",
    paragraphs: [
      "O usuario deve utilizar a plataforma de forma licita, respeitosa e compativel com a finalidade de cada funcionalidade, respeitando estes termos, os direitos de terceiros e a legislacao aplicavel.",
      "E proibido praticar fraude, falsidade, assedio, discriminacao, ameaca, spam, publicar conteudo ilegal, violar propriedade intelectual, coletar dados sem autorizacao, interferir na seguranca ou funcionamento da plataforma, criar contas para contornar restricoes ou utilizar a MWC para atividade ilicita.",
      "Tambem e proibido utilizar informacoes ou contatos obtidos na plataforma para contornar fluxos obrigatorios de contratacao, pagamento, taxas ou protecoes aplicaveis a uma operacao iniciada na MWC.",
    ],
  },
  {
    title: "8. Perfis, conteudos e informacoes dos usuarios",
    paragraphs: [
      "O usuario e responsavel pelos textos, imagens, documentos, propostas, mensagens e demais conteudos que inserir na plataforma, bem como por possuir as autorizacoes necessarias para utiliza-los.",
      "Ao publicar conteudo, o usuario autoriza a MWC, de forma nao exclusiva e durante o periodo necessario a operacao da conta e dos servicos, a hospedar, reproduzir, adaptar tecnicamente e exibir esse conteudo dentro da plataforma. Essa autorizacao nao transfere a titularidade do conteudo para a MWC.",
      "A MWC pode remover ou restringir conteudo que viole estes termos, a legislacao ou direitos de terceiros, preservados os registros necessarios para seguranca, defesa de direitos ou cumprimento de obrigacao legal.",
    ],
  },
  {
    title: "9. Relacao entre clientes e profissionais",
    paragraphs: [
      "Clientes e profissionais sao responsaveis pelas informacoes, negociacoes, escopo, prazos, qualificacoes e compromissos que assumirem. A proposta aceita, o agendamento, as mensagens e os registros do fluxo aplicavel podem integrar a contratacao entre eles.",
      "A exibicao de um perfil nao constitui recomendacao, garantia de resultado ou vinculo com a MWC. Quando houver verificacao de identidade ou qualificacao, seu alcance sera informado na propria plataforma e nao substituira a avaliacao do usuario nem a responsabilidade do profissional.",
    ],
  },
  {
    title: "10. Pagamentos, taxas e tributos",
    paragraphs: [
      "Operacoes pagas sao processadas pelos meios e provedores indicados no respectivo fluxo. Os dados completos do cartao nao sao armazenados diretamente pela MWC.",
      "Precos, taxas, prazos de liberacao, cancelamento, reembolso, disputa e chargeback seguem o termo especifico aceito na contratacao. Cada usuario e responsavel pelos tributos, documentos fiscais e obrigacoes que incidirem sobre sua atividade, conforme a legislacao aplicavel.",
    ],
  },
  {
    title: "11. Comunicacoes e registros",
    paragraphs: [
      "A MWC pode enviar comunicacoes operacionais relacionadas a conta, seguranca, propostas, agendamentos, pagamentos, disputas e alteracoes relevantes dos servicos. Comunicacoes promocionais observarao as preferencias do usuario e a legislacao aplicavel.",
      "Para seguranca e evidencia das operacoes, a MWC pode registrar versao e data do aceite, usuario, endereco IP, navegador, dispositivo e identificadores relacionados a sessao ou transacao, conforme descrito na Politica de Privacidade.",
    ],
  },
  {
    title: "12. Propriedade intelectual da MWC",
    paragraphs: [
      "A marca MWC, o software, a interface, o design, os textos institucionais, bancos de dados e demais elementos proprios da plataforma sao protegidos pela legislacao aplicavel. O acesso a plataforma nao concede ao usuario direito de propriedade ou licenca para exploracao comercial desses elementos.",
      "Nao e permitido copiar, modificar, distribuir, realizar engenharia reversa ou explorar elementos da plataforma fora das hipoteses autorizadas por lei ou previamente autorizadas por escrito pela MWC.",
    ],
  },
  {
    title: "13. Suspensao e encerramento",
    paragraphs: [
      "A MWC pode restringir funcionalidades, suspender ou encerrar contas em caso de violacao destes termos, fraude, risco a usuarios ou a plataforma, determinacao legal, inadimplencia ou necessidade de seguranca. Sempre que a situacao permitir, o usuario sera informado e podera solicitar revisao ao suporte.",
      "O usuario pode solicitar o encerramento da conta pelo e-mail suporte@maximusworldclick.com. Antes do encerramento, operacoes, pagamentos, disputas e obrigacoes pendentes deverao ser tratados. Alguns registros poderao ser conservados pelos prazos necessarios ao cumprimento de obrigacoes legais, regulacao, prevencao a fraude e exercicio regular de direitos, conforme a Politica de Privacidade.",
    ],
  },
  {
    title: "14. Disponibilidade e alteracoes da plataforma",
    paragraphs: [
      "A MWC busca manter a plataforma segura e disponivel, mas podera realizar manutencoes, corrigir falhas, modificar funcionalidades ou interromper recursos por motivos tecnicos, de seguranca, legais ou comerciais.",
      "Quando uma alteracao afetar de modo relevante uma contratacao em andamento ou direito do usuario, a MWC adotara medidas razoaveis de comunicacao e transicao, observada a legislacao aplicavel.",
    ],
  },
  {
    title: "15. Responsabilidades",
    paragraphs: [
      "A MWC responde pelos deveres que a legislacao lhe atribuir como operadora da plataforma e intermediadora. Nada nestes termos exclui ou limita direitos e responsabilidades que nao possam ser afastados por contrato, inclusive os previstos na legislacao de defesa do consumidor.",
      "Na medida permitida por lei, a MWC nao responde por informacoes falsas fornecidas por usuarios, pela execucao ou resultado de servicos prestados por profissionais independentes, por acordos realizados fora dos fluxos da plataforma ou por indisponibilidade causada por terceiros, caso fortuito ou forca maior.",
    ],
  },
  {
    title: "16. Suporte, denuncias e conflitos",
    paragraphs: [
      "Solicitacoes de suporte, denuncias, reclamacoes e pedidos de revisao devem ser enviados para suporte@maximusworldclick.com, com as informacoes necessarias para identificacao e analise do caso.",
      "Estes termos sao regidos pelas leis da Republica Federativa do Brasil. As partes buscarao uma solucao amigavel antes de recorrer ao Judiciario. Fica eleito o foro da comarca de Sao Paulo - SP, salvo quando a legislacao aplicavel assegurar ao consumidor a possibilidade de utilizar o foro de seu domicilio ou outro foro legalmente competente.",
    ],
  },
  {
    title: "17. Vigencia, alteracoes e disposicoes finais",
    paragraphs: [
      "Estes Termos Gerais entram em vigor em setembro de 2026. Alteracoes relevantes receberao nova versao e serao comunicadas pelos meios apropriados. Quando necessario, a MWC solicitara novo aceite antes da continuidade de um fluxo afetado.",
      "Se qualquer disposicao destes termos for considerada invalida ou inexequivel, as demais permanecerao em vigor. A tolerancia quanto a eventual descumprimento nao representa renuncia de direito nem alteracao destes termos.",
    ],
  },
];

export default function GeneralTermsPage() {
  return (
    <LegalDocumentPage
      title="Termos Gerais de Uso"
      description="Regras comuns para acesso, cadastro, seguranca, comunicacao e uso da plataforma MWC. Termos especificos complementam este documento conforme o servico utilizado."
      version={GENERAL_TERMS_VERSION}
      sections={sections}
      activeDocument="general"
    />
  );
}
