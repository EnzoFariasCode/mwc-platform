import { LegalDocumentPage } from "@/modules/legal/components/legal-document-page";
import { PROFESSIONAL_TERMS } from "@/modules/legal/terms-versions";

const sections = [
  {
    title: "1. Aplicacao e documentos complementares",
    paragraphs: [
      "Estes Termos regem a atuacao dos profissionais do setor HEALTH no MWC Online, inclusive consultas, aulas e orientacoes por video. Eles complementam os Termos Gerais, a Politica de Privacidade e os termos de pagamento aceitos no agendamento. Em caso de conflito, prevalecem a legislacao obrigatoria e as normas do conselho ou orgao competente.",
      "A MWC atua apenas como intermediadora tecnologica, de agenda e pagamento. Nao presta o atendimento, nao define diagnostico, conduta, estrategia ou resultado e nao integra a relacao tecnica estabelecida entre cliente e profissional.",
    ],
  },
  {
    title: "2. Maioridade e publico atendido",
    paragraphs: [
      "O MWC Online e destinado exclusivamente a pessoas com 18 anos completos ou mais. O profissional nao deve atender menor de idade pelo fluxo atual da plataforma e deve interromper o atendimento e comunicar o suporte se identificar informacao de idade falsa ou inconsistente.",
      "A plataforma nao e servico de emergencia. Situacoes de risco imediato, urgencia medica ou ameaca a vida devem ser encaminhadas aos servicos publicos e canais de emergencia apropriados.",
    ],
  },
  {
    title: "3. Cadastro, verificacao e habilitacao profissional",
    paragraphs: [
      "O profissional deve fornecer dados verdadeiros e atualizados de identidade, contato, especialidade, formacao, experiencia e, quando aplicavel, conselho, numero e regiao de registro. A MWC pode solicitar documento oficial de identidade, credencial profissional e comprovante de qualificacao, em PDF ou imagem, dentro dos limites tecnicos informados no cadastro.",
      "A publicacao e a possibilidade de receber agendamentos dependem da aprovacao da verificacao e da configuracao completa da especialidade. A MWC pode consultar fontes oficiais, pedir documento adicional, reprovar, suspender ou renovar a verificacao diante de vencimento, divergencia, fraude, perda de habilitacao ou risco aos usuarios.",
      "Documentos de verificacao ficam acessiveis apenas ao titular e a administradores autorizados para revisao e suporte. O profissional autoriza o tratamento desses dados para autenticacao, prevencao a fraude, seguranca, cumprimento de obrigacoes e exercicio regular de direitos, conforme a Politica de Privacidade.",
    ],
  },
  {
    title: "4. Perfil, preco e agenda",
    paragraphs: [
      "O profissional e responsavel pela exatidao do perfil, escopo do servico, duracao, valor, fuso horario e disponibilidade. Nao pode prometer cura, resultado garantido, titulo que nao possua ou servico fora de sua habilitacao legal e tecnica.",
      "O cliente pode consultar informacoes publicas antes do cadastro, mas precisa de conta para abrir o perfil completo, agendar, pagar, participar e acessar recursos restritos. O horario fica confirmado somente apos a aprovacao do pagamento; uma tentativa de checkout pode reservar temporariamente o horario por ate 15 minutos.",
    ],
  },
  {
    title: "5. Videochamada e acesso",
    paragraphs: [
      "A plataforma cria o atendimento por Google Meet e pode compartilhar com o Google o nome, e-mail, data e horario necessarios ao convite e ao evento. O link aparece aos participantes a partir de 10 minutos antes do inicio e permanece disponivel ate o termino previsto da sessao.",
      "O link e pessoal e confidencial. Profissional e cliente devem usar dispositivo, navegador, conexao e ambiente privados, impedir acesso por terceiros e nao publicar nem encaminhar o convite. A MWC nao grava nem armazena o audio ou o video da sessao pelo fluxo atual.",
      "Nenhuma das partes pode gravar, fotografar, transcrever por ferramenta externa ou divulgar o atendimento sem informacao previa, fundamento legal e autorizacao expressa dos envolvidos, alem da observancia das regras profissionais aplicaveis. A autorizacao para atender nao significa autorizacao para gravar.",
    ],
  },
  {
    title: "6. Falha tecnica e criacao da sala",
    paragraphs: [
      "Cada participante deve testar seus equipamentos e conexao. Falha de dispositivo ou internet de uma das partes nao e automaticamente atribuida a MWC e deve ser registrada no suporte para avaliacao do caso.",
      "Se a plataforma nao conseguir criar a sala apos as tentativas automaticas previstas no sistema, o agendamento pode ser marcado como falha de reuniao e o reembolso integral e solicitado automaticamente. O prazo de credito depende do Stripe, da operadora e do banco.",
    ],
  },
  {
    title: "7. Dados do cliente e dados sensiveis",
    paragraphs: [
      "Os formularios profissionais podem conter identificacao, contato, historico, queixa, medicamentos, alergias, habitos, informacoes psicologicas, nutricionais, fisicas, educacionais ou juridicas. Dados sobre saude sao dados pessoais sensiveis e exigem protecao reforcada pela LGPD.",
      "O profissional somente pode acessar e registrar dados de clientes vinculados a atendimento na plataforma, na medida necessaria a finalidade profissional. E proibido consultar por curiosidade, copiar para uso comercial, formar lista de marketing, vender, compartilhar ou reutilizar dados para finalidade incompatível.",
      "O profissional atua como responsavel pelo tratamento que realizar por conta propria, inclusive exportacoes, anotacoes externas e compartilhamentos que decidir fazer, devendo possuir fundamento legal, informar o titular quando devido e atender os direitos previstos na LGPD.",
    ],
  },
  {
    title: "8. Prontuario, ficha e anotacoes",
    paragraphs: [
      "O profissional deve registrar apenas informacoes pertinentes, verdadeiras, tecnicas e necessarias, observar sigilo e as normas de sua categoria e proteger prontuarios, fichas, evolucoes e notas privadas contra acesso, perda, alteracao ou divulgacao indevida.",
      "O acesso disponibilizado pela MWC nao substitui os deveres legais e profissionais de elaboracao, guarda, integridade, disponibilidade e entrega de copias ao titular. O profissional nao deve inserir senhas, dados bancarios completos ou informacoes de terceiros sem necessidade e fundamento adequados.",
      "Suspeita de acesso indevido, vazamento, perda de dispositivo ou envio equivocado deve ser comunicada imediatamente ao suporte, com preservacao das evidencias e colaboracao para contencao e atendimento das obrigacoes legais.",
    ],
  },
  {
    title: "9. Retencao e exclusao",
    paragraphs: [
      "Nao existe prazo geral de dois anos para apagar todos os dados. A conservacao varia conforme a finalidade, a categoria do dado e as obrigacoes legais, regulatorias e de defesa de direitos. Dados que deixarem de ser necessarios devem ser eliminados ou anonimizados com seguranca, ressalvadas as hipoteses legais de conservacao.",
      "Quando a Lei 13.787/2018 for aplicavel a prontuario de paciente, a eliminacao somente pode ocorrer depois do prazo minimo de 20 anos contado do ultimo registro, sem prejuizo de prazo superior ou regra especifica. Outras categorias profissionais devem observar seus proprios prazos legais e regulamentares.",
      "Exclusao ou encerramento da conta nao produz apagamento automatico de dados cuja guarda seja obrigatoria ou necessaria ao exercicio regular de direitos. Os criterios completos de retencao, compartilhamento e direitos do titular pertencem a Politica de Privacidade.",
    ],
  },
  {
    title: "10. Sigilo e contato fora da plataforma",
    paragraphs: [
      "O profissional deve preservar o sigilo do atendimento e das comunicacoes, inclusive perante familiares, empregadores e outros profissionais, salvo autorizacao valida ou hipotese legal. Informacoes em notificacoes e mensagens devem ser limitadas ao necessario.",
      "Contato externo indispensavel ao cuidado ou ao servico deve respeitar a finalidade informada e a legislacao. E proibido retirar da plataforma atendimentos originados nela para contornar pagamento, taxa, registro, seguranca ou mediacao da MWC.",
    ],
  },
  {
    title: "11. Reagendamento",
    paragraphs: [
      "Pelo fluxo atual, somente o profissional pode reagendar consulta confirmada. O pedido deve ocorrer com pelo menos 24 horas de antecedencia do horario original e o novo horario tambem deve estar pelo menos 24 horas no futuro, dentro da disponibilidade e sem conflito de agenda.",
      "O pagamento original permanece valido e nao ha nova cobranca. O profissional deve combinar a mudanca com o cliente antes de executa-la; uso abusivo ou alteracao unilateral recorrente pode resultar em cancelamento, reembolso e medida sobre a conta.",
    ],
  },
  {
    title: "12. Cancelamento pelo cliente",
    paragraphs: [
      "Cancelamento solicitado pelo cliente mais de 24 horas antes do inicio gera reembolso integral. Com menos de 24 horas, mas antes do inicio, o fluxo atual nao gera reembolso e libera o valor ao profissional como compensacao pela reserva, ressalvados direitos obrigatorios do consumidor e a analise de falha, caso fortuito, forca maior ou outra circunstancia comprovada.",
      "O prazo usual informado pelo processador para o credito do reembolso e de 5 a 10 dias uteis, mas pode variar conforme operadora, banco e meio de pagamento. A MWC nao controla a data em que a instituicao financeira exibe o credito.",
    ],
  },
  {
    title: "13. Cancelamento e falta do profissional",
    paragraphs: [
      "Se o profissional cancelar, nao comparecer ou ficar indisponivel para prestar o atendimento, o cliente tem direito ao reembolso integral, independentemente da antecedencia. O profissional deve cancelar pelo sistema e informar motivo verdadeiro; nao pode marcar como concluido ou falta do cliente um atendimento que nao prestou.",
      "Cancelamentos, atrasos ou faltas recorrentes podem reduzir a disponibilidade, suspender novos agendamentos, gerar revisao da verificacao ou causar o encerramento da atuacao profissional, sem prejuizo de estornos e compensacoes legalmente cabiveis.",
    ],
  },
  {
    title: "14. Nao comparecimento do cliente",
    paragraphs: [
      "A falta do cliente somente pode ser registrada pelo profissional depois do horario final previsto. Nessa situacao, o sistema libera o valor ao profissional e nao gera reembolso automatico, ressalvadas a legislacao obrigatoria e a posterior mediacao de evidencia de falha ou impedimento relevante.",
      "O profissional deve permanecer disponivel durante o horario contratado e preservar elementos operacionais suficientes para demonstrar sua presenca, sem gravar o conteudo confidencial da sessao sem autorizacao.",
    ],
  },
  {
    title: "15. Pagamento, taxa e liberacao",
    paragraphs: [
      "O pagamento e processado pelo Stripe e fica retido ate o desfecho do atendimento. A MWC aplica taxa de 10% sobre o valor processado e credita ao profissional o saldo liquido depois da conclusao, do no-show valido ou do cancelamento tardio do cliente.",
      "O profissional pode confirmar a conclusao somente depois do termino previsto. Na ausencia de acao ou disputa, uma consulta confirmada pode ser concluida automaticamente 24 horas depois do horario final agendado. A solicitacao de saque manual possui prazo operacional estimado de ate 12 dias.",
      "Dados Pix ou bancarios incorretos, desatualizados ou de terceiro sao de responsabilidade do profissional e podem atrasar ou impedir o pagamento. A MWC pode reter o saque para validacao de titularidade, seguranca, fraude, disputa ou cumprimento legal.",
    ],
  },
  {
    title: "16. Disputas, estornos e chargebacks",
    paragraphs: [
      "Depois do inicio previsto, o cliente pode abrir disputa pela plataforma com justificativa. Enquanto o caso estiver em analise, a liberacao financeira fica suspensa e as partes devem apresentar, no prazo solicitado, agenda, mensagens e outros elementos pertinentes, sem expor conteudo sensivel alem do necessario.",
      "A MWC realiza mediacao administrativa e pode liberar o valor ao profissional ou reembolsar o cliente conforme os registros, a cooperacao das partes, a prestacao do atendimento e a legislacao. A mediacao nao substitui conselho profissional, Procon, plataforma consumidor.gov.br, autoridade de protecao de dados ou Poder Judiciario.",
      "Chargeback, fraude, pagamento duplicado, reembolso ou correcao posterior podem suspender ou reverter creditos e produzir saldo negativo. A MWC pode compensar esse saldo com valores futuros, solicitar regularizacao e bloquear saques, com informacao ao profissional e observancia da lei.",
    ],
  },
  {
    title: "17. Condutas proibidas",
    paragraphs: [
      "Sao proibidos assedio, discriminacao, falsidade documental, compartilhamento de conta, manipulacao de agenda, cobranca paralela para evitar taxa, solicitacao desnecessaria de dados sensiveis, uso de dados para publicidade sem base legal e qualquer atendimento ilegal ou fora da habilitacao.",
      "Tambem e proibido utilizar prontuarios ou dados da plataforma para treinar sistemas de inteligencia artificial, realizar perfilamento, pesquisa, publicacao, estudo de caso ou divulgacao em portfolio sem fundamento legal e, quando exigido, consentimento especifico, destacado e comprovavel.",
    ],
  },
  {
    title: "18. Suspensao e encerramento",
    paragraphs: [
      "A MWC pode limitar o perfil, suspender agendamentos ou encerrar a atuacao em caso de risco, fraude, documento invalido, perda de registro, violacao de sigilo, incidentes de seguranca, reiteracao de faltas ou descumprimento destes Termos, assegurada comunicacao e possibilidade de suporte quando cabivel.",
      "No encerramento, atendimentos pendentes podem ser cancelados, reagendados ou submetidos a reembolso e mediacao. Valores continuam sujeitos a disputa, chargeback e compensacao; dados e registros permanecem pelo tempo legalmente necessario. O profissional deve assegurar continuidade, encaminhamento e acesso do cliente a seus registros quando exigidos por lei ou regra profissional.",
    ],
  },
  {
    title: "19. Alteracoes, suporte e foro",
    paragraphs: [
      "Alteracoes materiais serao apresentadas em nova versao e poderao exigir novo aceite antes da continuidade da atuacao. Regras operacionais e de seguranca podem ser atualizadas imediatamente quando necessarias para prevenir fraude, cumprir a lei ou proteger usuarios.",
      "Solicitacoes sobre conta, pagamento, privacidade ou incidente devem ser enviadas a suporte@maximusworldclick.com. Aplica-se a legislacao brasileira e o foro de Sao Paulo - SP, sem afastar foro ou competencia obrigatoria assegurados ao consumidor ou ao titular de dados.",
    ],
  },
];

export default function OnlineTermsPage() {
  return (
    <LegalDocumentPage
      title="Termos Profissionais do MWC Online"
      description="Regras de verificacao, atendimento por video, dados sensiveis, agenda e pagamentos para profissionais do MWC Online."
      version={PROFESSIONAL_TERMS.HEALTH.version}
      sections={sections}
      activeDocument="online"
    />
  );
}
