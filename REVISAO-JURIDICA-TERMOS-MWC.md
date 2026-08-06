# Dossiê para revisão jurídica — MWC Online

**Finalidade:** fornecer ao advogado os textos legais atualmente exibidos pela plataforma, explicar os respectivos fluxos de aceite e indicar pontos que exigem decisão ou redação jurídica.

**Data-base técnica:** 6 de agosto de 2026.

**Natureza deste documento:** inventário técnico do sistema. Não constitui parecer jurídico e não afirma conformidade com a LGPD, o Código de Defesa do Consumidor, o Marco Civil da Internet, normas de teleatendimento ou regras de conselhos profissionais.

---

## 1. Informações institucionais a completar

Solicita-se ao advogado confirmar quais destas informações devem aparecer em cada documento:

- Razão social: **[PREENCHER]**
- Nome fantasia: **MWC / MWC Online — confirmar denominação jurídica**
- CNPJ: **[PREENCHER]**
- Endereço da sede: **[PREENCHER]**
- Representante legal: **[PREENCHER]**
- E-mail jurídico: **[PREENCHER]**
- E-mail de suporte atualmente exibido: `suporte@maximusworldclick.com`
- Encarregado/DPO: **[PREENCHER OU DEFINIR SE A IDENTIFICAÇÃO NOMINAL É APLICÁVEL]**
- Canal para direitos dos titulares: **[PREENCHER]**
- Foro e legislação aplicável: **[PREENCHER]**
- Telefone oficial: **[PREENCHER — o rodapé possui número aparentemente provisório]**

---

## 2. Visão geral dos documentos e aceites

| Documento | Público | Momento de uso | Aceite/evidência atual |
|---|---|---|---|
| Termos Gerais de Uso | Clientes e profissionais | Cadastro por e-mail e senha; referência complementar no checkout Tech | Checkbox obrigatório no cadastro; versão, data, IP e user-agent registrados em `TermsAcceptance` |
| Termos Profissionais do MWC Online | Profissionais do setor Saúde (`HEALTH`) | Cadastro profissional | Checkbox obrigatório; versão setorial registrada em `TermsAcceptance` |
| Termos Profissionais do Marketplace Tech | Profissionais do setor Tech (`TECH`) | Cadastro profissional | Checkbox obrigatório; versão setorial registrada em `TermsAcceptance` |
| Termos de Contratação de Projetos Tech | Cliente contratante | Checkout de uma proposta Tech | Checkbox obrigatório; registro ligado ao comprador, projeto, proposta, valor, moeda e sessão Stripe |
| Política de Privacidade | Clientes e profissionais | Cadastro e navegação legal; referenciada na verificação profissional | Aceita em conjunto com os Termos Gerais no cadastro por e-mail |
| Termos de Pagamento de Saúde | Paciente/cliente | Checkout de consulta, aula ou orientação de saúde | Modal e checkbox obrigatórios; aceite versionado e ligado à sessão Stripe |
| Autorização de verificação profissional | Profissional de Saúde | Envio de documentos para verificação | Checkbox obrigatório; data e versão registradas no processo de verificação |
| Consentimento para WhatsApp | Profissional de Saúde | Edição do perfil | Consentimento separado e revogável, com histórico de concessão/negação |

### Ressalva técnica relevante

O cadastro por Google/OAuth não exige atualmente os checkboxes do cadastro por e-mail e não cria um registro `TermsAcceptance`. Portanto, a afirmação de que todos os usuários aceitam os Termos Gerais e a Política de Privacidade no cadastro **não é tecnicamente verdadeira para contas criadas por Google**.

Além disso, o aceite por e-mail usa um único checkbox para os Termos Gerais e a Política de Privacidade. `TermsAcceptance` registra a versão dos Termos Gerais e, para profissionais, a versão setorial, mas **não possui um campo separado para a versão da Política de Privacidade**.

---

## 3. Termos Gerais de Uso

