# Arquitetura de Projeto - Plataforma de Organização de Animes

## 📋 Visão Geral do Projeto

**Nome:** AnimeWeek  
**Descrição:** Plataforma para organizar animes que você assiste durante a semana, com sistema de calendários por estação, personalização de temas e compartilhamento com outros usuários.

**Stack:**
- **Frontend:** Vue 3 + Vite + TypeScript + Pinia + Tailwind CSS
- **Backend:** Node.js + NestJS + PostgreSQL + Prisma
- **APIs Externas:** Jikan API (MyAnimeList)
- **Cache:** Redis
- **Real-time:** SSE 
---

## 🎯 Phase 1: MVP - Funcionalidades Essenciais (8-10 semanas)

### Objetivos
- Estabelecer arquitetura base
- Autenticação e gerenciamento de usuários
- Integração com API de animes
- Calendário semanal funcional
- Drag and drop básico

### User Stories

#### US-001: Autenticação e Registro
```markdown
**Como** novo usuário
**Quero** criar uma conta e fazer login
**Para** acessar a plataforma e organizar meus animes

**Critérios de Aceitação:**
- [ ] Formulário de registro com email, senha e username
- [ ] Validação de email único
- [ ] Hash de senha com bcrypt
- [ ] Login com JWT
- [ ] Refresh token automático
- [ ] Logout com invalidação de token
- [ ] Recuperação de senha via email
- [ ] Confirmação de email

**Tarefas Backend:**
- [ ] Criar módulo `auth` em NestJS
- [ ] Implementar JWT strategy
- [ ] Criar endpoints: POST /auth/register, POST /auth/login, POST /auth/refresh
- [ ] Integrar nodemailer para emails
- [ ] Criar tabela `User` no Prisma

**Tarefas Frontend:**
- [ ] Criar páginas de login e registro
- [ ] Formulários com validação
- [ ] Armazenar token no localStorage
- [ ] Interceptor Axios para incluir token
- [ ] Redirecionamento automático para login
```

#### US-002: Perfil do Usuário
```markdown
**Como** usuário autenticado
**Quero** visualizar e editar meu perfil
**Para** gerenciar minhas informações pessoais

**Critérios de Aceitação:**
- [ ] Página de perfil com avatar, username, bio
- [ ] Edição de informações básicas
- [ ] Upload de avatar
- [ ] Visualização de estatísticas básicas (total de animes)
- [ ] Opção de deletar conta

**Tarefas Backend:**
- [ ] Endpoints: GET /users/me, PATCH /users/me, DELETE /users/me
- [ ] Integração com Cloudinary para upload
- [ ] Validação de dados

**Tarefas Frontend:**
- [ ] Página de perfil
- [ ] Formulário de edição
- [ ] Preview de avatar
- [ ] Modal de confirmação para deletar conta
```

#### US-003: Integração com Jikan API
```markdown
**Como** usuário
**Quero** buscar animes pela API do MyAnimeList
**Para** adicionar animes corretos ao meu calendário

**Critérios de Aceitação:**
- [ ] Busca de animes por nome
- [ ] Exibição de informações: título, imagem, episódios, sinopse
- [ ] Cache de resultados em Redis (1 hora)
- [ ] Tratamento de erros da API
- [ ] Limite de requisições

**Tarefas Backend:**
- [ ] Criar serviço `JikanService`
- [ ] Endpoints: GET /animes/search?query=
- [ ] Implementar cache com Redis
- [ ] Rate limiting

**Tarefas Frontend:**
- [ ] Componente de busca com debounce
- [ ] Listagem de resultados
- [ ] Card com informações do anime
```

#### US-004: Criar Calendário Semanal
```markdown
**Como** usuário
**Quero** criar um calendário semanal para organizar meus animes
**Para** planejar o que vou assistir

**Critérios de Aceitação:**
- [ ] Calendário com 7 dias da semana
- [ ] Exibição de data atual
- [ ] Visualização de semana anterior/próxima
- [ ] Armazenamento no banco de dados
- [ ] Associação com usuário logado

**Tarefas Backend:**
- [ ] Criar módulo `calendars`
- [ ] Endpoints: POST /calendars, GET /calendars, GET /calendars/:id
- [ ] Criar tabelas: Calendar, Week, AnimeInWeek
- [ ] Lógica de geração automática de semanas

**Tarefas Frontend:**
- [ ] Layout de calendário semanal
- [ ] Navegação entre semanas
- [ ] Exibição de datas
- [ ] Integração com Pinia para estado
```

