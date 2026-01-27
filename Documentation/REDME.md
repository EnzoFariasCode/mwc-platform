## MWC Jobs - Plataforma de Freelancers

Plataforma de marketplace de serviços (estilo Workana/Upwork) desenvolvida com foco em segurança, integridade de contrato e experiência de usuário premium.

🛠 Tech Stack
Framework: Next.js 14+ (App Router)

Estilização: Tailwind CSS

Animações: GSAP (ScrollTrigger)

Ícones: Lucide React

Estado Global: React Context API (DashboardContext)

Design System: Dark/Neon Theme (Futura Font + Slate Palette + Neon Purple)

🧠 Regras de Negócio & Lógica do Sistema

1. Ciclo de Vida do Projeto

Para manter a organização mental dos usuários, separamos "Oportunidades" de "Contratos":

Meus Anúncios (Client Side): São vagas abertas. O cliente postou, mas ainda não contratou ninguém.

Permissões: O cliente pode editar apenas o Orçamento para atrair mais propostas. Título e Descrição são bloqueados para garantir que o escopo não mude após os profissionais enviarem propostas.

Meus Projetos (Client Side): São contratos ativos. O cliente aceitou uma proposta.

Permissões: Imutável. Nada pode ser alterado. Alterações de escopo devem ser tratadas via Chat ou Adicionais Financeiros.

Encontrar Projetos (Pro Side): Lista pública de anúncios disponíveis para aplicação.

2. Segurança Financeira (Escrow)
   Pagamento Retido: O valor do projeto não vai direto para o profissional. Ele fica retido na conta da plataforma (Escrow) assim que o contrato é iniciado.

Liberação: O valor só é liberado para a carteira do profissional quando o cliente marcar o projeto como "Concluído/Entregue".

3. Modelo de Monetização & Connects
   Connects (Moedas): Profissionais gastam "Connects" para enviar propostas (evita spam).

Planos:

Iniciante: Grátis, taxa maior, menos connects.

Starter/Pro: Mensalidade, taxa menor, destaque, mais connects.

📂 Estrutura de Pastas (App Router)
A arquitetura segue o modelo de funcionalidades dentro de /dashboard:

Bash

src/app/dashboard/
├── layout.tsx # Sidebar + Header + Lógica de Auth/Context
├── page.tsx # Visão Geral (Dashboards de Métricas)
│
├── anuncios/ # (CLIENTE) Lista de vagas abertas
│ └── page.tsx # Lista + Modais de Criação/Edição
│
├── meus-projetos/ # (CLIENTE) Lista de contratos ativos
│ └── page.tsx # Lista focada em status/prazo (Sem barra de progresso fake)
│
├── encontrar-projetos/ # (PROFISSIONAL) Feed de busca
│ ├── page.tsx # Filtros (Tags, Preço, Categoria) + Lista
│ └── [id]/ # Landing Page do Projeto (Detalhes Vendedores)
│
└── chat/ # (GLOBAL) Sistema de Mensagens
✅ Funcionalidades Implementadas
Core / UI
[x] Landing Page com animações GSAP (ScrollTrigger).

[x] Autenticação Visual (Login/Cadastro).

[x] Dashboard Layout Responsivo (Sidebar Mobile/Desktop Flex).

[x] Contexto de Usuário (Switch Cliente/Profissional).

Módulo Cliente
[x] Visão Geral: Cards de estatísticas e atalhos.

[x] Publicar Projeto (Modal):

Input de Tags inteligente.

Upload de anexos (visual).

Definição de Prazo e Orçamento (Fixo/Hora).

[x] Meus Anúncios:

Listagem de vagas abertas.

Edição restrita (Bloqueio de escopo / Edição de preço).

[x] Meus Projetos:

Listagem de contratos em andamento.

Visualização de Prazos e Valores reais.

Módulo Profissional
[x] Encontrar Projetos:

Filtros laterais (Categoria, Orçamento).

Cards com badges de urgência e skills.

[x] Detalhes do Projeto:

Página de vendas do projeto (descrição, anexos, sobre o cliente).

Linkagem correta via ID (Mock dinâmico).

🚀 Roadmap (Próximos Passos)
Fluxo de Propostas:

[ ] Modal para o Profissional enviar proposta (Valor + Carta).

[ ] Tela para o Cliente ver lista de candidatos de um anúncio.

[ ] Ação de "Aceitar Proposta" (Transforma Anúncio em Projeto).