**Rota:** `/termos`  
**Versão técnica:** `general-v1.0`  
**Arquivo:** `src/app/(main)/termos/page.tsx`

**Proposta atual:** estabelecer regras comuns de conta, segurança, comunicação, pagamentos e uso da plataforma. Não substitui os termos específicos dos setores Saúde e Tech nem os termos de cada contratação.

**Uso atual:** checkbox obrigatório no cadastro por e-mail e senha para clientes e profissionais. No checkout Tech, aparece como documento complementar aos Termos de Contratação Tech.

### Texto atualmente exibido

#### Termos Gerais de Uso

Regras comuns para criação de conta, segurança, comunicação e uso da plataforma MWC. Este documento não inclui regras exclusivas de projetos Tech ou atendimentos Online.

#### 1. Conta e elegibilidade

O usuário deve fornecer informações verdadeiras, manter seus dados atualizados e proteger suas credenciais de acesso. A conta é pessoal e não pode ser cedida sem autorização da MWC.

#### 2. Uso da plataforma

A plataforma oferece recursos de perfil, comunicação, contratação e acompanhamento. O usuário deve utilizar esses recursos de forma lícita, respeitosa e compatível com a finalidade informada em cada fluxo.

Condutas fraudulentas, assédio, envio de conteúdo ilegal, tentativa de contornar controles de segurança ou uso indevido de dados podem resultar em restrição ou encerramento da conta.

#### 3. Pagamentos e mediação

Quando houver uma operação paga, o processamento ocorre pelos meios exibidos no respectivo fluxo. A MWC registra os status da operação e pode mediar cancelamentos, reembolsos e disputas conforme os termos específicos aplicáveis.

Estes Termos Gerais não substituem as regras do Marketplace Tech ou do MWC Online. O usuário profissional aceita somente o documento correspondente ao seu setor principal.

#### 4. Comunicações e registros

O usuário autoriza o envio de comunicações operacionais relacionadas à conta, segurança, pagamentos e atividades realizadas na plataforma. Aceites podem ser registrados com versão, data, endereço IP e identificação do navegador.

#### 5. Atualizações

Alterações relevantes destes termos receberão uma nova versão. Quando necessário, a plataforma solicitará novo aceite antes da continuidade de um fluxo afetado.

---

## 4. Termos Profissionais do MWC Online — Saúde

**Rota:** `/termos/online`  
**Versão técnica:** `online-professional-v1.0`  
**Arquivo:** `src/app/(main)/termos/online/page.tsx`

**Proposta atual:** estabelecer regras operacionais para profissionais do setor Saúde que oferecem consultas, aulas ou orientações online.

**Uso atual:** checkbox obrigatório no cadastro quando o usuário escolhe o setor profissional `HEALTH`.

### Texto atualmente exibido

#### Termos Profissionais do MWC Online

Regras específicas para profissionais que oferecem consultas, aulas e orientações online.

#### 1. Aplicação

Estes termos se aplicam exclusivamente a profissionais com setor principal HEALTH que oferecem consultas, aulas ou orientações no MWC Online. Projetos e planos do Marketplace Tech não fazem parte deste documento.

#### 2. Perfil e responsabilidade profissional

O profissional deve informar especialidade, experiência e registro quando aplicável, mantendo os dados atualizados. A exibição dessas informações não equivale a verificação documental pela MWC, salvo indicação expressa de processo concluído.

#### 3. Agenda e atendimento

O profissional define disponibilidade, duração e valor. Depois da confirmação do pagamento, paciente e profissional recebem acesso ao atendimento online no horário marcado.

#### 4. Taxa e liberação do saldo

A MWC aplica taxa de 10% sobre o atendimento processado. O saldo líquido é liberado conforme a conclusão da consulta e as regras operacionais, inclusive conclusão automática após 24 horas quando aplicável.

Disputas, reembolsos e chargebacks podem suspender ou reverter valores. Após a solicitação de saque, o pagamento manual possui prazo estimado de até 12 dias.

#### 5. Cancelamento, não comparecimento e disputa

