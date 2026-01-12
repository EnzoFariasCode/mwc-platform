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