Chat em Tempo Real:

[ ] Tela de chat estilo WhatsApp/OLX.

[ ] Bloqueio de dados de contato sensíveis (Email/Telefone) antes do contrato.

Módulo Financeiro:

[ ] Tela de Extrato/Carteira.

[ ] Solicitação de Saque.

Observações Importantes para o Desenvolvedor
Responsividade: O layout usa h-[100dvh] e flex para evitar problemas de scroll no mobile.

Dados: Atualmente usamos Arrays Mockados (ACTIVE_PROJECTS, OPEN_ADS, ALL_PROJECTS_MOCK). Ao integrar com Backend, manter a tipagem forte das Interfaces.

Tags: O input de tags no modal é crucial para o sistema de recomendação futuro.

### BACKEND

# Actions

get-user-profile.ts = buscar os dados do usuário (Nome, Nome de Exibição e Tipo) baseado no cookie.
login-user.ts = Buscar dados de login e senha.
register-users.ts = Registrar dados dos imputs no banco de dados.

src/services/ (Onde fica a regra de banco de dados/Prisma).
src/types/ (Onde ficam as definições de dados para compartilhar entre front e back).

criar campio de Finalizar Serviço

src/
├── actions/ # 🧠 O "Coração" do Backend (Server Actions)
│ ├── account/ # Ações relacionadas à conta do usuário
│ │ ├── get-user-profile.ts # Busca dados (com tratamento de null/undefined)
│ │ ├── update-profile.ts # Atualiza dados (inclui validação de senha)
│ │ └── become-professional.ts # Lógica de upgrade de conta
│ └── auth/ # Ações de autenticação
│ ├── login.ts
│ ├── register.ts
│ └── logout-user.ts
│
├── lib/ # ⚙️ Configurações Globais
│ └── prisma.ts # Instância única do Prisma Client (Singleton)
│
├── types/ # 📝 Tipagem TypeScript
│ └── user-types.ts # Interfaces globais (UserData, ActionResponse)
│
└── app/ # 🌐 Rotas e Páginas (Server Components)
└── dashboard/ # Área logada
├── layout.tsx # Sidebar e Contexto global
├── page.tsx # Roteador (Redireciona Cliente ou Pro)
├── cliente/ # Dashboard exclusiva do Cliente
│ └── page.tsx # Busca dados do DB e renderiza a View
└── profissional/ # Dashboard exclusiva do Profissional

##################################################################################################################
🚀 MWC — Documentação Técnica

Versão: Checkpoint
Stack: Next.js • TypeScript • Tailwind • Prisma

📌 Visão Geral

O MWC é uma aplicação moderna construída com foco em performance, segurança, escalabilidade e clean architecture, utilizando o que há de mais atual no ecossistema Next.js (App Router).

Este documento descreve a stack tecnológica, a arquitetura do projeto, a estrutura de diretórios e as principais regras de negócio já implementadas.

## 🧰 Stack Tecnológica & Bibliotecas

| Biblioteca / Ferramenta        | Tipo           | Função no Projeto                                                           |
| ------------------------------ | -------------- | --------------------------------------------------------------------------- |
| **Next.js 14/15 (App Router)** | Framework      | Estrutura principal, roteamento e renderização (SSR, CSR e Server Actions). |
| **React**                      | Biblioteca     | Construção de interfaces e gerenciamento de estado via Hooks.               |
| **TypeScript**                 | Linguagem      | Tipagem estática para maior segurança, escalabilidade e DX avançada.        |
| **Tailwind CSS**               | Estilização    | Design system, responsividade, dark mode e UI moderna.                      |
| **Prisma ORM**                 | Banco de Dados | Comunicação com o banco, definição de schemas e migrations.                 |
| **Lucide React**               | UI / Ícones    | Biblioteca de ícones leve, consistente e moderna.                           |
| **Jose**                       | Segurança      | Geração e validação de JWT para autenticação stateless.                     |
| **Bcryptjs**                   | Segurança      | Criptografia (hash) de senhas antes do armazenamento.                       |
| **Sonner**                     | UI / Feedback  | Notificações toast (sucesso, erro e warning).                               |

## 🗂️ Estrutura de Diretórios

Estrutura baseada em separação de responsabilidades, clean architecture e boas práticas modernas de frontend/backend no Next.js.

src/
├─ app/
├─ actions/
├─ components/
├─ lib/
└─ prisma/

## ⚙️ src/lib/ — Utilitários & Configurações Globais

