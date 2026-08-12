import { LegalDocumentPage } from "@/modules/legal/components/legal-document-page";
import { PRIVACY_POLICY_VERSION } from "@/modules/legal/terms-versions";

const sections = [
  {
    title: "1. Identificacao e abrangencia",
    paragraphs: [
      "Esta Politica explica como a Maximus World Click - MWC, inscrita no CNPJ 66.229.191/0001-76, com sede na Rua Kenkiti Shimomoto, Jardim Boa Vista (Zona Oeste), Sao Paulo - SP, CEP 05583-000, trata dados pessoais no site, nos cadastros, no Marketplace Tech, no MWC Online, no suporte e nas demais funcionalidades da plataforma.",
      "Para os tratamentos em que determina as finalidades e os meios essenciais, a MWC atua como controladora. Profissionais independentes podem atuar como controladores dos dados que tratam na prestacao de seus proprios servicos, especialmente prontuarios, fichas, documentos, comunicacoes e copias mantidas fora da plataforma.",
      "Esta Politica complementa os Termos Gerais, os termos de cada setor e os avisos apresentados em formularios especificos. Ela se aplica a clientes, profissionais, visitantes, representantes e demais pessoas naturais cujos dados sejam tratados pela MWC.",
    ],
  },
  {
    title: "2. Dados fornecidos no cadastro",
    paragraphs: [
      "No cadastro comum, podemos tratar nome, e-mail, senha protegida por hash, tipo de usuario, setor escolhido, data de nascimento e aceite dos documentos legais. Conforme o preenchimento do perfil, tambem podemos tratar nome de exibicao, foto, telefone, genero, biografia, cidade, estado, CEP, endereco, numero, complemento e bairro.",
      "Clientes podem navegar por paginas publicas, pesquisar profissionais e consultar planos sem cadastro. Conta autenticada e exigida para abrir recursos restritos, contatar, contratar, enviar proposta, pagar, agendar, participar de atendimento, favoritar, avaliar e acompanhar atividades.",
      "A plataforma e destinada a maiores de 18 anos. Nao coletamos intencionalmente dados de criancas ou adolescentes pelo fluxo atual. Ao identificar cadastro de menor, podemos bloquear a conta, interromper o tratamento que nao possua fundamento legal e adotar as providencias cabiveis.",
    ],
  },
  {
    title: "3. Cadastro e acesso com Google",
    paragraphs: [
      "Ao escolher Entrar com Google, a autenticacao e realizada pelo Google. A MWC recebe o identificador da conta, nome, e-mail, confirmacao de que o e-mail foi verificado e foto de perfil disponibilizados pelo provedor. A foto pode ser copiada e armazenada no banco da MWC para exibir o perfil.",
      "A MWC nao recebe a senha da conta Google. O Google pode tratar dados do acesso conforme seus proprios termos e politica de privacidade. A vinculacao ocorre pelo e-mail verificado; por isso, o titular deve manter sua conta Google protegida e comunicar imediatamente qualquer acesso indevido.",
      "O login Google e diferente da integracao usada para criar eventos do Google Calendar e salas do Google Meet. Para atendimentos, nome, e-mail, data e horario dos participantes podem ser enviados ao Google para gerar, atualizar ou cancelar o convite e a videochamada.",
    ],
  },
  {
    title: "4. Dados profissionais e perfil publico",
    paragraphs: [
      "Profissionais Tech podem informar cargo, experiencia, competencias, valor por hora, links de GitHub e LinkedIn, portfolio, certificados, propostas, entregas e demais dados necessarios aos projetos. Profissionais do MWC Online podem informar especialidade, abordagem, materia de ensino, valor, duracao, agenda, fuso horario e registro profissional.",
      "Nome ou nome de exibicao, foto, biografia, cidade, especialidade, competencias, experiencia, portfolio, avaliacoes, valores e disponibilidade podem ser publicos conforme a funcionalidade. Endereco residencial completo, telefone, e-mail, chave Pix, saldos e documentos de verificacao nao devem ser exibidos publicamente pelo fluxo normal.",
      "Dados publicos podem ser visualizados por visitantes e indexados por mecanismos de busca. O profissional deve publicar somente conteudo que esteja autorizado a divulgar e pode solicitar correcao ou remocao pelos canais da MWC, ressalvados registros necessarios.",
    ],
  },
  {
    title: "5. Verificacao profissional e documentos",
    paragraphs: [
      "Para verificar profissionais do MWC Online, tratamos especialidade, conselho, numero e regiao de registro, qualificacao, resultado de consulta a fonte oficial, justificativas de revisao, datas de validade e documentos de identidade, credencial profissional e comprovante de qualificacao.",
      "Os arquivos podem incluir nome, imagem, assinatura, numero de documento e outros dados presentes no original. A MWC registra nome, formato, tamanho e resumo criptografico do arquivo para integridade. Solicitamos que o profissional nao envie informacoes excedentes ou documentos diferentes dos requeridos.",
      "Os documentos ficam disponiveis ao titular e aos administradores autorizados responsaveis por revisao ou suporte, com controles de acesso e respostas configuradas para impedir cache publico. A aprovacao, recusa ou suspensao pode envolver verificacao automatizada de completude, seguida de analise administrativa quando aplicavel.",
    ],
  },
  {
    title: "6. Projetos, propostas, chat e conteudo",
    paragraphs: [
      "No Marketplace Tech, tratamos titulos, descricoes, categorias, orcamentos, prazos, anexos ou links, propostas, valores, entregas, revisoes, disputas e avaliacoes. No chat, armazenamos participantes, mensagens, datas, estado de leitura e informacoes necessarias a seguranca e ao cumprimento das regras.",
      "Mensagens e conteudos podem ser analisados por regras de seguranca para detectar tentativa de compartilhar contatos, links externos, fraude ou contorno da plataforma. Administradores autorizados podem acessar informacoes quando necessario ao suporte, mediacao, prevencao a fraude, cumprimento legal ou investigacao de violacao.",
      "Quando o usuario remove uma conversa de sua visualizacao, isso nao significa necessariamente eliminacao imediata das mensagens para o outro participante ou dos registros necessarios a seguranca e ao exercicio de direitos.",
    ],
  },
  {
    title: "7. Agendamentos e dados sensiveis",
    paragraphs: [
      "No MWC Online, tratamos profissional e cliente vinculados, especialidade, data, horario, fuso, duracao, preco, situacao do pagamento, presenca, cancelamento, reagendamento, disputa e identificadores do evento e da sala virtual.",
      "Formularios, fichas e prontuarios podem conter queixa, historico, medicamentos, tratamentos, alergias, patologias, habitos, informacoes psicologicas, nutricionais e fisicas, alem de dados educacionais ou juridicos. Informacoes de saude sao dados pessoais sensiveis e recebem protecao reforcada.",
      "A MWC limita o acesso ao profissional vinculado ao atendimento e a pessoas autorizadas quando estritamente necessario. O profissional e responsavel pela legalidade, necessidade, sigilo e seguranca dos registros que produzir ou exportar no exercicio de sua atividade.",
    ],
  },
  {
    title: "8. Videochamadas",
    paragraphs: [
      "O atendimento por video utiliza Google Meet. Pelo fluxo atual, a MWC cria e armazena o link e os identificadores operacionais da reuniao, mas nao grava nem armazena o audio ou o video da sessao.",
      "A autorizacao para participar do atendimento nao autoriza sua gravacao. Qualquer gravacao, captura, transcricao externa ou divulgacao depende de informacao previa, fundamento legal, autorizacao expressa quando exigida e observancia das normas profissionais aplicaveis.",
      "Os participantes devem preservar a confidencialidade do link, usar ambiente e equipamento seguros e impedir acesso por terceiros. O tratamento realizado diretamente pelo Google segue as regras daquele fornecedor.",
    ],
  },
  {
    title: "9. Pagamentos, assinaturas e recebimentos",
    paragraphs: [
      "Tratamos plano, preco, moeda, assinatura, situacao da cobranca, identificadores de cliente, sessao e pagamento, reembolso, chargeback, disputa, transacao, saldo, saque, chave e tipo de Pix e comprovantes financeiros quando aplicavel.",
      "Pagamentos por cartao e demais meios habilitados sao processados pelo Stripe. A MWC nao armazena o numero completo do cartao nem o codigo de seguranca em seus servidores. O Stripe trata dados de pagamento, dispositivo, fraude e transacao conforme sua propria politica e seus deveres regulatorios.",
      "Aceites de pagamento e atos financeiros podem registrar usuario, versao aceita, data, IP e navegador para prova da contratacao, seguranca, prevencao a fraude, auditoria e exercicio regular de direitos.",
    ],
  },
  {
    title: "10. Dados tecnicos, cookies e armazenamento local",
    paragraphs: [
      "Podemos tratar endereco IP, data e horario, navegador, agente do usuario, identificadores de sessao, registros de erro, eventos de seguranca e informacoes sobre a interacao necessarias para autenticar, prevenir abuso, aplicar limites de requisicao, investigar falhas e manter a plataforma disponivel.",
      "A plataforma utiliza cookies ou tecnologias equivalentes estritamente necessarios a autenticacao, sessao, seguranca e funcionamento. Tambem utiliza armazenamento local do navegador para preferencias como modo de visualizacao e marcacao de avisos ja exibidos.",
      "Na versao atual auditada, a MWC nao identificou cookies proprios de publicidade comportamental nem ferramenta dedicada de analytics instalada. Se tecnologias opcionais de medicao ou publicidade forem adotadas, esta Politica e os controles de consentimento serao atualizados antes do uso quando a lei assim exigir.",
    ],
  },
  {
    title: "11. Comunicacoes e WhatsApp",
    paragraphs: [
      "Usamos nome, e-mail e informacoes do evento para mensagens de boas-vindas, recuperacao de senha, confirmacoes, alteracoes de agenda, pagamentos, suporte, seguranca e outras comunicacoes operacionais. O envio de e-mails e realizado com apoio do Resend.",
      "Quando o usuario autoriza comunicacoes por WhatsApp, registramos a concessao ou revogacao, telefone, versao do aviso, data, IP e navegador. O consentimento pode ser retirado pelo perfil ou pelo suporte, sem afetar tratamentos anteriores validamente realizados.",
      "Comunicacoes promocionais, quando existentes, devem oferecer meio facilitado de oposicao ou descadastro. Mensagens indispensaveis a conta, seguranca, pagamento ou servico contratado podem continuar enquanto houver relacao ou fundamento legal.",
    ],
  },
  {
    title: "12. Como obtemos os dados",
    paragraphs: [
      "Obtemos dados diretamente do titular em formularios, perfil, chat, projetos, propostas, atendimentos, pagamentos e suporte; do Google no login e na integracao de agenda; do Stripe em pagamentos, assinaturas, reembolsos e disputas; de profissionais que produzem registros do atendimento; e de fontes oficiais usadas para validar credenciais.",
      "Tambem geramos dados derivados da operacao, como situacao da conta, saldo, historico de transacoes, disponibilidade, notificacoes, contagem de visualizacoes, classificacao por plano e reputacao, registros de seguranca e trilhas de auditoria.",
    ],
  },
  {
    title: "13. Finalidades do tratamento",
    paragraphs: [
      "Tratamos dados para criar e autenticar contas; confirmar maioridade; manter perfis; conectar clientes e profissionais; operar busca, chat, projetos, propostas, agenda, video, pagamentos, assinaturas, saques e avaliacoes; enviar comunicacoes; prestar suporte; mediar disputas; verificar profissionais; prevenir fraude e abuso; proteger direitos; e cumprir obrigacoes legais e regulatorias.",
      "Tambem podemos usar dados minimizados ou anonimizados para diagnosticar falhas, medir capacidade operacional, aprimorar seguranca e desenvolver funcionalidades, sem tentar reidentificar titulares e sem usar prontuarios ou dados sensiveis para publicidade comportamental.",
    ],
  },
  {
    title: "14. Bases legais",
    paragraphs: [
      "Conforme o contexto, o tratamento pode se apoiar na execucao de contrato ou de procedimentos preliminares; cumprimento de obrigacao legal ou regulatoria; exercicio regular de direitos em processo; protecao da vida; tutela da saude por profissionais ou servicos habilitados; prevencao a fraude e seguranca do titular; legitimo interesse, com avaliacao de necessidade e direitos; protecao do credito; e consentimento, quando essa for a base adequada.",
      "Dados pessoais sensiveis somente sao tratados nas hipoteses permitidas pelo artigo 11 da LGPD. O consentimento nao e utilizado como justificativa generica quando outra base legal e mais apropriada, e sua revogacao nao invalida tratamentos anteriores nem impede conservacao legalmente autorizada.",
    ],
  },
  {
    title: "15. Compartilhamento e operadores",
    paragraphs: [
      "Compartilhamos apenas os dados necessarios com Stripe, para pagamentos e assinaturas; Google, para login, Calendar e Meet; Resend, para entrega de e-mails; fornecedores de banco de dados, hospedagem e infraestrutura; e prestadores de seguranca, suporte ou tecnologia contratados pela MWC.",
      "Dados tambem podem ser compartilhados entre cliente e profissional na medida necessaria ao servico; com administradores autorizados; com bancos e meios de pagamento; e com autoridades, reguladores, conselhos profissionais ou terceiros quando houver obrigacao legal, ordem valida, prevencao a fraude ou defesa de direitos.",
      "A MWC nao vende dados pessoais. Uma reorganizacao societaria, fusao, aquisicao ou transferencia de ativos pode envolver dados, mediante confidencialidade, continuidade das protecoes e informacao ao titular quando exigida.",
    ],
  },
  {
    title: "16. Transferencia internacional",
    paragraphs: [
      "Google, Stripe, Resend e fornecedores de infraestrutura podem processar ou armazenar dados fora do Brasil. Nessas situacoes, a MWC adota mecanismos admitidos pela LGPD e pela regulamentacao da ANPD, como clausulas contratuais adequadas, garantias do fornecedor e medidas tecnicas e organizacionais compativeis com o risco.",
      "A localizacao e a cadeia de suboperadores podem variar conforme a infraestrutura dos fornecedores. O titular pode solicitar informacoes adicionais sobre compartilhamentos e garantias aplicaveis pelo canal de privacidade.",
    ],
  },
  {
    title: "17. Decisoes automatizadas e ordenacao",
    paragraphs: [
      "A plataforma usa regras automatizadas para autenticacao, limites contra abuso, elegibilidade operacional, disponibilidade de agenda, liberacao financeira, deteccao de conflitos e ordenacao de profissionais. Resultados de busca podem considerar setor, especialidade, plano ativo, completude, reputacao e disponibilidade.",
      "A MWC nao utiliza, no fluxo atual, decisao exclusivamente automatizada para diagnostico ou conduta profissional. O titular pode pedir informacoes e revisao de decisao automatizada que afete seus interesses, observados segredos comercial e industrial e as hipoteses legais.",
    ],
  },
  {
    title: "18. Retencao e eliminacao",
    paragraphs: [
      "Os dados sao mantidos pelo tempo necessario a cada finalidade e, depois, eliminados ou anonimizados, salvo conservacao autorizada por obrigacao legal ou regulatoria, estudo com anonimização quando aplicavel, transferencia permitida, uso exclusivo com acesso vedado a terceiros, prevencao a fraude ou exercicio regular de direitos.",
      "Nao ha prazo geral de dois anos para todos os dados. Cadastros e conteudos podem permanecer enquanto a conta estiver ativa; registros contratuais, fiscais, financeiros, de aceite, fraude, auditoria e disputa permanecem pelos prazos legais e prescricionais aplicaveis; reservas temporarias e codigos de recuperacao expiram conforme sua finalidade.",
      "Prontuarios sujeitos a Lei 13.787/2018 somente podem ser eliminados depois do prazo minimo de 20 anos contado do ultimo registro, sem prejuizo de regra especifica ou prazo superior. Registros de incidentes de seguranca com dados pessoais devem ser conservados por pelo menos cinco anos conforme a regulamentacao da ANPD.",
    ],
  },
  {
    title: "19. Seguranca da informacao",
    paragraphs: [
      "A MWC adota medidas proporcionais ao risco, incluindo senhas protegidas por hash, e-mail verificado no login Google, sessoes autenticadas, limitacao de tentativas, controle de acesso por perfil e vinculo, trilhas de aceite e auditoria, validacao de arquivos, verificacao de integridade e restricoes de cache para documentos sensiveis.",
      "Nenhum sistema e totalmente imune a falhas. Usuarios devem usar senha exclusiva, proteger e-mail e conta Google, encerrar sessoes em dispositivos compartilhados, conferir destinatarios e comunicar imediatamente atividade suspeita. E proibido tentar contornar controles ou acessar dados de terceiros.",
      "A MWC revisa acessos e pode suspender contas, bloquear operacoes e preservar evidencias diante de risco, fraude ou incidente. Medidas tecnicas detalhadas podem permanecer confidenciais para nao comprometer a propria seguranca.",
    ],
  },
  {
    title: "20. Incidentes de seguranca",
    paragraphs: [
      "Incidentes suspeitos devem ser comunicados imediatamente a suporte@maximusworldclick.com. A MWC avaliara natureza, dados envolvidos, titulares, riscos e medidas de contencao e manterá o registro exigido pela regulamentacao.",
      "Quando um incidente puder acarretar risco ou dano relevante, a MWC, na condicao de controladora, comunicara a ANPD e os titulares afetados no prazo e com o conteudo previstos na regulamentacao vigente, ressalvado prazo especifico. Profissionais e operadores devem informar incidentes a MWC sem demora injustificada e colaborar com a apuracao.",
    ],
  },
  {
    title: "21. Direitos do titular",
    paragraphs: [
      "O titular pode solicitar confirmacao da existencia de tratamento; acesso; correcao; anonimização, bloqueio ou eliminacao de dados desnecessarios, excessivos ou tratados irregularmente; portabilidade quando regulamentada; informacao sobre compartilhamentos; informacao sobre a possibilidade de negar consentimento; revogacao do consentimento; oposicao; revisao de decisoes automatizadas; e eliminacao dos dados tratados com consentimento, ressalvadas as hipoteses legais.",
      "A MWC pode solicitar informacoes para confirmar a identidade e evitar fraude. Alguns pedidos podem ser limitados quando afetarem direitos de terceiros, segredo protegido, seguranca, obrigacao de guarda, contrato em andamento ou exercicio regular de direitos, sempre com justificativa cabivel.",
      "O titular pode ainda peticionar perante a ANPD e os orgaos de defesa do consumidor depois de buscar atendimento pelo canal da MWC, conforme a competencia de cada autoridade.",
    ],
  },
  {
    title: "22. Conta, exclusao e dados publicos",
    paragraphs: [
      "A exclusao da conta nao esta disponivel diretamente no sistema. O titular deve abrir chamado em suporte@maximusworldclick.com. A MWC confirmara a identidade, verificara projetos, atendimentos, saldos, disputas e obrigacoes pendentes e informara as providencias aplicaveis.",
      "O encerramento retira ou restringe o perfil e o acesso conforme o processo operacional, mas nao apaga automaticamente dados sujeitos a guarda legal, direitos de outros usuarios, prontuarios, registros financeiros, mensagens necessarias a disputas ou evidencias de fraude e seguranca.",
      "Conteudo previamente indexado por mecanismos de busca ou copiado licitamente por terceiros pode levar tempo para desaparecer de seus sistemas, que nao sao controlados pela MWC.",
    ],
  },
  {
    title: "23. Canal de privacidade",
    paragraphs: [
      "Pedidos de direitos, duvidas, reclamacoes e comunicacoes de incidentes podem ser enviados a suporte@maximusworldclick.com, com o assunto Privacidade ou LGPD. Esse e o canal atualmente divulgado pela MWC para titulares e autoridades.",
      "Para proteger o titular, a solicitacao deve partir preferencialmente do e-mail cadastrado e conter informacoes suficientes para localizar a conta e compreender o pedido. Dados sensiveis ou copias de documentos nao devem ser enviados por e-mail sem solicitacao e orientacao especifica do suporte.",
    ],
  },
  {
    title: "24. Alteracoes e vigencia",
    paragraphs: [
      "Esta Politica entra em vigor em setembro de 2026. Ela pode ser atualizada para refletir mudancas legais, regulatorias, tecnicas ou operacionais. Alteracoes materiais serao destacadas na plataforma ou comunicadas por meio adequado e poderao exigir novo aceite quando necessario.",
      "A versao publicada na plataforma prevalece a partir da data indicada, sem reduzir direitos adquiridos nem afastar obrigacoes legais aplicaveis.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="Politica de Privacidade"
      description="Como a MWC coleta, utiliza, compartilha, protege, conserva e elimina dados pessoais em toda a plataforma."
      version={PRIVACY_POLICY_VERSION}
      sections={sections}
      activeDocument="privacy"
    />
  );
}