Cancelamentos do paciente com mais de 24 horas de antecedência geram reembolso integral. Com menos de 24 horas, não há reembolso. Se o profissional cancelar ou não comparecer, o paciente tem direito ao reembolso integral.

O paciente pode abrir disputa após o horário do atendimento. Durante a análise, o valor permanece retido até a decisão registrada pela mediação.

---

## 5. Termos Profissionais do Marketplace Tech

**Rota:** `/termos/tech`  
**Versão técnica:** `tech-professional-v1.0`  
**Arquivo:** `src/app/(main)/termos/tech/page.tsx`

**Proposta atual:** estabelecer regras para profissionais Tech sobre projetos, propostas, planos, entregas, taxas, saques, disputas e chargebacks.

**Uso atual:** checkbox obrigatório no cadastro quando o usuário escolhe o setor profissional `TECH`. Não é o documento principal aceito pelo cliente no checkout.

### Texto atualmente exibido

#### Termos Profissionais do Marketplace Tech

Regras específicas para profissionais que atuam com projetos, propostas e entregas no setor Tech.

#### 1. Aplicação

Estes termos se aplicam exclusivamente a profissionais com setor principal TECH que participam do Marketplace Tech. Consultas, aulas e orientações do MWC Online não fazem parte deste documento.

#### 2. Projetos e propostas

O profissional pode localizar projetos, enviar propostas e executar o escopo aprovado pelo cliente. Valor, prazo, entregáveis e comunicações registrados na plataforma compõem o histórico da contratação.

#### 3. Planos e visibilidade

Os planos Gratuito, Starter e Advanced possuem limites e prioridade diferentes. Na busca e nas propostas, a prioridade segue Advanced, Starter e Gratuito, preservados filtros e critérios de qualidade dentro de cada grupo.

#### 4. Taxa e liberação do saldo

A MWC aplica taxa de 10% sobre o valor do projeto processado. O saldo líquido é liberado na carteira do profissional depois que o cliente aprova a entrega, salvo disputa, reembolso, chargeback ou revisão financeira pendente.

Após a solicitação de saque, o pagamento manual para a chave informada possui prazo estimado de até 12 dias. O profissional deve confirmar valor, destino e prazo antes de enviar a solicitação.

#### 5. Disputas e chargebacks

Cliente e profissional podem utilizar os recursos de revisão e disputa disponíveis. Valores podem permanecer suspensos ou ser revertidos durante uma mediação ou chargeback aberto junto à operadora do cartão.

---

## 6. Termos de Contratação de Projetos Tech

**Rota:** `/termos/tech/contratacao`  
**Versão técnica:** `tech-contract-v1.0`  
**Arquivo:** `src/app/(main)/termos/tech/contratacao/page.tsx`

**Proposta atual:** reger a contratação específica feita pelo cliente no checkout de uma proposta Tech.

**Uso atual:** checkbox desmarcado por padrão e obrigatório antes da criação ou reutilização da sessão Stripe. O servidor também recusa a chamada se o aceite não for enviado.

**Evidência registrada:** comprador, projeto, proposta, valor, moeda, versão, data, IP, user-agent, URL/ID da sessão Stripe e ID da intenção de pagamento quando disponível.

### Texto atualmente exibido

#### Termos de Contratação de Projetos Tech

Condições aceitas pelo cliente ao contratar e pagar uma proposta de projeto no Marketplace Tech.

#### 1. Objeto da contratação

Estes termos regulam a contratação, pelo cliente, de um projeto executado por um profissional do Marketplace Tech. A proposta selecionada, o escopo, o valor, o prazo, os entregáveis e as comunicações registradas na plataforma integram a contratação.

Antes do pagamento, o cliente deve revisar o projeto e a proposta escolhida. Alterações de escopo, prazo ou valor devem ser registradas na plataforma e aceitas pelas partes.

#### 2. Pagamento e retenção do valor