Contém arquivos responsáveis por configuração centralizada de serviços.

prisma.ts

Instância global do Prisma Client.

Evita múltiplas conexões em ambiente de hot-reload.

auth.ts

Núcleo da autenticação.

Funções:

encrypt() → Criação do token JWT

decrypt() → Leitura segura do token

verifySession() → Validação da sessão

🔌 src/actions/ — Server Actions

Camada que faz a ponte entre a UI e o banco de dados.
Todas as funções aqui executam no servidor.

## 📁 account/

get-user-profile.ts

Busca dados do usuário autenticado via token.

update-profile.ts

Valida senha com bcrypt.

Atualiza dados do usuário no Prisma.

become-professional.ts

Altera o userType para PROFESSIONAL.

## 📁 auth/

logout-user.ts

Remove/destrói o cookie de sessão (JWT).

🎨 src/components/dashboard/ — Componentes de UI

Componentes reutilizáveis e específicos do Dashboard.

DashboardHeader.tsx

Header fixo.

Switch Cliente ↔ Profissional.

Verificação de rota para exibição correta do menu.

DashboardSidebar.tsx

Sidebar responsiva.

Menus diferentes conforme o contexto do usuário.

Gerenciamento do menu mobile.

EditProfileModal.tsx

Formulário complexo de edição de perfil.

Integração com a API do IBGE (frontend-only) para cidades.

BecomeProfessionalModal.tsx

Modal de confirmação para upgrade de conta.

🧭 src/app/dashboard/ — Rotas & Páginas

Estrutura de páginas usando App Router.

### perfil/

Visualização do perfil do usuário.

Cards de habilidades e portfólio.

Conteúdo bloqueado para usuários não-PRO.

cliente/

Dashboard do cliente.

Estatísticas e atalhos rápidos.

profissional/

Dashboard do profissional (prestador de serviços).

chat/

Interface visual (mockup).

Estado local para mensagens.

Botão de favoritar integrado ao header.

favoritos/

Listagem de profissionais favoritados.

🧠 Lógica de Negócio Implementada
🔐 Autenticação & Segurança (JWT)

Evolução da arquitetura:

❌ Cookies simples (userId)

✅ Tokens JWT assinados

Fluxo de autenticação:

Usuário realiza login

Servidor gera JWT usando jose

Token é salvo em cookie httpOnly

Cada Server Action valida o token antes de acessar o banco

🔄 Contexto de Navegação (Cliente vs Profissional)

Sistema criado para evitar inconsistência de UI e menus incorretos.

Regra:

Rotas exclusivas de profissional:

/financeiro

/propostas

Comportamento:

Se o usuário:

estiver fora dessas rotas OU

tiver userType === CLIENT

➡️ O sistema força a exibição do Menu de Cliente, evitando bugs de navegação.

🌍 Integração com API do IBGE (Frontend Only)

Não armazena cidades no banco (evita +5.000 registros).

Sempre que o campo UF é alterado:

Um fetch é feito diretamente para a API pública do IBGE.

As cidades são carregadas dinamicamente no datalist.

✔ Mais leve
✔ Mais atual
✔ Zero poluição no banco

⭐ Favoritos & Chat (Estado Local)

Chat

Lógica visual implementada.

Estado local com useState.

Envio de mensagens e toggle de favorito.

Favoritos

Página dedicada para exibir profissionais favoritados.

Base pronta para futura persistência no backend.

🏁 Status do Projeto

🚧 Checkpoint atual

Arquitetura consolidada

Autenticação segura

UI base funcional

Pronto para evolução (pagamentos, tempo real, notificações)

📂 src/actions/favorites/ (Domínio: Favoritos)
Responsável pelo gerenciamento da lista de profissionais preferidos do cliente.

toggle-favorite.ts
Função: Adiciona ou remove um profissional da lista de favoritos (lógica de toggle).

Detalhes Técnicos:

Verifica primeiro se o registro já existe na tabela Favorite.

Se existir, executa delete; se não, executa create.

Utiliza revalidatePath para atualizar a UI do Chat e da Lista de Favoritos instantaneamente sem recarregar a página.

get-my-favorites.ts
Função: Busca todos os favoritos do usuário logado para renderizar a página /dashboard/favoritos.

Detalhes Técnicos:

Faz uma query no banco filtrando pelo clientId.

Retorna dados formatados do profissional (Nome, Foto, Nota, Preço, JobTitle) prontos para os cards do frontend.