#### US-005: Adicionar Animes ao Calendário
```markdown
**Como** usuário
**Quero** adicionar animes ao meu calendário semanal
**Para** organizar o que vou assistir durante a semana

**Critérios de Aceitação:**
- [ ] Buscar e selecionar anime
- [ ] Adicionar a um dia específico
- [ ] Exibição do anime no calendário
- [ ] Remoção de anime
- [ ] Persistência no banco de dados

**Tarefas Backend:**
- [ ] Endpoints: POST /weeks/:weekId/animes, DELETE /animes/:id
- [ ] Validação de duplicatas
- [ ] Armazenamento de posição para drag-drop

**Tarefas Frontend:**
- [ ] Modal de busca e seleção de anime
- [ ] Adição ao calendário
- [ ] Exibição de anime no dia correto
```

#### US-006: Drag and Drop de Animes
```markdown
**Como** usuário
**Quero** reorganizar animes no calendário arrastando-os
**Para** ajustar minha programação de forma intuitiva

**Critérios de Aceitação:**
- [ ] Arrastar anime entre dias
- [ ] Arrastar dentro do mesmo dia
- [ ] Atualização visual imediata
- [ ] Persistência no banco de dados
- [ ] Feedback visual durante drag

**Tarefas Backend:**
- [ ] Endpoint: PATCH /animes/:id/reorder
- [ ] Atualizar campo `position`

**Tarefas Frontend:**
- [ ] Implementar @dnd-kit/core
- [ ] Componentes draggable e droppable
- [ ] Animações suaves
- [ ] Sincronização com backend
```

#### US-007: Progresso de Episódios
```markdown
**Como** usuário
**Quero** registrar quantos episódios assisti de cada anime
**Para** acompanhar meu progresso

**Critérios de Aceitação:**
- [ ] Input para episódio atual
- [ ] Validação (não pode exceder total)
- [ ] Exibição visual do progresso (ex: 5/12)
- [ ] Atualização em tempo real
- [ ] Persistência no banco

**Tarefas Backend:**
- [ ] Endpoint: PATCH /animes/:id/episode
- [ ] Validação de episódios

**Tarefas Frontend:**
- [ ] Componente de progresso
- [ ] Input numérico com validação
- [ ] Barra de progresso visual
```

### 📦 Entregáveis Phase 1

**Backend:**
- [ ] Projeto NestJS configurado com TypeScript
- [ ] Autenticação JWT implementada
- [ ] Módulos: auth, users, calendars, animes, jikan-integration
- [ ] Banco de dados PostgreSQL com Prisma
- [ ] Redis para cache
- [ ] Testes unitários (cobertura 70%)
- [ ] Documentação API (Swagger)

**Frontend:**
- [ ] Projeto Vue 3 + Vite configurado
- [ ] Páginas: Login, Registro, Perfil, Calendário
- [ ] Componentes: SearchBar, AnimeCard, Calendar, DragDropZone
- [ ] State management com Pinia
- [ ] Interceptor Axios para autenticação
- [ ] Testes unitários (cobertura 60%)

**DevOps:**
- [ ] Docker setup para backend
- [ ] GitHub Actions para CI/CD básico
- [ ] Variáveis de ambiente configuradas

**Documentação:**
- [ ] README com instruções de setup
- [ ] Diagrama de arquitetura
- [ ] Guia de contribuição

---

## 🎨 Phase 2: Personalização e Estações (8-10 semanas)

### Objetivos
- Sistema de estações/branches de calendário
- Temas personalizáveis
- Métricas e estatísticas
- Museu de animes assistidos

### User Stories

#### US-008: Sistema de Estações
```markdown
**Como** usuário
**Quero** criar calendários separados para cada estação do ano
**Para** organizar meus animes por temporada

**Critérios de Aceitação:**
- [ ] Seleção de estação (Spring, Summer, Fall, Winter)
- [ ] Criação automática de novo calendário
- [ ] Visualização de estação atual
- [ ] Navegação entre estações
- [ ] Indicador visual da estação ativa

**Tarefas Backend:**
- [ ] Adicionar campo `season` e `year` em Calendar
- [ ] Endpoints: GET /calendars/season/:season/:year
- [ ] Lógica de detecção automática de estação

**Tarefas Frontend:**
- [ ] Seletor de estação
- [ ] Navegação entre estações
- [ ] Indicador visual
```