O pagamento é processado pela Stripe. Os dados completos do cartão não são armazenados pela MWC. A taxa de 10% da plataforma é descontada do repasse ao profissional e não aumenta o total exibido ao cliente no checkout.

Após a aprovação do pagamento, o valor permanece retido e mediado pela MWC. O repasse ao profissional ocorre depois da aprovação da entrega pelo cliente ou da finalização automática, desde que não exista disputa, reembolso, chargeback ou revisão financeira pendente.

#### 3. Entrega, revisão e aprovação

O profissional deve entregar o trabalho conforme o escopo e o prazo registrados. Depois da entrega, o cliente possui 7 dias para aprovar, solicitar revisão fundamentada ou abrir disputa por descumprimento.

Se o cliente não se manifestar nesse prazo, o projeto pode ser finalizado automaticamente e o pagamento liberado ao profissional. Pedidos de revisão devem guardar relação com o escopo contratado e não podem exigir trabalho adicional sem novo acordo.

#### 4. Cancelamento, reembolso e disputa

O cancelamento com solicitação de estorno ao meio de pagamento fica disponível pelo fluxo indicado na plataforma durante as primeiras 12 horas após a confirmação, desde que o serviço ainda não tenha sido executado ou entregue.

Depois desse período, divergências sobre escopo, prazo, qualidade ou entrega devem ser tratadas pelo fluxo de revisão ou disputa. Durante a análise, a MWC pode manter o valor suspenso e solicitar evidências das partes. Reembolsos e reversões dependem da situação registrada, da decisão da mediação e das regras do provedor de pagamento.

#### 5. Chargebacks e cooperação

A abertura de chargeback junto ao emissor do meio de pagamento pode suspender ou reverter valores. Cliente e profissional devem fornecer informações verdadeiras e cooperar com a análise. O uso abusivo dos mecanismos de disputa ou chargeback pode resultar em restrição da conta, sem prejuízo das medidas aplicáveis.

#### 6. Registro do aceite

Ao marcar o checkbox no checkout e prosseguir, o cliente declara que leu e aceitou esta versão dos termos para a proposta indicada. A MWC pode registrar usuário, projeto, proposta, valor, moeda, versão, data, endereço IP, navegador e identificadores da sessão de pagamento para manter evidência auditável da contratação.

Os Termos Gerais de Uso e a Política de Privacidade da MWC também se aplicam ao uso da conta e ao tratamento de dados pessoais.

---

## 7. Política de Privacidade

**Rota:** `/privacidade`  
**Versão exibida:** `privacy-v1.0`  
**Arquivo:** `src/app/(main)/privacidade/page.tsx`

**Proposta atual:** informar genericamente quais dados são tratados, as finalidades, o registro de aceites e parte dos direitos do titular.

**Uso atual:** aceita em conjunto com os Termos Gerais no cadastro por e-mail e senha. É referenciada pela autorização de verificação profissional.

### Texto atualmente exibido

#### Política de Privacidade

Informações sobre os dados tratados pela MWC e as finalidades relacionadas ao funcionamento da plataforma.

#### 1. Dados tratados

A MWC trata dados de cadastro, perfil, comunicação, transação e uso necessários para operar a plataforma. Dados de cartão são processados pela Stripe e não são armazenados diretamente nos servidores da MWC.

#### 2. Finalidades

Os dados são usados para autenticação, prevenção a fraude, execução dos fluxos contratados, comunicações operacionais, suporte, mediação de disputas e cumprimento de obrigações legais.

#### 3. Aceites e segurança

Aceites legais podem registrar versão do documento, setor profissional, data, endereço IP e identificação do navegador para manter um histórico auditável.

#### 4. Direitos do titular

O titular pode solicitar acesso, correção ou informações sobre o tratamento de seus dados pelos canais oficiais de atendimento, observados os prazos e deveres legais de conservação.

---

## 8. Termos de Pagamento de atendimentos de Saúde

**Formato:** modal, sem página independente  
**Versão gravada atualmente:** `v1.0`  
**Arquivo:** `src/modules/health/components/payment-terms-modal.tsx`  
**Uso:** `/checkout-saude`