📂 src/actions/chat/ (Domínio: Chat)
Lógica central de mensageria e gerenciamento de conversas em tempo real (via Server Actions).

send-message.ts
Função: Envia uma nova mensagem para outro usuário.

Lógica Inteligente:

Antes de enviar, verifica se já existe uma Conversation entre os dois IDs (Remetente e Destinatário).

Se não existir, cria a conversa automaticamente e vincula os dois participantes.

Salva a mensagem na tabela Message.

Atualiza o campo lastMessageAt da conversa para que ela suba para o topo da lista recente.

get-my-conversations.ts
Função: Alimenta a barra lateral (Sidebar) do chat.

Detalhes Técnicos:

Lista todas as conversas onde o usuário logado é um dos participants.

Traz o nome e dados do outro participante (identifica quem é o "outro" lado da conversa).

Busca apenas a última mensagem (take: 1) para exibir o preview ("Olá, tudo bem?...") na lista lateral.

get-conversation-messages.ts
Função: Carrega o histórico completo de mensagens de um chat ativo.

Detalhes Técnicos:

Busca mensagens ordenadas cronologicamente (asc) para renderizar o chat.

Realiza uma verificação cruzada na tabela Favorite para saber se o usuário com quem você está falando é um favorito, permitindo exibir o estado correto do botão de "Coração" no cabeçalho do chat.

📝 Nota de Arquitetura
Diferente da estrutura inicial, estas ações foram refatoradas e separadas em subpastas (/chat, /favorites) seguindo princípios de Clean Architecture e SRP (Single Responsibility Principle). Isso facilita a manutenção, testes e escalabilidade futura do projeto.

1. Banco de Dados (Prisma)
   prisma/schema.prisma

Função: Arquivo principal de definição do banco de dados.

Alterações:

Criação da tabela Proposal (armazena valor, prazo e carta de apresentação).

Criação da tabela Deliverable (para futuras entregas de arquivos).

Atualização do model Project para incluir relações com propostas e o novo Enum ProjectStatus.

Atualização do model User para relacionar com propostas enviadas.

2. Backend (Server Actions)
   src/actions/proposals/create-proposal.ts

Função: Recebe os dados do formulário do profissional, verifica se ele já enviou proposta antes e salva a nova proposta no banco de dados com status PENDING.

src/actions/proposals/get-project-proposals.ts

Função: Busca todas as propostas recebidas de um projeto específico. Inclui validação de segurança para garantir que apenas o dono do projeto possa ver esses dados.

3. Componentes Visuais (Frontend)
   src/components/dashboard/SendProposalModal.tsx

Função: Modal com formulário para o profissional enviar uma oferta.

Lógica: Detecta se o projeto é Preço Fixo ou Por Hora. Se for Fixo, permite "Aceitar Valor do Cliente" ou "Propor Novo Valor".

src/components/dashboard/ProjectDetailsModal.tsx

Função: Modal híbrido.

Para Visitantes: Exibe detalhes do projeto (escopo, orçamento).

Para o Dono (Cliente): Exibe uma lista expansível ("accordion") com as propostas recebidas, fotos dos profissionais e valores.

4. Páginas e Rotas
   src/app/dashboard/encontrar-projetos/[id]/page.tsx (Server Component)

Função: Busca os dados brutos do projeto no banco e verifica o ID do usuário logado para passar para a View.

src/app/dashboard/encontrar-projetos/[id]/ProjectDetailsView.tsx (Client Component)

Função: Tela cheia de detalhes do projeto. Controla a lógica de mostrar o botão "Enviar Proposta" (para profissionais) ou o aviso "Este projeto é seu" (para o dono).

src/app/dashboard/meus-projetos/page.tsx (Server Component)

Função: Busca os projetos criados pelo usuário logado e adiciona uma contagem (\_count) de quantas propostas cada projeto recebeu.

src/app/dashboard/meus-projetos/MyProjectsView.tsx (Client Component)

Função: Renderiza a grid de cards dos projetos do cliente. Exibe o Badge de Notificação (ex: "🔔 3 Propostas") e abre o modal de detalhes no modo "Dono".

5. Navegação e Estrutura
   src/components/dashboard/DashboardHeader.tsx

Função: Cabeçalho superior. Contém a lógica do "Switch" (botão deslizante) entre painel de Cliente e Profissional. Foi ajustado para reconhecer rotas compartilhadas (como Chat e Perfil) corretamente.