#### US-009: Trazer Animes de Estação Anterior
```markdown
**Como** usuário
**Quero** copiar animes de estações anteriores
**Para** continuar assistindo animes que ainda não terminaram

**Critérios de Aceitação:**
- [ ] Listar animes da estação anterior
- [ ] Selecionar quais copiar
- [ ] Copiar com progresso mantido
- [ ] Opção de resetar progresso
- [ ] Confirmação antes de copiar

**Tarefas Backend:**
- [ ] Endpoint: POST /calendars/:id/copy-from-previous
- [ ] Lógica de cópia de animes
- [ ] Validação de duplicatas

**Tarefas Frontend:**
- [ ] Modal com animes da estação anterior
- [ ] Checkboxes para seleção
- [ ] Confirmação de ação
```

#### US-010: Temas Personalizáveis
```markdown
**Como** usuário
**Quero** personalizar a aparência da plataforma com temas
**Para** adaptar o app ao meu gosto

**Critérios de Aceitação:**
- [ ] Criar tema customizado
- [ ] Editar cores (primária, secundária, fundo)
- [ ] Upload de imagem de fundo
- [ ] Aplicar tema ao calendário
- [ ] Salvar múltiplos temas
- [ ] Tema por estação

**Tarefas Backend:**
- [ ] Criar modelo Theme
- [ ] Endpoints: POST /themes, PATCH /themes/:id, DELETE /themes/:id
- [ ] Integração com Cloudinary

**Tarefas Frontend:**
- [ ] Página de temas
- [ ] Color picker
- [ ] Preview de tema
- [ ] Gerenciador de temas
- [ ] Aplicação dinâmica de CSS
```

#### US-011: Métricas e Estatísticas
```markdown
**Como** usuário
**Quero** visualizar estatísticas sobre meus animes
**Para** acompanhar meu consumo

**Critérios de Aceitação:**
- [ ] Total de animes assistidos
- [ ] Total de episódios assistidos
- [ ] Média de episódios por semana
- [ ] Gêneros mais assistidos
- [ ] Gráficos visuais
- [ ] Filtro por período

**Tarefas Backend:**
- [ ] Endpoints: GET /users/me/stats
- [ ] Cálculos de métricas
- [ ] Agregação de dados

**Tarefas Frontend:**
- [ ] Página de estatísticas
- [ ] Gráficos com Chart.js/Recharts
- [ ] Cards com métricas principais
```

#### US-012: Museu de Animes Assistidos
```markdown
**Como** usuário
**Quero** visualizar um museu com todos os animes que assisti
**Para** ter um registro visual da minha jornada

**Critérios de Aceitação:**
- [ ] Galeria de animes assistidos
- [ ] Ordenação por data, rating, gênero
- [ ] Filtros por período
- [ ] Exibição de rating pessoal
- [ ] Timeline visual
- [ ] Compartilhamento de pack

**Tarefas Backend:**
- [ ] Modelo WatchedAnime
- [ ] Endpoints: GET /users/me/watched-animes, POST /watched-animes
- [ ] Lógica de rating

**Tarefas Frontend:**
- [ ] Página de museu
- [ ] Grid/galeria responsiva
- [ ] Filtros e ordenação
- [ ] Modal com detalhes do anime
```

#### US-013: Marcar Anime como Assistido
```markdown
**Como** usuário
**Quero** marcar um anime como completamente assistido
**Para** adicionar ao meu museu de animes

**Critérios de Aceitação:**
- [ ] Botão para marcar como assistido
- [ ] Adicionar rating (1-10)
- [ ] Adicionar comentário (opcional)
- [ ] Mover para museu
- [ ] Remover do calendário (opcional)

**Tarefas Backend:**
- [ ] Endpoint: POST /animes/:id/mark-watched
- [ ] Criar registro em WatchedAnime

**Tarefas Frontend:**
- [ ] Botão de ação
- [ ] Modal com rating e comentário
- [ ] Confirmação visual
```

### 📦 Entregáveis Phase 2

**Backend:**
- [ ] Modelo Theme com CRUD completo
- [ ] Modelo WatchedAnime
- [ ] Endpoints de estações
- [ ] Endpoints de cópia de animes
- [ ] Serviço de estatísticas
- [ ] Testes de novos módulos