**Proposta atual:** definir retenção e liberação do pagamento, Stripe, cancelamentos, reembolsos, não comparecimento, disputas e chargebacks.

**Aceite atual:** checkbox obrigatório antes do pagamento. O backend registra usuário, data, IP, user-agent, versão e sessão Stripe em `PaymentTermsAcceptance`; parte dessa evidência também aparece em `Appointment`.

### Texto atualmente exibido

#### Retenção do valor (escrow)

O valor pago ficará registrado e retido pela plataforma após a aprovação do pagamento. Ele não será liberado ao profissional até que o atendimento seja concluído, respeitadas as regras de cancelamento, disputa e chargeback.

#### Liberação do valor

O valor será liberado ao profissional após a confirmação de conclusão do atendimento, seja pelo profissional ou automaticamente pelo sistema após 24 horas do horário agendado, desde que não exista disputa ou revisão financeira pendente.

#### Segurança de pagamento

Seu pagamento é processado pelo Stripe com criptografia PCI-DSS nível 1. Seus dados de cartão não são armazenados em nossos servidores.

#### Cancelamento e reembolso pelo cliente

Cancelamento com mais de 24 horas de antecedência: reembolso integral processado em até 5 a 10 dias úteis no método de pagamento original. Cancelamento com menos de 24 horas de antecedência: sem direito a reembolso. O valor será repassado ao profissional como compensação pela reserva do horário.

#### Não comparecimento do cliente

Caso você não compareça ao atendimento sem cancelamento prévio, o valor será integralmente repassado ao profissional. Não há reembolso nessa situação.

#### Cancelamento ou não comparecimento do profissional

Caso o profissional cancele ou não compareça, você terá direito a reembolso integral, independentemente do prazo. O reembolso será processado em até 5 a 10 dias úteis.

#### Disputas e chargebacks

Disputas abertas na plataforma e chargebacks iniciados junto à operadora do cartão podem suspender a liberação ou reverter valores enquanto o caso é analisado. A MWC registra o aceite e realiza a mediação conforme estes termos.

#### Declaração do checkbox

Confirmo que li, entendi e aceito todos os termos de pagamento acima descritos. Também confirmo que autorizo o processamento seguro do meu pagamento.

---

## 9. Autorização de verificação profissional

**Arquivo:** `src/modules/health/components/professional-verification-form.tsx`  
**Uso:** `/agendar-consulta/verificacao`

**Proposta atual:** autorizar o tratamento dos documentos enviados exclusivamente para verificar identidade e habilitação profissional.

**Aceite atual:** checkbox obrigatório no envio. O processo registra `privacyAcceptedAt` e `privacyTermsVersion`.

### Texto atualmente exibido

> Confirmo que os documentos são autênticos e autorizo seu tratamento exclusivamente para verificação de identidade e habilitação profissional, conforme a Política de Privacidade da MWC.

Esta autorização não equivale a consentimento do paciente para tratamento de dados clínicos ou de saúde.

---

## 10. Consentimento para WhatsApp

**Arquivo:** `src/modules/health/components/edit-profile-modal.tsx`

Existe consentimento separado e revogável para uso do WhatsApp no perfil profissional. O sistema mantém histórico de concessão ou negação, telefone, versão, IP, user-agent e data em `WhatsappConsentEvent`.

Solicita-se revisão jurídica do texto e confirmação das finalidades permitidas, frequência, responsabilidade pelo contato e procedimento de revogação.

### Texto atualmente exibido

> Autorizo a MWC a enviar notificações de atendimento para o número informado e concordo com os Termos de Uso e com as políticas da MWC Online para notificações, agendamentos, cancelamentos e reembolsos.

---

## 11. Dados e integrações que os documentos devem considerar

### Dados pessoais e clínicos

A plataforma pode armazenar, entre outros:

