import { LegalDocumentPage } from "@/modules/legal/components/legal-document-page";
import { TECH_CONTRACT_TERMS } from "@/modules/legal/terms-versions";

const sections = [
  {
    title: "1. Aplicacao e documentos relacionados",
    paragraphs: [
      "Estes termos regulam a contratacao, pelo cliente, de projeto executado por profissional independente do Marketplace Tech e se aplicam a cada proposta selecionada e paga pela plataforma.",
      "Os Termos Gerais de Uso, a Politica de Privacidade e os Termos Profissionais do Marketplace Tech complementam este documento. Em caso de conflito, estes termos prevalecem somente quanto a contratacao Tech especifica.",
    ],
  },
  {
    title: "2. Papel da MWC e relacao entre as partes",
    paragraphs: [
      "A MWC atua como plataforma intermediadora, disponibilizando busca, propostas, comunicacao, checkout, registro da entrega, revisao e mediacao. O servico contratado e executado diretamente pelo profissional independente escolhido pelo cliente.",
      "A MWC nao integra a equipe do profissional, nao dirige sua atividade e nao garante resultado especifico. A intermediacao nao afasta as responsabilidades que a legislacao atribuir a cada participante nem os direitos obrigatorios do consumidor.",
    ],
  },
  {
    title: "3. Projeto, proposta e formacao da contratacao",
    paragraphs: [
      "O cliente e responsavel por descrever sua necessidade de forma verdadeira e suficiente. O profissional apresenta proposta com valor, prazo estimado e descricao do servico. A proposta escolhida, o projeto, o escopo, o valor, o prazo, os entregaveis e as comunicacoes registradas na plataforma integram a contratacao.",
      "Antes do pagamento, o cliente deve revisar a identidade e o perfil do profissional, a proposta, o valor total, o prazo e o que esta ou nao incluido. A exibicao de perfil, selo, plano ou avaliacao nao constitui garantia de resultado pela MWC.",
      "A contratacao e confirmada quando o pagamento e aprovado e a plataforma vincula a proposta ao projeto. Ate essa confirmacao, a proposta pode se tornar indisponivel, ser retirada, atingir limite do plano profissional ou exigir nova tentativa de checkout.",
    ],
  },
  {
    title: "4. Reserva da proposta e checkout",
    paragraphs: [
      "Ao iniciar o checkout, a plataforma cria uma reserva temporaria da proposta para o cliente. Essa reserva acompanha a validade da sessao da Stripe e pode permanecer ativa por ate 24 horas, sem representar pagamento aprovado.",
      "Checkout abandonado, cancelado, expirado ou recusado nao inicia o projeto. O cliente pode tentar novamente enquanto a proposta, o projeto e a capacidade do profissional permanecerem disponiveis.",
      "Se o profissional atingir o limite de trabalhos simultaneos antes da confirmacao definitiva, a operacao pode ser impedida ou encaminhada para revisao do suporte. Caso a Stripe tenha confirmado uma cobranca que nao possa ser vinculada validamente ao projeto, a MWC analisara a operacao e adotara o estorno ou a regularizacao cabivel.",
    ],
  },
  {
    title: "5. Preco, pagamento e taxa da plataforma",
    paragraphs: [
      "O valor total devido pelo cliente e o valor da proposta exibido no checkout, em reais. O pagamento e unico e processado pela Stripe pelos meios habilitados no momento da compra. Os dados completos do cartao sao inseridos no ambiente da Stripe e nao sao armazenados diretamente nos servidores da MWC.",
      "A taxa de 10% da MWC e descontada do repasse ao profissional e nao e adicionada ao total da proposta pago pelo cliente. Eventuais encargos do emissor, conversao, juros ou condicoes do meio de pagamento, quando existentes, sao informados ou administrados pelo respectivo provedor.",
      "A aprovacao exibida pelo provedor pode depender de confirmacao tecnica pela plataforma. O cliente deve acompanhar o status do projeto e comunicar ao suporte qualquer cobranca confirmada que nao apareca corretamente em sua conta.",
    ],
  },
  {
    title: "6. Protecao e liberacao do pagamento",
    paragraphs: [
      "Apos a confirmacao, o valor nao e creditado imediatamente na carteira do profissional. A MWC registra e administra a liberacao conforme os estados do projeto e as confirmacoes recebidas do provedor de pagamento.",
      "O saldo liquido e liberado ao profissional quando o cliente aprova a entrega, quando termina o prazo de 7 dias sem revisao ou disputa, ou quando a mediacao decide pela liberacao, desde que nao exista reembolso, chargeback ou revisao financeira pendente.",
      "A protecao de pagamento nao equivale a garantia de satisfacao irrestrita nem substitui a avaliacao do escopo pelo cliente. Ela se limita aos fluxos, registros e resultados previstos nestes termos.",
    ],
  },
  {
    title: "7. Inicio, prazo e comunicacao do projeto",
    paragraphs: [
      "O profissional somente deve iniciar o projeto depois que a plataforma confirmar o pagamento e alterar seu status para em execucao. O prazo estimado informado na proposta passa a ser calculado a partir dessa confirmacao.",
      "Cliente e profissional devem manter na plataforma as comunicacoes essenciais sobre requisitos, alteracoes, atrasos, entrega, revisao e aceite. A ausencia de resposta de uma parte nao altera automaticamente o escopo nem autoriza exigencia nao contratada.",
      "Impedimentos e riscos de atraso devem ser comunicados assim que conhecidos. Se o atraso ou abandono representar descumprimento relevante, a parte prejudicada podera utilizar a disputa.",
    ],
  },
  {
    title: "8. Alteracao de escopo",
    paragraphs: [
      "Alteracoes de escopo, prazo, valor, entregaveis, quantidade de revisoes ou requisitos devem ser registradas e aceitas por cliente e profissional. Conversas informais ou pedidos unilaterais nao modificam automaticamente a proposta paga.",
      "O cliente nao pode exigir trabalho adicional como revisao do escopo original. O profissional nao pode reduzir entregaveis, substituir condicoes relevantes ou cobrar valor adicional sem concordancia do cliente.",
      "Quando a mudanca exigir novo pagamento e a plataforma nao oferecer aditamento, as partes devem criar uma nova contratacao pelo fluxo disponibilizado, mantendo referencia ao projeto original quando necessario.",
    ],
  },
  {
    title: "9. Entrega",
    paragraphs: [
      "O profissional deve registrar a entrega pela plataforma, utilizando link valido e descricao suficiente dos arquivos, funcionalidades ou resultados fornecidos. A entrega deve corresponder ao escopo e aos requisitos acordados.",
      "O cliente e responsavel por acessar o material, testar o que for razoavelmente verificavel e preservar copias dos arquivos recebidos. Link inacessivel, arquivo corrompido, entrega vazia ou material manifestamente diferente do escopo pode fundamentar revisao ou disputa.",
      "A data de entrega registrada inicia o prazo de analise do cliente. Comunicacao ou arquivo enviado apenas fora da plataforma pode nao ser considerado entrega formal para a liberacao do pagamento.",
    ],
  },
  {
    title: "10. Analise, revisao e aprovacao",
    paragraphs: [
      "Depois da entrega formal, o cliente possui 7 dias para aprovar, solicitar revisao fundamentada ou abrir disputa. A plataforma pode enviar lembretes quando restarem aproximadamente 3 dias e 1 dia.",
      "O pedido de revisao deve descrever o ajuste com pelo menos 10 caracteres, guardar relacao com o escopo contratado e ser realizado enquanto o projeto estiver em revisao. O pedido devolve o projeto para execucao e interrompe a liberacao automatica ate nova entrega.",
      "Na aprovacao manual, o cliente atribui avaliacao de 1 a 5 ao profissional e pode adicionar comentario. A aprovacao conclui o projeto e libera o saldo liquido ao profissional; por isso, deve ser realizada somente depois da verificacao da entrega.",
      "Se o cliente nao aprovar, pedir revisao nem abrir disputa dentro dos 7 dias, o projeto pode ser concluido automaticamente e o pagamento liberado ao profissional, sem avaliacao automatica.",
    ],
  },
  {
    title: "11. Cancelamento antes e depois do pagamento",
    paragraphs: [
      "Enquanto o projeto estiver aberto ou aguardando pagamento, o cliente pode cancela-lo pelo fluxo da plataforma, apresentando motivo com pelo menos 10 caracteres. Propostas pendentes sao rejeitadas e nao ha estorno quando nenhuma cobranca foi confirmada.",
      "Depois da confirmacao do pagamento, o sistema disponibiliza cancelamento com estorno integral ao cartao durante as primeiras 12 horas, desde que o projeto continue em execucao, nao tenha entrega registrada e a operacao possa ser localizada no provedor de pagamento.",
      "Encerradas as 12 horas, ou depois que o projeto entrar em revisao, divergencias sobre atraso, escopo, qualidade, entrega ou descumprimento devem ser tratadas pelo fluxo de revisao ou disputa. O prazo operacional de 12 horas nao limita direito de arrependimento, reembolso ou outra protecao que seja obrigatoriamente assegurada pela legislacao aplicavel; nesses casos, o cliente deve contatar o suporte.",
    ],
  },
  {
    title: "12. Reembolso",
    paragraphs: [
      "Quando aprovado pelo fluxo de cancelamento, pela mediacao ou por obrigacao legal, o reembolso e enviado pela Stripe ao meio de pagamento original. O prazo para aparecer na fatura ou conta depende do provedor, emissor e ciclo financeiro do cliente.",
      "A MWC pode solicitar confirmacao de identidade, dados da operacao e informacoes necessarias para prevenir fraude e localizar o pagamento. O registro interno de credito ou reembolso nao significa que o emissor ja concluiu a devolucao.",
      "Se o pagamento tiver sido confirmado, mas a proposta ou o projeto se tornar indisponivel antes da finalizacao tecnica, a MWC podera encaminhar a operacao para revisao manual e providenciar regularizacao ou estorno conforme o caso.",
    ],
  },
  {
    title: "13. Disputa e mediacao",
    paragraphs: [
      "Cliente ou profissional pode abrir disputa enquanto o projeto estiver em execucao ou em revisao, informando motivo com pelo menos 10 caracteres. A abertura suspende a entrega, a conclusao automatica e a liberacao do pagamento ate a decisao ou outro encerramento valido.",
      "A MWC pode analisar o projeto, a proposta, o escopo, o prazo, mensagens, arquivos, links, entregas, pedidos de revisao, registros de pagamento e outras evidencias apresentadas. As partes devem cooperar, conservar os registros e responder as solicitacoes dentro do prazo comunicado pelo suporte.",
      "A mediacao administrativa pode determinar reembolso ao cliente ou liberacao do valor liquido ao profissional. A decisao, o motivo e os registros relevantes ficam associados ao projeto e sao comunicados as partes. A mediacao nao impede o acesso ao provedor de pagamento, orgaos de defesa do consumidor ou Poder Judiciario.",
    ],
  },
  {
    title: "14. Chargeback",
    paragraphs: [
      "O cliente pode exercer direitos perante o emissor de seu meio de pagamento, mas deve fornecer informacoes verdadeiras e evitar duplicidade entre pedido ja resolvido, reembolso e chargeback. A abertura de chargeback pode suspender o projeto e o valor durante a analise da Stripe ou do emissor.",
      "A decisao do emissor pode reverter a operacao independentemente da mediacao interna. Cliente e profissional devem cooperar com documentos e evidencias. Fraude, falsidade ou uso abusivo de disputa ou chargeback pode resultar em restricao da conta, sem prejuizo das medidas legais cabiveis.",
    ],
  },
  {
    title: "15. Confidencialidade, dados e acessos",
    paragraphs: [
      "Cliente e profissional devem utilizar informacoes nao publicas do projeto somente para negociar, executar, revisar ou comprovar a contratacao. Credenciais, dados pessoais, documentos, codigo e informacoes comerciais devem ser compartilhados apenas quando necessarios e por meio adequado.",
      "O cliente deve conceder somente os acessos indispensaveis e revoga-los ao termino do projeto. O profissional nao pode reutilizar, divulgar ou manter acesso a sistemas do cliente fora da finalidade contratada.",
      "A MWC pode acessar e conservar comunicacoes e materiais na medida necessaria para seguranca, suporte, prevencao a fraude, mediacao, cumprimento legal e exercicio regular de direitos, conforme a Politica de Privacidade.",
    ],
  },
  {
    title: "16. Propriedade intelectual e arquivos",
    paragraphs: [
      "Cliente e profissional devem definir na proposta quais direitos, licencas, arquivos-fonte, componentes e materiais serao entregues. A contratacao nao transfere automaticamente direitos alem daqueles expressamente acordados ou previstos em lei.",
      "Cada parte conserva os direitos sobre materiais, marcas, ferramentas, bibliotecas, modelos e conhecimentos anteriores ao projeto. O profissional deve informar componentes de terceiros e suas licencas ou restricoes, e o cliente deve possuir autorizacao sobre todo material que fornecer.",
      "A MWC nao se torna titular do trabalho contratado. O cliente nao deve publicar, revender ou explorar material antes de possuir a licenca ou cessao aplicavel e de cumprir as condicoes de pagamento acordadas.",
    ],
  },
  {
    title: "17. Contratacoes e pagamentos externos",
    paragraphs: [
      "E proibido retirar da MWC contratacao iniciada ou viabilizada pela plataforma com a finalidade de evitar taxas, registros, seguranca ou protecoes de pagamento. Antes de existir projeto pago, o sistema pode bloquear o compartilhamento de telefone, e-mail, links e outros contatos externos.",
      "Depois da confirmacao, as partes podem trocar contatos necessarios a execucao, mas devem preservar na plataforma os registros essenciais. Pagamentos, ampliacoes de escopo ou acordos realizados fora da MWC nao contam com sua protecao financeira, registro ou mediacao.",
    ],
  },
  {
    title: "18. Nota fiscal, tributos e comprovantes",
    paragraphs: [
      "O profissional e responsavel pela emissao de nota fiscal, recibo ou documento relativo ao servico quando exigido. A MWC nao emite em nome do profissional documento fiscal correspondente ao valor integral do trabalho executado por ele.",
      "O cliente deve solicitar diretamente ao profissional o documento fiscal do servico. Comprovantes da Stripe ou registros da plataforma demonstram o processamento financeiro, mas nao substituem nota fiscal quando ela for obrigatoria.",
    ],
  },
  {
    title: "19. Suspensao, encerramento e projetos pendentes",
    paragraphs: [
      "Suspensao ou pedido de encerramento da conta nao cancela automaticamente projeto pago, entrega, revisao, disputa, reembolso ou chargeback. A MWC pode restringir novas operacoes e manter os acessos e registros necessarios para concluir ou resolver contratacoes pendentes.",
      "Se uma das contas for suspensa durante um projeto, a MWC podera solicitar informacoes, preservar o pagamento, impedir novas acoes e encaminhar o caso para suporte ou mediacao, conforme o estado e as evidencias da operacao.",
    ],
  },
  {
    title: "20. Aceite, registros e vigencia",
    paragraphs: [
      "Ao marcar o checkbox e prosseguir ao pagamento, o cliente declara que leu e aceitou esta versao para a proposta indicada. A MWC pode registrar usuario, projeto, proposta, valor, moeda, versao, data, endereco IP, navegador, identificadores da sessao e do pagamento para manter evidencia auditavel.",
      "Alteracoes destes termos receberao nova versao e nao modificarao retroativamente contratacao ja confirmada, salvo quando necessarias para cumprir a lei ou proteger direito obrigatorio. Estes Termos de Contratacao de Projetos Tech entram em vigor em setembro de 2026.",
    ],
  },
];

export default function TechContractTermsPage() {
  return (
    <LegalDocumentPage
      title={TECH_CONTRACT_TERMS.label}
      description="Condicoes aceitas pelo cliente ao selecionar, contratar, pagar, revisar e concluir uma proposta do Marketplace Tech."
      version={TECH_CONTRACT_TERMS.version}
      sections={sections}
      activeDocument="tech-contract"
    />
  );
}