**Frontend:**
- [ ] Página de temas
- [ ] Página de estatísticas
- [ ] Página de museu
- [ ] Seletor de estação
- [ ] Modal de cópia de animes
- [ ] Componentes de tema dinâmico

**Design:**
- [ ] Sistema de design com Tailwind
- [ ] Componentes reutilizáveis
- [ ] Temas pré-definidos

---

## 🔗 Phase 3: Compartilhamento e Social (8-10 semanas)

### Objetivos
- Compartilhamento de calendários
- Sistema de seguidores
- Notificações em tempo real
- Interações sociais

### User Stories

#### US-014: Compartilhar Calendário
```markdown
**Como** usuário
**Quero** compartilhar meu calendário com outros usuários
**Para** que eles vejam o que estou assistindo

**Critérios de Aceitação:**
- [ ] Gerar link compartilhável
- [ ] Controle de permissões (view-only)
- [ ] Listar usuários que compartilham comigo
- [ ] Revogar acesso
- [ ] Notificação ao compartilhar

**Tarefas Backend:**
- [ ] Modelo de compartilhamento
- [ ] Endpoints: POST /calendars/:id/share, DELETE /calendars/:id/share/:userId
- [ ] Geração de tokens de compartilhamento
- [ ] Validação de permissões

**Tarefas Frontend:**
- [ ] Modal de compartilhamento
- [ ] Gerador de link
- [ ] Lista de usuários com acesso
- [ ] Botão de revogar
```

#### US-015: Sistema de Seguidores
```markdown
**Como** usuário
**Quero** seguir outros usuários
**Para** acompanhar seus calendários e animes

**Critérios de Aceitação:**
- [ ] Buscar usuários
- [ ] Seguir/deixar de seguir
- [ ] Visualizar perfil de outros usuários
- [ ] Ver calendário de usuários que sigo
- [ ] Notificação de novo seguidor

**Tarefas Backend:**
- [ ] Modelo de relacionamento Follow
- [ ] Endpoints: POST /users/:id/follow, DELETE /users/:id/follow
- [ ] Endpoints de busca de usuários
- [ ] Endpoints de perfil público

**Tarefas Frontend:**
- [ ] Página de busca de usuários
- [ ] Perfil público
- [ ] Botão follow/unfollow
- [ ] Lista de seguidores/seguindo
```

#### US-016: Notificações em Tempo Real
```markdown
**Como** usuário
**Quero** receber notificações em tempo real
**Para** saber quando alguém interage comigo

**Critérios de Aceitação:**
- [ ] Notificação ao ser seguido
- [ ] Notificação ao compartilhar calendário
- [ ] Centro de notificações
- [ ] Marcar como lida
- [ ] Preferências de notificação

**Tarefas Backend:**
- [ ] Implementar SSE
- [ ] Modelo Notification
- [ ] Eventos: follow, share, comment
- [ ] Endpoints: GET /notifications, PATCH /notifications/:id/read

**Tarefas Frontend:**
- [ ] Componente de sino de notificações
- [ ] Centro de notificações
- [ ] Indicador de não lidas
- [ ] Conexão SSE Backend
```

#### US-017: Comentários e Reações
```markdown
**Como** usuário
**Quero** comentar e reagir aos animes de outros usuários
**Para** interagir com a comunidade

**Critérios de Aceitação:**
- [ ] Adicionar comentário em anime
- [ ] Reações (like, love, etc)
- [ ] Visualizar comentários
- [ ] Deletar próprio comentário
- [ ] Notificação de resposta

**Tarefas Backend:**
- [ ] Modelos: Comment, Reaction
- [ ] Endpoints: POST /animes/:id/comments, POST /comments/:id/reactions
- [ ] Eventos SSE para comentários

**Tarefas Frontend:**
- [ ] Seção de comentários
- [ ] Input de comentário
- [ ] Botões de reação
- [ ] Lista de comentários com avatares
```