- nome, e-mail, telefone, nascimento, gênero e endereço;
- CPF, RG, CNPJ e informações de cobrança em cadastros de clientes;
- registro e documentos de habilitação profissional;
- consulta, agenda, profissional escolhido, queixa principal e motivo de cancelamento;
- histórico clínico e familiar, medicamentos, patologias, alergias, sono, estresse, atividade física, álcool, tabagismo e preferências alimentares;
- notas de sessão, evolução, próximos passos e notas privadas;
- mensagens e outros campos livres que podem receber dados de saúde;
- identificadores Stripe, valores, PIX, transações, saques, disputas e chargebacks;
- IP, user-agent, versões e datas de aceites legais;
- tokens de contas OAuth.

### Provedores e compartilhamentos técnicos

- **Stripe:** recebe e-mail, identificadores internos, dados da contratação, valor e metadados de aceite. Os dados completos de cartão são coletados no checkout hospedado pela Stripe.
- **Google Calendar/Meet:** pode receber e-mails das partes, nome do profissional, data e horário, identificação de “Consulta MWC Online” e referência de sessão.
- **Resend/e-mail:** mensagens transacionais podem conter nomes, datas, horários, valores, link da consulta e motivos de cancelamento inseridos em campo livre.
- **PostgreSQL/hospedagem:** armazena cadastros, dados clínicos, documentos profissionais e registros financeiros; localização, retenção, backups e controles reais devem ser confirmados operacionalmente.

---

## 12. Pontos prioritários para decisão do advogado

### Identificação e estrutura contratual

- Identificar corretamente a pessoa jurídica responsável e seus canais oficiais.
- Definir o papel jurídico da MWC: plataforma intermediadora, fornecedora, marketplace, operadora de pagamentos ou combinação desses papéis.
- Definir responsabilidades de cliente, profissional e MWC em cada setor.
- Definir foro, lei aplicável, vigência, rescisão, suspensão e alteração dos documentos.
- Avaliar se os termos devem prever idade mínima e representação de menores ou incapazes.

### Consumidor, pagamentos e marketplace

- Validar taxas de 10%, prazo de saque de até 12 dias e regras de retenção/liberação.
- Validar cancelamento Tech em 12 horas, aprovação automática após 7 dias e hipóteses de reembolso.
- Validar cancelamentos de Saúde com corte de 24 horas e regras de não comparecimento.
- Definir direito de arrependimento e sua aplicação aos serviços e conteúdos digitais oferecidos.
- Definir procedimento, prazos, critérios e efeitos de mediação, disputa e chargeback.
- Confirmar se “escrow”, “conta cofre” ou “valor retido pela MWC” descrevem corretamente a operação financeira e podem ser usados publicamente.
- Validar alegação de “PCI-DSS nível 1” e atribuição dessa certificação ao Stripe.

### Saúde e teleatendimento

- Definir quais categorias profissionais podem atender e quais normas de conselho se aplicam.
- Incluir aviso de que a plataforma não substitui atendimento presencial de urgência ou emergência e orientar SAMU/192/pronto-socorro quando pertinente.
- Definir responsabilidades por diagnóstico, orientação, prescrição, prontuário, sigilo e continuidade do cuidado.
- Definir atendimento de menores/incapazes e consentimento do responsável.
- Definir prazo de retenção de prontuários por categoria profissional.
- Avaliar a necessidade e a base legal de consentimento destacado para dados de saúde.

### LGPD e privacidade

- Identificar controlador(es), operador(es), encarregado/DPO e canais de contato.
- Mapear bases legais por finalidade, especialmente para dados sensíveis de saúde.
- Detalhar categorias de dados, finalidades, destinatários e transferências internacionais.
- Definir retenção e descarte por categoria, incluindo documentos profissionais, prontuários, mensagens, logs, tokens e backups.
- Criar procedimento para acesso, correção, portabilidade, oposição, anonimização, eliminação e revogação.
- Definir exclusão ou anonimização da conta, considerando obrigações legais de conservação.
- Revisar compartilhamento com Stripe, Google e Resend.
- Avaliar cookies essenciais e necessidade de política/banner se analytics ou publicidade forem adicionados.