src/components/dashboard/DashboardSidebar.tsx

Função: Menu lateral. Lista os links de navegação e altera dinamicamente os itens do menu dependendo se o usuário está no contexto de Cliente ou Profissional.

## Modais

1. Fluxo de Conta e Perfil
   BecomeProfessionalModal.tsx
   Quem usa: Cliente (que ainda não é profissional).

Objetivo: Transformar a conta de apenas "Cliente" para "Híbrida" (Cliente + Profissional).

Onde é chamado: Dashboard do Cliente (ClientDashboardView), botão "Trabalhar como Profissional".

Ação: Atualiza o role no banco e força um reload da página para liberar o switch de perfil no menu lateral.

CompleteProfileModal.tsx
Quem usa: Profissional novo.

Objetivo: Forçar/Lembrar o usuário de preencher bio, skills e foto para ter mais visibilidade.

Onde é chamado: Dashboard do Profissional (ProfessionalDashboardView).

Lógica: Aparece automaticamente se o perfil estiver incompleto (verificação feita no page.tsx).

EditProfileModal.tsx
Quem usa: Ambos.

Objetivo: Editar dados pessoais, foto, bio e skills.

Onde é chamado: Página de Perfil (/dashboard/perfil).

2. Fluxo de Criação e Gestão de Projetos (Cliente)
   NewProjectModal.tsx
   Quem usa: Cliente.

Objetivo: Formulário para criar um novo projeto (Título, Descrição, Categoria, Orçamento).

Onde é chamado: Botão "Novo Pedido" no Header ou no Dashboard do Cliente.

Ação: Cria o projeto com status OPEN no banco.

DelMyProjectsModal.tsx
Quem usa: Cliente.

Objetivo: Confirmar a exclusão de um projeto que ainda não foi iniciado.

Onde é chamado: Lista de "Meus Pedidos" (MyProjectsView), ícone de lixeira.

Segurança: Só permite excluir se o projeto estiver OPEN.

EditProjectModal.tsx
Quem usa: Cliente.

Objetivo: Corrigir informações de um projeto publicado.

Onde é chamado: Lista de "Meus Pedidos" (geralmente via menu de opções no card).

3. Fluxo de Negociação e Contratação
   SendProposalModal.tsx
   Quem usa: Profissional.

Objetivo: Enviar uma proposta financeira e carta de apresentação para um projeto aberto.

Onde é chamado:

Na busca de projetos (FindProjectsView).

Dentro do ProjectDetailsModal (se o projeto estiver aberto).

4. O "Coração" do Sistema (O Modal Mais Importante)
   ProjectDetailsModal.tsx
   Este é o modal "inteligente" que muda de cara dependendo de quem vê e do status do projeto.

Quem usa: Cliente (Dono) e Profissional (Visitante/Contratado).

Objetivo: Centralizar todas as informações e ações do ciclo de vida do projeto.

Comportamentos por Status:

Status OPEN (Em Aberto):

Cliente: Vê lista de propostas recebidas (Card com botão de Aceitar/Checkout).

Profissional: Vê botão "Enviar Proposta".

Status IN_PROGRESS (Em Andamento):

Cliente: Vê card azul "Trabalho em Andamento" e dados do profissional.

Profissional: Vê detalhes do que deve fazer.

Status UNDER_REVIEW (Em Análise):

Cliente: Vê card verde "Projeto Entregue" com link dos arquivos e botões "Aprovar" ou "Revisão".

Status COMPLETED (Concluído):

Ambos: Veem mensagem de sucesso e o link dos arquivos finais fixado para sempre (acesso vitalício).

5. Fluxo de Entrega (Profissional)
   DeliverProjectModal.tsx
   Quem usa: Profissional (apenas o contratado).

Objetivo: Enviar o link final (GitHub/Drive) e a mensagem de conclusão.

Onde é chamado: Aba "Projetos Ativos" (ActiveProjectsView), botão "Entregar Projeto".

Condição: O botão só aparece se o status for IN_PROGRESS.

Componentes de Layout (Não são Modais)
Apenas para referência rápida dos outros arquivos na pasta:

PageContainer.tsx: O "wrapper" que dá o espaçamento padrão e padding em todas as páginas do dashboard.

DashboardHeader.tsx: A barra superior com o Switch (Cliente/Pro), notificações e menu de usuário.

DashboardSidebar.tsx: O menu lateral de navegação.

NotificationDropdown.tsx: O menu que abre ao clicar no sininho.