#### US-018: Descoberta de Animes
```markdown
**Como** usuário
**Quero** descobrir novos animes baseado no que outros assistem
**Para** encontrar recomendações

**Critérios de Aceitação:**
- [ ] Página de descoberta
- [ ] Animes populares na comunidade
- [ ] Recomendações personalizadas
- [ ] Filtro por gênero
- [ ] Trending animes

**Tarefas Backend:**
- [ ] Endpoints: GET /animes/trending, GET /animes/recommendations
- [ ] Algoritmo de recomendação simples
- [ ] Agregação de dados

**Tarefas Frontend:**
- [ ] Página de descoberta
- [ ] Cards de anime com estatísticas
- [ ] Filtros
```

### 📦 Entregáveis Phase 3

**Backend:**
- [ ] SSE integrado
- [ ] Modelos: Follow, Notification, Comment, Reaction
- [ ] Endpoints de compartilhamento
- [ ] Endpoints sociais
- [ ] Serviço de recomendações
- [ ] Testes de integração

**Frontend:**
- [ ] Página de descoberta
- [ ] Centro de notificações
- [ ] Perfil público
- [ ] Seção de comentários
- [ ] Sistema de reações
- [ ] Conexão SSE

**DevOps:**
- [ ] Deploy em produção
- [ ] Monitoramento com Sentry
- [ ] Analytics com LogRocket

---

## 🗓️ Timeline Estimada

| Phase | Duração | Início | Fim |
|-------|---------|--------|-----|
| Phase 1 (MVP) | 8-10 semanas | Semana 1 | Semana 10 |
| Phase 2 (Personalização) | 8-10 semanas | Semana 11 | Semana 20 |
| Phase 3 (Social) | 8-10 semanas | Semana 21 | Semana 30 |
| **Total** | **~30 semanas** | - | - |

---

## 👥 Estrutura de Equipe Recomendada

- **1 Backend Developer** (NestJS + PostgreSQL)
- **1 Frontend Developer** (Vue 3)
- **1 Full-Stack Developer** (suporte e DevOps)
- **1 QA/Tester** (a partir da Phase 2)
- **1 Product Manager** (coordenação)

---

## 📊 Métricas de Sucesso

### Phase 1
- ✅ 100% dos endpoints testados
- ✅ Cobertura de testes > 70%
- ✅ Performance < 200ms em requisições
- ✅ Uptime > 99%

### Phase 2
- ✅ Usuários ativos crescendo 20% ao mês
- ✅ Retenção > 60%
- ✅ Satisfação do usuário > 4/5

### Phase 3
- ✅ Engajamento social > 40%
- ✅ Compartilhamentos > 30% de usuários
- ✅ Comunidade ativa

---

## 🔐 Considerações de Segurança

- [ ] HTTPS obrigatório
- [ ] Rate limiting em todas as APIs
- [ ] Validação de entrada em frontend e backend
- [ ] CORS configurado corretamente
- [ ] Senha com hash bcrypt (salt rounds: 10)
- [ ] JWT com expiração (15min access, 7d refresh)
- [ ] Proteção contra CSRF
- [ ] SQL Injection prevention (Prisma)
- [ ] XSS prevention (Vue sanitização)
- [ ] Audit logs de ações importantes

---

## 📚 Tecnologias Detalhadas

### Backend Stack
```
NestJS 10+
├── TypeScript 5+
├── PostgreSQL 15+
├── Prisma ORM 5+
├── JWT (jsonwebtoken)
├── Bcrypt
├── Redis
├── SSE
├── Axios (para Jikan API)
├── Nodemailer
├── Multer
├── Class-validator
└── Swagger/OpenAPI
```

### Frontend Stack
```
Vue 3 + Composition API
├── Vite 5+
├── TypeScript 5+
├── Pinia (State Management)
├── Vue Router 4+
├── Axios
├── Tailwind CSS 3+
├── @dnd-kit/core (Drag & Drop)
├── Chart.js / Recharts
├── date-fns
├── Vitest
└── Vue Test Utils
```

---

## 🚀 Próximos Passos

1. **Semana 1:** Setup de repositórios e ambiente
2. **Semana 2:** Implementar autenticação (US-001)
3. **Semana 3:** Perfil e integração Jikan (US-002, US-003)
4. **Semana 4:** Calendário e CRUD de animes (US-004, US-005)
5. **Semana 5-6:** Drag and drop e progresso (US-006, US-007)
6. **Semana 7-8:** Testes e refinamento
7. **Semana 9-10:** Deploy e documentação

---

**Documento criado em:** Julho 2026  
**Versão:** 1.0  
**Status:** Proposta Inicial