### Propriedade intelectual e conteúdo

- Definir titularidade e licenças sobre projetos, propostas, entregáveis e anexos.
- Definir quando os direitos são transferidos ao cliente e se isso depende do pagamento integral.
- Tratar materiais de terceiros, confidencialidade, portfólio e uso de marca.
- Definir responsabilidade por conteúdo ilegal, violação autoral e notificações de remoção.

---

## 13. Lacunas técnicas que afetam a redação jurídica

1. **OAuth sem aceite:** contas Google podem ser criadas sem aceite registrado dos Termos Gerais e da Política de Privacidade.
2. **Dados de saúde sem aceite específico:** não existe evidência separada e versionada de consentimento do paciente para dados clínicos.
3. **Política de Privacidade resumida:** não descreve de forma suficiente os dados clínicos efetivamente tratados, provedores, retenção, DPO e todos os direitos.
4. **Sem exclusão/anonimização pelo titular:** `User.isActive` apenas desativa o acesso.
5. **Retenção indefinida:** não há prazos concretos por categoria de dado.
6. **Ausência de aviso emergencial:** não há orientação visível para urgência/emergência.
7. **Menores/incapazes:** não há política ou fluxo específico.
8. **Termos de pagamento versionados separadamente do texto:** a versão `v1.0` é fixa no backend e o conteúdo está embutido no componente, sem uma constante compartilhada.
9. **Modelo possivelmente legado:** `ProfessionalTermsAcceptance` existe no schema, mas o cadastro atual utiliza `TermsAcceptance`.
10. **Rodapé:** não oferece links diretos aos documentos internos e possui contato aparentemente provisório.
11. **Campos livres:** mensagens, notas, motivos e metadados podem receber dados sensíveis, dificultando minimização e eliminação seletiva.
12. **Configuração do Meet:** existe opção técnica para acesso `OPEN`, cuja configuração real de produção precisa ser verificada.

---

## 14. Entregáveis solicitados ao advogado

Solicita-se devolver:

1. Termos Gerais de Uso revisados e completos.
2. Termos Profissionais do MWC Online revisados.
3. Termos Profissionais do Marketplace Tech revisados.
4. Termos de Contratação de Projetos Tech revisados.
5. Política de Privacidade completa e aderente aos tratamentos reais.
6. Termos de Pagamento de Saúde revisados.
7. Texto de autorização para verificação profissional revisado.
8. Texto e base legal aplicável ao tratamento de dados de saúde.
9. Política de cookies ou orientação documentada de quando será necessária.
10. Aviso de urgência/emergência e regras para menores/incapazes.
11. Política de retenção, exclusão e anonimização por categoria de dado.
12. Textos dos checkboxes, resumos pré-contratuais e avisos destacados que devem aparecer em cada fluxo.
13. Orientação sobre quais alterações exigem novo aceite e como versionar os documentos.
14. Orientação sobre manutenção e validade das evidências eletrônicas de aceite.

Para facilitar a implementação, cada documento devolvido deve indicar:

- título oficial;
- versão e data de vigência;
- público aplicável;
- texto integral;
- texto curto do checkbox;
- cláusulas que exigem destaque visual;
- eventos que exigem novo aceite;
- prazo de conservação da evidência do aceite.

---

## 15. Observações finais

Os textos desta cópia foram normalizados com acentuação para leitura jurídica. O código-fonte atual contém vários textos sem acentos, mas o conteúdo substantivo foi preservado.

Antes da publicação das versões aprovadas, será necessário:

1. substituir os textos no código;
2. atualizar as constantes de versão;
3. assegurar que o conteúdo exibido corresponda exatamente à versão gravada;
4. exigir novo aceite nos fluxos indicados pelo advogado;
5. guardar a versão histórica de cada documento;
6. testar cadastro por e-mail, cadastro Google, checkout Tech, checkout Saúde e verificação profissional.
