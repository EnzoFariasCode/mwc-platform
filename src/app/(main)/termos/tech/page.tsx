import { LegalDocumentPage } from "@/modules/legal/components/legal-document-page";
import { PROFESSIONAL_TERMS } from "@/modules/legal/terms-versions";

const sections = [
  {
    title: "1. Aplicacao e documentos relacionados",
    paragraphs: [
      "Estes termos se aplicam exclusivamente a profissionais com conta ativa e setor principal TECH que participam do Marketplace Tech. Consultas, aulas e orientacoes do MWC Online nao fazem parte deste documento.",
      "Os Termos Gerais de Uso, a Politica de Privacidade e, em cada projeto pago, os Termos de Contratacao de Projetos Tech complementam este documento.",
    ],
  },
  {
    title: "2. Perfil e responsabilidade profissional",
    paragraphs: [
      "O profissional deve manter verdadeiras, completas e atualizadas as informacoes de identidade, experiencia, habilidades, qualificacoes, disponibilidade e demais dados exibidos em seu perfil ou utilizados em propostas.",
      "O profissional atua de forma independente e e o unico responsavel pela regularidade de sua atividade, capacidade tecnica, ferramentas, licencas e autorizacoes necessarias para executar os servicos que oferecer. A MWC atua somente como intermediadora e nao garante resultado, qualidade ou adequacao do trabalho contratado.",
    ],
  },
  {
    title: "3. Planos e limites de trabalhos simultaneos",
    paragraphs: [
      "O plano Gratuito nao possui mensalidade e permite ao profissional manter ate 1 trabalho simultaneo. O plano Starter permite ate 5 trabalhos simultaneos e o plano Advanced permite ate 10 trabalhos simultaneos.",
      "Para o calculo do limite, ocupam vaga os projetos aguardando pagamento, em execucao, em revisao ou em disputa, inclusive quando existir uma reserva de checkout ativa vinculada a proposta do profissional. Projetos abertos sem reserva ativa, concluidos ou cancelados nao ocupam vaga.",
      "Ao atingir o limite do plano, o profissional nao podera assumir novo trabalho nem enviar nova proposta enquanto uma vaga nao for liberada ou o plano nao for atualizado. A reducao ou o encerramento de um plano nao cancela projetos existentes, mas pode impedir novas propostas e contratacoes ate que a quantidade de trabalhos se ajuste ao novo limite.",
    ],
  },
  {
    title: "4. Visibilidade e beneficios dos planos",
    paragraphs: [
      "Na busca publica de profissionais Tech e na lista de propostas recebidas pelo cliente, a ordem primaria de prioridade e Advanced, Starter e Gratuito. Antes do ranking por plano, aplicam-se os filtros escolhidos pelo usuario; dentro do mesmo plano, avaliacao, quantidade de avaliacoes e criterios do filtro podem funcionar como desempate.",
      "Starter inclui selo de identificacao, prioridade sobre o plano Gratuito, limite de 5 trabalhos simultaneos e acesso ao suporte tecnico disponibilizado aos assinantes. Advanced inclui selo de identificacao, prioridade maxima, limite de 10 trabalhos simultaneos e acesso ao suporte tecnico disponibilizado aos assinantes. O ranking representa prioridade de exibicao, nao garantia de visualizacoes, propostas ou contratacoes.",
      "Assinaturas inativas nao recebem prioridade nem beneficios de plano pago, ainda que informacoes antigas do plano continuem temporariamente registradas na conta.",
    ],
  },
  {
    title: "5. Preco, cobranca e renovacao",
    paragraphs: [
      "O plano Gratuito possui preco de R$ 0,00. Os precos vigentes, a moeda, a periodicidade e eventuais tributos dos planos Starter e Advanced sao aqueles exibidos na pagina de planos e no checkout da Stripe imediatamente antes da confirmacao da assinatura.",
      "Starter e Advanced sao assinaturas recorrentes processadas pela Stripe e renovadas automaticamente ao final de cada periodo de cobranca, ate que sejam canceladas. O profissional deve manter um meio de pagamento valido e consultar no checkout ou no portal da Stripe a data da proxima cobranca, os comprovantes e a situacao da assinatura.",
      "A assinatura e considerada paga para fins de beneficios enquanto seu status estiver ativo ou em periodo de teste reconhecido pela Stripe. Em caso de falha, expiracao, cancelamento ou outra inativacao, os beneficios pagos deixam de ser aplicados e a conta passa a observar as regras do plano Gratuito.",
    ],
  },
  {
    title: "6. Alteracao e cancelamento da assinatura",
    paragraphs: [
      "O profissional pode gerenciar, trocar ou cancelar a assinatura pelo portal da Stripe acessivel na plataforma, conforme as opcoes disponiveis para sua assinatura. A data efetiva, eventual credito, cobranca proporcional e acesso ate o fim do periodo ja pago serao apresentados no portal antes da confirmacao.",
      "A MWC pode alterar precos ou beneficios para periodos futuros. O novo preco sera informado antes de ser aplicado a renovacao afetada, quando exigido pela legislacao, e nao alterara retroativamente um periodo ja pago. Se nao concordar, o profissional podera cancelar a renovacao antes da entrada em vigor do novo preco.",
      "O cancelamento da assinatura nao encerra a conta profissional, nao elimina valores devidos e nao afasta obrigacoes relacionadas a projetos, reembolsos, disputas ou chargebacks anteriores.",
    ],
  },
  {
    title: "7. Propostas, escopo e prazo",
    paragraphs: [
      "O profissional pode enviar uma proposta por projeto aberto, informando valor, prazo estimado e descricao suficiente do servico. O sistema admite propostas com prazo entre 1 e 365 dias e valor dentro dos limites apresentados no formulario.",
      "Antes de enviar a proposta, o profissional deve avaliar as informacoes do projeto, esclarecer duvidas e incluir as condicoes relevantes. A proposta aceita, o projeto, o escopo, o valor, o prazo, os entregaveis e as comunicacoes registradas na plataforma compoem o historico da contratacao.",
      "Alteracoes de escopo, prazo, preco, entregaveis ou requisitos devem ser registradas na plataforma e aceitas pelas partes. O profissional nao deve iniciar trabalho adicional sem acordo claro nem exigir pagamento fora do fluxo aplicavel.",
    ],
  },
  {
    title: "8. Execucao, entrega, revisao e qualidade",
    paragraphs: [
      "O profissional deve executar o projeto com diligencia e qualidade compativel com o escopo, as informacoes do perfil e a proposta aceita, observando o prazo acordado e comunicando prontamente impedimentos ou riscos de atraso.",
      "A entrega deve ser registrada pelo fluxo da plataforma, com link valido e descricao do que foi entregue. Depois da entrega, o cliente possui 7 dias para aprovar, solicitar revisao relacionada ao escopo ou abrir disputa. Sem manifestacao dentro do prazo, o projeto pode ser concluido automaticamente e o pagamento liberado.",
      "Uma solicitacao de revisao devolve o projeto a execucao. O profissional deve corrigir desconformidades abrangidas pelo escopo, mas nao e obrigado a executar trabalho novo ou ampliacao nao contratada sem novo acordo entre as partes.",
    ],
  },
  {
    title: "9. Confidencialidade",
    paragraphs: [
      "Cliente e profissional devem proteger informacoes nao publicas recebidas em razao do projeto e utiliza-las somente para negociar, executar, revisar ou comprovar a contratacao. Isso inclui credenciais, estrategias, codigo-fonte, documentos, dados comerciais e informacoes pessoais identificadas como confidenciais ou que, por sua natureza, devam ser tratadas como tal.",
      "A obrigacao nao abrange informacao que ja era publica sem violacao destes termos, que foi obtida legitimamente de terceiro, que ja era conhecida pela parte receptora ou cuja divulgacao seja exigida por lei ou autoridade competente. Credenciais e acessos devem ser compartilhados somente quando indispensaveis e revogados ao fim do projeto.",
      "A MWC pode acessar e preservar comunicacoes e materiais na medida necessaria para suporte, seguranca, prevencao a fraude, mediacao, cumprimento legal e exercicio regular de direitos, conforme a Politica de Privacidade.",
    ],
  },
  {
    title: "10. Propriedade intelectual do trabalho",
    paragraphs: [
      "Cliente e profissional devem definir na proposta ou em acordo registrado quais direitos, licencas, arquivos-fonte, componentes e materiais serao entregues. A simples contratacao nao transfere direitos alem daqueles expressamente acordados ou previstos na legislacao aplicavel.",
      "Salvo acordo diferente, cada parte conserva os direitos sobre materiais, ferramentas, bibliotecas, modelos, marcas e conhecimentos que possuia antes do projeto. O profissional deve informar previamente a utilizacao de componentes de terceiros e as licencas ou restricoes correspondentes.",
      "O profissional declara possuir os direitos e autorizacoes necessarios sobre o que entregar e nao deve incorporar material de terceiros de modo que viole direitos autorais, marcas, segredos comerciais ou licencas. A MWC nao se torna titular do trabalho contratado entre cliente e profissional.",
    ],
  },
  {
    title: "11. Portfolio e exibicao de trabalhos",
    paragraphs: [
      "O perfil profissional permite cadastrar ate 3 itens de portfolio. Ao inserir titulo, link, imagem ou outro material, o profissional declara possuir autorizacao para publica-lo e concede a MWC permissao nao exclusiva para hospedar e exibir esse conteudo no perfil enquanto permanecer publicado.",
      "Trabalho realizado para cliente somente pode ser exibido no portfolio quando o profissional possuir autorizacao do titular e a divulgacao nao violar confidencialidade, propriedade intelectual, dados pessoais ou restricao contratual. A conclusao do projeto, por si so, nao autoriza sua divulgacao publica.",
      "A MWC pode remover item que viole estes termos ou direitos de terceiros. O profissional pode retirar o item de seu perfil, sem prejuizo da conservacao de registros necessarios para apuracao de violacao ou defesa de direitos.",
    ],
  },
  {
    title: "12. Taxa, carteira e saque",
    paragraphs: [
      "A MWC aplica taxa de 10% sobre o valor de cada projeto Tech processado. A taxa e descontada do repasse ao profissional e nao aumenta o total da proposta exibido ao cliente no checkout.",
      "O saldo liquido e creditado na carteira do profissional depois da aprovacao da entrega pelo cliente, do encerramento automatico do prazo de 7 dias sem contestacao ou de decisao de mediacao favoravel, desde que nao exista disputa, reembolso, chargeback ou revisao financeira pendente.",
      "O profissional pode solicitar saque de valor disponivel a partir de R$ 0,01, limitado ao saldo da carteira. O pagamento e realizado manualmente por Pix para a chave e o tipo de chave informados, com prazo estimado de ate 12 dias uteis calculado no momento da solicitacao.",
    ],
  },
  {
    title: "13. Dados Pix e responsabilidade tributaria",
    paragraphs: [
      "O profissional e responsavel por conferir valor, titularidade, tipo e conteudo da chave Pix antes de solicitar o saque. A solicitacao reserva e desconta o valor da carteira enquanto o pagamento e processado. Erro, invalidade ou divergencia pode atrasar, impedir ou exigir revisao manual do pagamento.",
      "Se perceber um erro, o profissional deve contatar imediatamente suporte@maximusworldclick.com. A MWC tentara corrigir solicitacoes ainda nao processadas, mas nao garante recuperacao de valor validamente transferido para a chave informada pelo profissional, ressalvadas as responsabilidades que nao possam ser afastadas por lei.",
      "O profissional e o unico responsavel por sua regularidade fiscal, pelo recolhimento de impostos e contribuicoes e pela emissao de nota fiscal, recibo ou documento exigido em relacao ao servico prestado ao cliente. A taxa da MWC e a intermediacao do pagamento nao substituem essas obrigacoes.",
    ],
  },
  {
    title: "14. Reembolsos, chargebacks e debitos",
    paragraphs: [
      "Reembolso, cancelamento, disputa ou chargeback pode suspender a liberacao do valor ou reverter credito relacionado ao projeto. O profissional deve fornecer informacoes verdadeiras e cooperar com a MWC e com o provedor de pagamento na apresentacao de evidencias.",
      "Se um chargeback for encerrado contra a operacao depois da liberacao ao profissional, a MWC podera descontar da carteira o valor recuperavel ate o limite do saldo disponivel. A parcela que exceder o saldo sera registrada separadamente como debito pendente de chargeback, sem tornar a carteira negativa.",
      "Debitos pendentes continuam devidos pelo profissional e podem justificar restricao de saque, de novos projetos ou da conta, mediante analise e comunicacao. O profissional pode solicitar ao suporte os dados da operacao e a revisao de eventual divergencia.",
    ],
  },
  {
    title: "15. Revisao, disputa e mediacao",
    paragraphs: [
      "Cliente ou profissional pode abrir disputa enquanto o projeto estiver em execucao ou em revisao, informando motivo suficiente. A abertura altera o projeto para o estado de disputa e suspende a liberacao do pagamento ate a decisao ou outro encerramento valido.",
      "Na mediacao, a MWC pode considerar a descricao do projeto, a proposta aceita, o escopo, os prazos, mensagens, arquivos, entregas, pedidos de revisao, registros de pagamento e demais evidencias apresentadas. As partes devem cooperar, preservar os registros e responder as solicitacoes dentro do prazo informado no atendimento.",
      "Conforme as evidencias e os termos aceitos, a mediacao administrativa pode determinar reembolso ao cliente ou liberacao do valor liquido ao profissional. A decisao e o motivo ficam registrados e sao comunicados as partes. A mediacao da MWC nao impede o exercicio de direitos perante o provedor de pagamento, orgaos competentes ou Poder Judiciario.",
    ],
  },
  {
    title: "16. Pagamentos e contatos fora da plataforma",
    paragraphs: [
      "Antes de existir projeto pago e ativo entre as partes, o sistema pode impedir o envio de telefone, e-mail, links ou outros dados de contato externo pelo chat. Depois do pagamento, esses dados podem ser compartilhados quando necessarios a execucao, mas os registros essenciais do projeto devem permanecer na plataforma.",
      "E proibido direcionar para fora da MWC uma contratacao iniciada ou viabilizada pela plataforma com a finalidade de evitar taxas, controles de seguranca, registro do escopo ou protecoes de pagamento. Operacoes realizadas fora dos fluxos da MWC nao contam com retencao, registro financeiro, suporte de pagamento ou mediacao da plataforma.",
    ],
  },
  {
    title: "17. Suspensao e encerramento da atuacao profissional",
    paragraphs: [
      "A MWC pode limitar propostas, saques ou outras funcionalidades e pode suspender a conta em caso de fraude, informacao falsa, violacao de direitos, descumprimento de projeto, tentativa de contornar taxas, abuso de disputa, risco de seguranca, debito pendente ou violacao destes termos. Quando a situacao permitir, o profissional sera informado e podera solicitar revisao ao suporte.",
      "O profissional pode solicitar o encerramento da conta pelo e-mail suporte@maximusworldclick.com. O pedido nao cancela automaticamente a assinatura Stripe; antes do encerramento, o profissional deve gerencia-la no portal de cobranca ou solicitar orientacao ao suporte.",
      "Cancelamento de assinatura, suspensao ou pedido de encerramento nao extingue projetos, entregas, revisoes, disputas, saques, reembolsos, chargebacks, debitos nem obrigacoes ja constituidas. A MWC pode impedir novas contratacoes e manter os registros e acessos estritamente necessarios para concluir operacoes pendentes, proteger as partes e cumprir obrigacoes legais.",
    ],
  },
  {
    title: "18. Alteracoes e vigencia",
    paragraphs: [
      "Alteracoes relevantes destes termos receberao nova versao. Quando necessario, a MWC comunicara a mudanca e solicitara novo aceite antes de o profissional continuar utilizando um fluxo afetado.",
      "Estes Termos Profissionais do Marketplace Tech entram em vigor em setembro de 2026 e permanecem aplicaveis enquanto o profissional utilizar os recursos do setor Tech, sem prejuizo das obrigacoes que devam sobreviver ao encerramento.",
    ],
  },
];

export default function TechTermsPage() {
  return (
    <LegalDocumentPage
      title="Termos Profissionais do Marketplace Tech"
      description="Regras especificas para profissionais que atuam com planos, projetos, propostas, entregas e recebimentos no setor Tech."
      version={PROFESSIONAL_TERMS.TECH.version}
      sections={sections}
      activeDocument="tech"
    />
  );
}
