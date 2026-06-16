# Como usar o painel admin MWC

Este guia explica como operar o painel administrativo da plataforma MWC para acompanhar usuários, disputas, pagamentos, saques PIX e problemas reais dos setores Tech e Online/Health.

## Acesso

O painel admin fica dentro do dashboard:

```text
/dashboard/admin
```

As telas principais são:

```text
/dashboard/admin/usuarios
/dashboard/admin/disputas
/dashboard/admin/financeiro
```

Somente contas com `userType = ADMIN` conseguem acessar essas telas. Se uma conta suspensa tentar entrar, ela deve ser bloqueada pelo sistema.

## Menu Admin

### Usuários

Use para visualizar usuários recentes, suspender contas problemáticas e reativar contas quando necessário.

Tela:

```text
/dashboard/admin/usuarios
```

Funções disponíveis:

- Buscar por ID real, nome ou email.
- Filtrar por tipo de usuário: Cliente, Profissional ou Admin.
- Filtrar por setor: Tech ou Saúde.
- Filtrar por status: Ativo ou Suspenso.
- Filtrar por data de criação.
- Suspender usuário.
- Reativar usuário.

Quando usar:

- Usuário com comportamento suspeito.
- Cliente/profissional envolvido em fraude, chargeback, spam ou disputa grave.
- Conta criada por engano que precisa ser bloqueada temporariamente.

Passo a passo para suspender:

1. Acesse `Usuários`.
2. Busque pelo email, nome ou ID real.
3. Confirme se é o usuário correto.
4. Clique em `Suspender`.
5. O usuário não deve mais conseguir entrar nem executar actions protegidas.

Passo a passo para reativar:

1. Acesse `Usuários`.
2. Filtre por `Suspenso`.
3. Encontre a conta.
4. Clique em `Reativar`.

Observação: contas admin não devem ser suspensas pelo botão comum.

## Mediação de Disputas

Use para resolver problemas de projetos Tech e consultas Online/Health.

Tela:

```text
/dashboard/admin/disputas
```

Funções disponíveis:

- Ver disputas abertas.
- Ver histórico de disputas resolvidas.
- Buscar por ID real, email, nome, título, motivo ou status.
- Filtrar por setor: Tech ou Saúde.
- Filtrar por status.
- Filtrar por data.
- Ver detalhes completos da disputa.
- Reembolsar cliente/paciente.
- Liberar pagamento ao profissional.

### Tipos de disputa

#### Tech

Envolve projetos do Marketplace Tech.

Exemplos:

- Cliente diz que a entrega veio errada.
- Profissional diz que entregou e o cliente não aceita.
- Cliente pede revisão e vira conflito.
- Stripe envia contestação/chargeback.

#### Online/Health

Envolve consultas online.

Exemplos:

- Paciente informa que a consulta não aconteceu.
- Profissional informa que paciente não compareceu.
- Paciente abre disputa após o horário.
- Reembolso precisa ser analisado manualmente.

## Como resolver uma disputa

### Antes de decidir

Sempre confira:

1. ID real do projeto ou consulta.
2. Cliente/paciente envolvido.
3. Profissional envolvido.
4. Valor.
5. Motivo informado.
6. Histórico de entregas, propostas, transações e auditoria.
7. Se há chargeback Stripe.

Nunca decida apenas pelo texto curto do card.

### Abrir detalhes

1. Acesse `Mediação`.
2. Encontre a disputa.
3. Clique em `Ver detalhes`.

Rotas de detalhe:

```text
/dashboard/admin/disputas/tech/[id]
/dashboard/admin/disputas/health/[id]
```

Na tela de detalhes você verá:

- ID real.
- Status.
- Valor.
- Participantes.
- Motivo da disputa.
- Transações financeiras.
- Auditoria formal.
- Dados Stripe quando houver.
- Propostas e entregas no caso Tech.
- Dados da consulta no caso Health.

### Decisão: reembolsar

Use quando o cliente/paciente tem razão ou quando a plataforma precisa devolver o valor.

Passo a passo:

1. Acesse `Mediação`.
2. Abra a disputa.
3. Confira os detalhes.
4. Volte ao card ou use a tela de mediação.
5. Clique em `Reembolsar`.
6. Escreva o motivo com clareza.
7. Confirme.

Resultado esperado:

- A disputa é resolvida.
- O status muda conforme o setor.
- A transação é atualizada.
- A decisão entra na auditoria formal.

### Decisão: liberar ao profissional

Use quando o profissional tem razão, entregou corretamente ou cumpriu a consulta.

Passo a passo:

1. Acesse `Mediação`.
2. Abra a disputa.
3. Confira os detalhes.
4. Clique em `Liberar ao profissional`.
5. Escreva o motivo.
6. Confirme.

Resultado esperado:

- O valor é liberado ao profissional.
- A disputa é encerrada.
- A auditoria registra quem decidiu, quando e por quê.

## Chargeback e contestação Stripe

Quando a Stripe envia uma contestação Tech, o webhook tenta localizar o projeto pelo pagamento.

Se encontrar:

- O projeto entra em `DISPUTE`.
- As transações vinculadas ficam em `DISPUTED`.
- A disputa aparece no painel de Mediação.
- A tela de detalhes mostra `Stripe Session`, `PaymentIntent` e resumo da contestação.

Como agir:

1. Acesse `Mediação`.
2. Filtre por Tech ou busque pelo ID/email.
3. Abra `Ver detalhes`.
4. Confira o resumo Stripe.
5. Analise projeto, entrega e transações.
6. Se necessário, também acompanhe o caso diretamente no painel Stripe.

Importante: disputas Stripe podem ter prazos de evidência. Confira o painel Stripe sempre que houver chargeback real.

## Tesouraria PIX

Use para aprovar saques solicitados por profissionais.

Tela:

```text
/dashboard/admin/financeiro
```

Funções disponíveis:

- Ver saques pendentes.
- Ver histórico de saques transferidos.
- Buscar por ID real, email, chave PIX, ID da transação ou auditoria.
- Filtrar por status.
- Filtrar por data.
- Marcar saque como transferido.
- Anexar comprovante PIX.
- Ver comprovante PIX anexado.

### Aprovar saque PIX

Passo a passo:

1. Acesse `Tesouraria`.
2. Confira os saques pendentes.
3. Verifique profissional, email, valor, chave PIX e tipo da chave.
4. Faça a transferência manualmente fora da plataforma.
5. Após transferir, clique em `Marcar como transferido`.

Resultado esperado:

- O pedido de saque vira `COMPLETED`.
- A transação vinculada vira `COMPLETED`.
- Um log formal de auditoria é criado.

### Anexar comprovante

Depois que o saque estiver transferido:

1. Acesse `Tesouraria`.
2. Filtre por `Transferidos`.
3. Encontre o saque.
4. Na coluna de auditoria, selecione o arquivo.
5. Clique em `Anexar comprovante`.

Formatos aceitos:

- PDF
- JPG
- PNG
- WEBP

Limite:

```text
5 MB
```

Depois de anexado, o painel mostra `Ver comprovante`.

## Busca por ID real

Use IDs reais para suporte, auditoria e tratamento de erros.

### Projeto Tech

O ID real do projeto é o UUID salvo no banco.

Use esse ID para:

- localizar disputa Tech;
- localizar transações;
- investigar entrega;
- falar com suporte técnico;
- comparar com logs.

### Consulta Online/Health

Use o ID real da consulta ou o código público quando aparecer.

Use para:

- localizar consulta;
- conferir paciente/profissional;
- verificar pagamento;
- investigar reembolso;
- acompanhar disputa.

## Auditoria formal

A auditoria formal serve para responder:

- Quem decidiu?
- Quando decidiu?
- O que foi decidido?
- Qual foi o motivo?
- Existe comprovante PIX?

Eventos registrados:

- Reembolso Tech aprovado.
- Pagamento Tech liberado.
- Reembolso Health aprovado.
- Pagamento Health liberado.
- Saque PIX marcado como transferido.

Onde aparece:

- Detalhe da disputa.
- Painel de Tesouraria.

## Fluxo recomendado para problemas reais

### Problema em projeto Tech

1. Peça o ID real do projeto.
2. Acesse `Mediação`.
3. Busque pelo ID, email ou nome.
4. Abra `Ver detalhes`.
5. Confira proposta, entrega, transações e motivo.
6. Decida entre `Reembolsar` ou `Liberar ao profissional`.
7. Registre motivo claro.
8. Se houver chargeback Stripe, confira também a Stripe.

### Problema em consulta Online/Health

1. Peça o ID real da consulta ou email do paciente.
2. Acesse `Mediação`.
3. Filtre por Saúde.
4. Abra detalhes.
5. Confira data, horário, paciente, profissional, pagamento e motivo.
6. Decida entre `Reembolsar` ou `Liberar ao profissional`.
7. Registre motivo claro.

### Problema com saque PIX

1. Acesse `Tesouraria`.
2. Busque por email, chave PIX ou ID.
3. Confira valor e chave.
4. Faça a transferência manual.
5. Marque como transferido.
6. Anexe comprovante.

### Usuário problemático

1. Acesse `Usuários`.
2. Busque por email ou ID.
3. Confira se é a conta correta.
4. Suspenda a conta se houver risco.
5. Reative apenas quando o problema estiver resolvido.

## Boas práticas

- Nunca decida disputa sem abrir os detalhes.
- Nunca faça saque sem conferir chave PIX e valor.
- Sempre anexe comprovante de transferência.
- Sempre escreva um motivo claro nas decisões.
- Use ID real em conversas de suporte.
- Confira a Stripe em casos de chargeback real.
- Suspenda usuários apenas quando houver risco, fraude, abuso ou necessidade de bloqueio temporário.

## O que este painel cobre hoje

O painel atual permite operar os principais problemas de início de produção:

- Disputas Tech.
- Disputas Health.
- Chargeback Tech via Stripe.
- Reembolso ou liberação manual por mediação.
- Histórico de disputas.
- Auditoria formal.
- Aprovação de saques PIX.
- Comprovante de transferência.
- Suspensão e reativação de usuários.
- Busca por ID real, email, status e data.

## Limites atuais

Para uma operação maior no futuro, ainda vale evoluir:

- Storage externo para comprovantes, como S3, R2 ou Vercel Blob.
- Alertas automáticos de novas disputas.
- Separação de permissões por função: suporte, tesouraria, compliance.
- Painel dedicado somente a chargebacks Stripe.
- Registro de auditoria para mais ações administrativas.

Para a fase atual, com operação pequena e manual, o painel já cobre o essencial para administrar problemas reais com segurança operacional.
