# The Blueprint — AnimeWeek

## Metadata

- Projeto:            AnimeWeek (`wallacemt/aniweek`)
- Data:               2026-07-06
- Arquiteto:          Morpheus Agent
- Versão:             v2 (Aprovado)
- Status:             Aprovado — 5 decisões em aberto resolvidas (§17)
- Base:               `docs/proposta.md` (corrigida) + `docs/init.md`

> Este documento **substitui** `proposta.md` como fonte de verdade arquitetural.
> `proposta.md` continua válido como visão de produto (US-001..US-018).
> Snippets de código aqui são **ILUSTRATIVOS** — referência para o Neo Agent, não implementação.

---

## 1. Contexto e Objetivo

Plataforma pessoal onde o usuário organiza os animes que assiste **por dia da semana**,
segmentado **por estação** (temporada anime: winter/spring/summer/fall + ano). A cada nova
estação o usuário gera um novo calendário e pode **trazer adiante** animes ainda em andamento.
Acompanha progresso de episódios, guarda um **museu/vitrine** de animes concluídos, personaliza
temas, e (fases posteriores) compartilha e interage socialmente.

Já existe um protótipo legado (vanilla HTML/CSS/JS) preservado em `old/`. Ele valida o conceito
(menu por dia seg→dom + aba **extra/backlog**, backgrounds por estação) e será **reaproveitado
como fonte de assets e de decisões de UX**, não de código.

**Perfil de execução:** desenvolvedor solo (Wallace). Isso reordena tudo o que `proposta.md`
assumia para uma equipe de 5 — granularidade de tarefas, infra simples, escopo enxuto por fase.

---

## 2. Requisitos

### Funcionais (herdados de proposta.md, agrupados)

- **RF-01** Auth: registro (email/username/senha), login, refresh, logout.
- **RF-02** Perfil: ver/editar, avatar, estatísticas, deletar conta.
- **RF-03** Busca de animes via Jikan (MyAnimeList), com cache.
- **RF-04** Calendário semanal por estação (7 dias + backlog "extra").
- **RF-05** Adicionar/remover anime em um dia; drag-and-drop entre dias e dentro do dia.
- **RF-06** Progresso de episódios por anime (ep atual / total).
- **RF-07** Estações: criar calendário por (estação, ano); importar animes da estação anterior.
- **RF-08** Temas personalizáveis (cores + background), inclusive por estação.
- **RF-09** Museu: marcar anime como assistido (nota 1–10 + comentário), galeria/timeline.
- **RF-10** Métricas: totais, média/semana, gêneros mais assistidos.
- **RF-11** (Fase 3) Compartilhar calendário (view-only), seguir usuários, notificações (SSE), comentários/reações, descoberta.

### Não-funcionais

- **RNF-01 Escala:** app pessoal / comunidade pequena. Alvo realista: dezenas–centenas de usuários. **Não** projetar para milhões (YAGNI). Postgres single-node + Redis atende toda a fase 1–3.
- **RNF-02 Latência:** < 300ms nas rotas próprias (excluindo latência do Jikan, que é mascarada por cache).
- **RNF-03 Jikan rate limit:** respeitar o limite público (~3 req/s, ~60 req/min). O backend é o **único** consumidor do Jikan; o browser nunca chama Jikan direto. Ver ADR-06.
- **RNF-04 Segurança:** refresh token em cookie httpOnly (não localStorage), rate limiting, validação em ambos os lados, hash bcrypt. Ver ADR-04 e §Segurança.
- **RNF-05 Custo:** operar em free tiers (Railway/Neon, Cloudinary/R2, Resend). Armazenamento de imagem abstraído para trocar de provedor sem refatorar (ADR-07).
- **RNF-06 Responsivo:** mobile-first (SPA). PWA é add-on barato para depois. Sem app nativo.
- **RNF-07 Manutenção:** dev solo → estrutura opinativa (Nest), tipos compartilhados, CI mínimo mas presente.

---

## 3. Architecture Decision Records (ADRs)

### ADR-01 — Monorepo com Bun workspaces

- **Contexto:** frontend Vue + backend Nest + tipos compartilhados (DTOs, enums de estação/dia). Dev solo.
- **Opções:** (A) dois repos separados; (B) monorepo Bun/turbo.
- **Decisão:** **Monorepo** `bun workspaces`. `apps/api`, `apps/web`, `packages/shared` (tipos/enums/contratos Zod). Sem Turborepo por ora (YAGNI — dois apps não precisam de cache de build distribuído; adicionar se o build incomodar). Bun escolhido no lugar de pnpm por instalação/execução mais rápidas; validar cedo no M0 pacotes com binário nativo (ex.: preferir `bcryptjs` a `bcrypt` se houver atrito) e o target do Prisma engine.
- **Consequências:** +commits atômicos front+back, +tipos compartilhados sem publicar pacote, +1 CI. Deploy precisa buildar o app certo (resolvido com Dockerfile por app / root de build no provedor).

### ADR-02 — Manter a stack da proposta, com versões corrigidas

- **Contexto:** proposta fixou Vue 3 + Nest + Postgres + Prisma. Usuário já domina backends estruturados (Spring/Django/Nest-like) e Next no front — Vue é escolha deliberada dele.
- **Decisão:** **manter** Vue 3 + NestJS + PostgreSQL + Prisma + Redis, **corrigindo as versões** (proposta estava 1 major atrás em Nest e 2 em Prisma). Ver §4.
- **Consequências:** respeita a intenção do dono; ganha APIs atuais (Prisma 7, Nest 11, Tailwind 4). Custo: Tailwind v4 mudou config para CSS-first — documentado.

### ADR-03 — Modelo de "branch de estação" = Calendar keyed por (season, year) + cópia explícita

- **Contexto:** `init.md`/`proposta.md` falam em "gerar uma nova branch do calendário" mas **nunca definem o modelo relacional**. Este é o núcleo do produto e estava indefinido.
- **Opções:** (A) versionamento tipo git com árvore de commits; (B) um `Calendar` por `(user, season, year)` + operação explícita de importar entradas da estação anterior.
- **Decisão:** **(B).** "Branch" aqui não é versionamento — é **um calendário por temporada**. `Calendar` tem `season` + `year` com `UNIQUE(userId, season, year)`. Trazer animes adiante = endpoint que copia `CalendarEntry` da temporada anterior para a nova (com ou sem progresso). Ver §7.
- **Consequências:** modelo simples e óbvio; sem máquina de estados complexa. A "continuação de anime" é apenas uma cópia de entrada preservando `currentEpisode`. Trade-off: não há histórico de "merge"/diff entre estações — desnecessário para o domínio.

### ADR-04 — Refresh token em cookie httpOnly; access token em memória

- **Contexto:** proposta manda "armazenar token no localStorage" — vetor de XSS clássico (qualquer script rouba o token).
- **Decisão:** **access token JWT curto (15min) em memória (Pinia)**, **refresh token (7d) em cookie `httpOnly` + `Secure` + `SameSite=Strict`**. Rota `POST /auth/refresh` lê o cookie. CSRF mitigado por SameSite + double-submit onde necessário.
- **Consequências:** +segurança real. Custo: precisa CORS com `credentials`, e o front não "vê" o refresh token (correto). Substitui a instrução de localStorage da proposta.

### ADR-05 — Verificação de email é "soft" no MVP

- **Contexto:** confirmação de email por SMTP (nodemailer) adiciona fricção e infra para um MVP solo.
- **Decisão:** registro cria conta **utilizável imediatamente**; envio de email de verificação via **Resend** (free tier, DX melhor que SMTP cru) com flag `emailVerified`. Recursos sensíveis (compartilhar/social, Fase 3) exigem `emailVerified=true`. Reset de senha usa o mesmo canal.
- **Consequências:** MVP não trava em setup de email. Verificação vira gate só onde importa.

### ADR-06 — Camada anticorrupção para o Jikan (cache + rate limiter no backend)

- **Contexto:** Jikan é público, sem key, com rate limit real. Chamar do browser vaza o limite entre usuários e expõe a fragilidade.
- **Decisão:** `JikanModule` no backend é o único consumidor. Fila/limiter (token bucket ~2 req/s de margem) + Redis cache: **busca 1h**, **detalhe de anime 24h** (metadados quase estáticos). 429 → backoff exponencial. Mapear a resposta Jikan para um DTO próprio `AnimeDto` (anticorrupção — não vazar o shape do Jikan para o front nem para o banco).
- **Consequências:** resiliência a instabilidade do Jikan; front sempre fala com a nossa API. Custo: uma camada de mapeamento — justificada.

### ADR-07 — Storage de imagem atrás de uma porta (`StorageService`) → **Supabase Storage**

- **Contexto:** avatares e backgrounds de tema. Decisão do dono: usar **Supabase Storage** (não Cloudinary).
- **Decisão:** interface `StorageService` (`upload`, `delete`, `getPublicUrl`) com impl concreta **Supabase Storage** (`@supabase/supabase-js`, service-role key só no backend). Buckets: `avatars` (público) e `theme-backgrounds` (público). A porta mantém troca futura (R2/Cloudinary) sem tocar em módulos de negócio.
- **Consequências:** +1 dependência (`@supabase/supabase-js`) + 1 interface. Usamos só o Storage do Supabase — Auth/DB do Supabase **não** são usados (auth é própria, DB é Postgres+Prisma). A service-role key nunca vai ao front.

### ADR-08 — Reuso de assets do protótipo legado

- **Contexto:** `old/src/img/backEstacoes/` tem `spring.jpg`, `summer.jpg`, `autumn.jpg`, `winter.png`; o legado tem menu seg→dom + aba **extra** (backlog).
- **Decisão:** **reusar os 4 backgrounds** como temas sazonais default (seed). **Reusar o conceito de "extra/backlog"** como um valor de `weekday` (entrada sem dia fixo). Ícones de dia (`seg.png`..`dom.png`) opcionalmente reaproveitados no seletor de dia.
- **Consequências:** identidade visual de continuidade + menos trabalho de asset. `winter.png` (1.5MB) deve ser otimizado/convertido para webp no seed.

### ADR-09 — Fundamento de tema já no MVP (CSS variables), CRUD de temas na Fase 2

- **Contexto:** personalização é feature de paixão do dono (init.md). Full CRUD é Fase 2, mas o **fundamento** (design tokens via CSS custom properties) é barato e evita retrabalho.
- **Decisão:** MVP já renderiza cores/background por **CSS variables** trocáveis em runtime, com os 4 temas sazonais seed. `Theme` persistido + editor completo entram na Fase 2 sem refatorar o front.
- **Consequências:** front "theme-ready" desde o dia 1; Fase 2 só liga o CRUD à camada que já existe.

### ADR-10 — Deploy: imagens Docker → GHCR → VPS com Portainer (CI/CD)

- **Contexto:** decisão do dono. Sem Railway/Vercel. VPS próprio rodando **Portainer**; deploy por imagem de container.
- **Decisão:**
  - **Dockerfile por app** — `apps/api/Dockerfile` (Nest build multi-stage → runtime Node 22 slim) e `apps/web/Dockerfile` (Vite build → servir estático com nginx). `.dockerignore` por app.
  - **Registry:** **GitHub Container Registry (ghcr.io)** — default razoável (já usam GitHub; auth via `GITHUB_TOKEN`). *Flagged:* trocável por outro registry se o dono preferir; documentado, não bloqueia.
  - **CI/CD (GitHub Actions):** em push na branch de release → `build` das duas imagens → `docker push ghcr.io/wallacemt/aniweek-api` e `.../aniweek-web` (tags `latest` + `sha`) → dispara **redeploy no Portainer**.
  - **Redeploy no Portainer:** via **webhook** do serviço na stack (Actions faz `curl` no webhook após o push). Alternativa documentada: polling de imagem do Portainer. Default: webhook (determinístico, sem espera).
  - **Stack file** `deploy/portainer-stack.yml` (compose v3) declarando `api`, `web`, `postgres`, `redis` + volumes + rede; env via variáveis do Portainer (secrets não versionados).
  - **Dev local** continua `docker-compose.yml` (só `postgres` + `redis`; apps rodam via `bun dev`).
- **Consequências:** pipeline reprodutível e portável (imagens OCI). Custo: manter 2 Dockerfiles + 1 stack file + secrets no Portainer. Migração ghcr→outro registry é troca de string.

### ADR-11 — OAuth (Google + GitHub) já no MVP, além de email/senha

- **Contexto:** decisão do dono — social login desde o M1, não adiado.
- **Decisão:** `AuthModule` suporta 3 caminhos: local (email/senha, ADR-04/05) + **Passport OAuth2**: `passport-google-oauth20` e `passport-github2`. Fluxo: `GET /auth/oauth/:provider` → redirect provider → `GET /auth/oauth/:provider/callback` → upsert `User` por email → emite os mesmos access token (memória) + refresh (cookie httpOnly) do fluxo local.
  - **Vinculação de conta:** email do provider já existente → vincula ao `User` existente (não cria duplicado). `User.passwordHash` vira **opcional** (conta pode ser só-OAuth). Nova tabela `OAuthAccount` (provider, providerAccountId, userId).
  - Contas criadas via OAuth entram com `emailVerified = true` (email já verificado pelo provider).
- **Consequências:** M1 cresce (2 strategies + callbacks + modelo `OAuthAccount` + tela com botões social). `passwordHash` opcional exige guarda no fluxo de reset (conta só-OAuth não tem senha para resetar). Marcar para o **Lawliet** (state/PKCE, open-redirect no callback, account-linking por email).

---

## 4. Stack (versões verificadas via context7 — 2026-07-06)

| Camada                  | Tecnologia                                                              | Versão         | Justificativa                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime                 | Node.js                                                                 | 22 LTS          | LTS atual, suportado por Nest 11.                                                                                                                 |
| Backend                 | NestJS                                                                  | **11.x**  | Proposta dizia 10 (major desatualizado). Estrutura opinativa ajuda dev solo.                                                                      |
| ORM                     | Prisma                                                                  | **7.x**   | Proposta dizia 5 (2 majors atrás).                                                                                                               |
| DB                      | PostgreSQL                                                              | 16+             | Relacional, JSONB p/ campos flexíveis (gêneros).                                                                                                |
| Cache/fila              | Redis                                                                   | 7.x             | Cache Jikan + rate limiting.                                                                                                                      |
| Validação             | Zod                                                                     | 3.x             | Contratos compartilhados em`packages/shared` (front+back).                                                                                      |
| Front                   | Vue                                                                     | **3.5.x** | Escolha do dono (Composition API).                                                                                                                |
| Build front             | Vite                                                                    | 6.x             | Padrão Vue atual.                                                                                                                                |
| Estado                  | Pinia                                                                   | 2.x             | Store oficial Vue.                                                                                                                                |
| Router                  | Vue Router                                                              | 4.x             | Oficial.                                                                                                                                          |
| CSS                     | Tailwind CSS                                                            | **v4**    | Proposta dizia v3. v4 = CSS-first +`@tailwindcss/vite`.                                                                                         |
| Drag & drop             | **VueDraggablePlus**                                              | 0.6.x           | **Correção:** proposta usava `@dnd-kit/core`, que é **React-only**. VueDraggablePlus é SortableJS + Vue 3 + `v-model` tipado. |
| Gráficos               | Chart.js (via`vue-chartjs`)                                           | 4.x             | Métricas Fase 2.                                                                                                                                 |
| Datas                   | date-fns                                                                | 3.x             | Cálculo de semana/estação.                                                                                                                     |
| Email                   | Resend                                                                  | —              | ADR-05.                                                                                                                                           |
| OAuth                   | passport-google-oauth20 + passport-github2                              | 2.x / 0.1.x     | ADR-11 — social login no MVP.                                                                                                                    |
| Imagem                  | **Supabase Storage** (`@supabase/supabase-js`, atrás de porta) | 2.x             | ADR-07 — só o Storage do Supabase.                                                                                                              |
| Container               | Docker + GHCR + Portainer                                               | —              | ADR-10 — deploy em VPS próprio.                                                                                                                 |
| Testes API              | Jest + Supertest                                                        | —              | Padrão que o Nest já gera (não brigar com a ferramenta).                                                                                       |
| Testes front            | Vitest + Vue Test Utils                                                 | —              | Padrão Vite/Vue.                                                                                                                                 |
| E2E (opcional, Fase 2+) | Playwright                                                              | —              | Já disponível no ambiente.                                                                                                                      |

> Verificação pendente que o Neo deve refazer no `install`: patch exato de cada lib no momento do setup (versões evoluem). As **majors** acima estão confirmadas.

---

## 5. Estrutura de diretórios (monorepo)

```
aniweek/
├─ apps/
│  ├─ api/                 # NestJS
│  │  ├─ prisma/           # schema.prisma + migrations + seed (temas sazonais)
│  │  └─ src/
│  │     ├─ auth/          # ADR-04/05: register, login, refresh, verify, reset
│  │     ├─ users/         # perfil, avatar, stats, delete
│  │     ├─ animes/        # cache local de Anime (espelho do Jikan)
│  │     ├─ jikan/         # ADR-06: anticorrupção + cache + rate limiter
│  │     ├─ calendars/     # ADR-03: calendário por (season, year) + import-previous
│  │     ├─ entries/       # CalendarEntry: add/remove/reorder/progress/mark-watched
│  │     ├─ museum/        # WatchedAnime (Fase 2)
│  │     ├─ themes/        # Theme CRUD (Fase 2)
│  │     ├─ social/        # follow/share/notifications/comments (Fase 3)
│  │     ├─ common/        # StorageService (porta), guards, interceptors, filtros de erro
│  │     └─ main.ts
│  └─ web/                 # Vue 3 + Vite
│     └─ src/
│        ├─ features/      # auth, calendar, search, profile, museum, themes, social
│        ├─ components/    # AnimeCard, WeekBoard, DayColumn, ProgressBar, SearchBar
│        ├─ stores/        # Pinia: auth, calendar, theme
│        ├─ composables/   # useJikanSearch (debounce), useDragDrop
│        ├─ styles/        # tokens.css (CSS vars — ADR-09), tailwind entry
│        └─ router/
├─ packages/
│  └─ shared/              # enums (Season, Weekday, EntryStatus), Zod schemas, tipos DTO
├─ apps/api/Dockerfile     # multi-stage Nest → Node 22 slim (ADR-10)
├─ apps/web/Dockerfile     # Vite build → nginx estático (ADR-10)
├─ deploy/
│  └─ portainer-stack.yml  # stack compose p/ Portainer: api+web+postgres+redis
├─ old/                    # legado — referência/assets (ADR-08). Não buildado.
├─ docs/
├─ docker-compose.yml      # SÓ postgres + redis para dev local
└─ .github/workflows/
   ├─ ci.yml               # PR: install→lint→typecheck→test
   └─ deploy.yml           # release: build→push ghcr→webhook Portainer
```

---

## 6. Componentes e responsabilidades (destaques)

- **`jikan`** — *só* fala com o Jikan. Faz cache, rate limit, mapeia `AnimeDto`. Não conhece calendário. Ao referenciar um anime, faz **upsert** em `Anime` (cache local) e devolve `animeId`.
- **`animes`** — dona da tabela `Anime` (espelho local). Serve dados de anime sem tocar no Jikan quando já em cache. NÃO gerencia entradas de calendário.
- **`calendars`** — dona de `Calendar`. Cria/lista por estação, detecta estação atual (date-fns), executa `import-previous`. NÃO sabe posição de card (delega a `entries`).
- **`entries`** — dona de `CalendarEntry`. Add/remove/reorder (drag), progresso de episódio, mark-watched (dispara criação em `museum`). É o coração do drag-and-drop.
- **`common/StorageService`** — porta de upload de imagem (ADR-07).

---

## 7. Modelo de dados (ILUSTRATIVO — Prisma)

> Núcleo do produto. Resolve o gap "como a branch de estação funciona" (ADR-03).

```prisma
// ILUSTRATIVO — referência para o Neo Agent

enum Season   { WINTER SPRING SUMMER FALL }
enum Weekday  { MON TUE WED THU FRI SAT SUN BACKLOG }   // BACKLOG = a "extra" do legado
enum EntryStatus { PLANNED WATCHING PAUSED COMPLETED DROPPED }

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String   @unique
  passwordHash  String?                 // OPCIONAL: conta pode ser só-OAuth (ADR-11)
  avatarUrl     String?
  bio           String?
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())

  calendars     Calendar[]
  watched       WatchedAnime[]
  themes        Theme[]        // Fase 2
  refreshTokens RefreshToken[]
  oauthAccounts OAuthAccount[]          // ADR-11
}

// Vínculo de login social (ADR-11). Um User pode ter Google e/ou GitHub.
model OAuthAccount {
  id                String @id @default(cuid())
  userId            String
  provider          String            // "google" | "github"
  providerAccountId String            // id do usuário no provider
  user              User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model RefreshToken {              // ADR-04: rotação/revogação de refresh
  id        String   @id @default(cuid())
  userId    String
  tokenHash String                  // hash do token, nunca o token cru
  expiresAt DateTime
  revokedAt DateTime?
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Espelho local do Jikan (ADR-06). Uma linha por anime, reusada por N entradas/usuários.
model Anime {
  id         String   @id @default(cuid())
  malId      Int      @unique        // id do MyAnimeList
  title      String
  imageUrl   String?
  synopsis   String?
  episodes   Int?                    // total conhecido (pode ser null p/ em exibição)
  genres     Json?                   // string[] em JSONB
  malUrl     String?
  cachedAt   DateTime @default(now())

  entries    CalendarEntry[]
  watched    WatchedAnime[]
}

// "Branch de estação" = 1 calendário por (user, season, year). ADR-03.
model Calendar {
  id        String   @id @default(cuid())
  userId    String
  season    Season
  year      Int
  themeId   String?                  // Fase 2 (tema por estação — ADR-09)
  createdAt DateTime @default(now())

  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  entries   CalendarEntry[]

  @@unique([userId, season, year])   // 1 calendário por temporada por usuário
}

// Card arrastável. Progresso vive AQUI (por entrada), por isso a cópia entre
// estações preserva/reseta progresso trivialmente.
model CalendarEntry {
  id             String      @id @default(cuid())
  calendarId     String
  animeId        String
  weekday        Weekday                       // dia OU BACKLOG
  position       Int                           // ordem dentro do dia (drag)
  currentEpisode Int         @default(0)
  totalEpisodes  Int?                          // snapshot no momento da adição
  status         EntryStatus @default(PLANNED)
  createdAt      DateTime    @default(now())

  calendar Calendar @relation(fields: [calendarId], references: [id], onDelete: Cascade)
  anime    Anime    @relation(fields: [animeId], references: [id])

  @@unique([calendarId, animeId])               // sem anime duplicado no mesmo calendário
  @@index([calendarId, weekday, position])       // leitura ordenada do board
}

// Museu — registro PERMANENTE, independente do ciclo de vida do calendário. Fase 2.
model WatchedAnime {
  id          String   @id @default(cuid())
  userId      String
  animeId     String
  rating      Int?                    // 1..10
  comment     String?
  completedAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  anime Anime @relation(fields: [animeId], references: [id])

  @@unique([userId, animeId])
}

model Theme {                         // Fase 2 (ADR-09)
  id        String  @id @default(cuid())
  userId    String
  name      String
  colors    Json                      // { primary, secondary, bg, ... }
  bgImageUrl String?
  season    Season?                   // tema atrelado a uma estação (opcional)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Fase 3: Follow, CalendarShare, Notification, Comment, Reaction — modelados na Fase 3.
```

**Semântica de "trazer animes adiante" (`import-previous`):**

1. Descobrir a estação anterior a `(season, year)` do calendário alvo (ordem WINTER→SPRING→SUMMER→FALL; ao voltar de WINTER, ano-1).
2. Ler `CalendarEntry` do calendário anterior — por padrão só `status != COMPLETED` (animes ainda em andamento — o caso de "continuação").
3. Para cada selecionada, criar nova `CalendarEntry` no alvo: mesmo `animeId`, `weekday`, `position`; `currentEpisode` preservado (default) ou zerado (opção "resetar progresso"); `status` → `WATCHING`.
4. Idempotência garantida por `@@unique([calendarId, animeId])` (não duplica se já importado).

---

## 8. Superfície de API (contratos — MVP)

```
# Auth (ADR-04/05)
POST   /auth/register            {email, username, password} -> {user, accessToken} (+ set refresh cookie)
POST   /auth/login               {email, password}          -> {user, accessToken} (+ cookie)
POST   /auth/refresh             (cookie)                    -> {accessToken}
POST   /auth/logout              (cookie)                    -> 204 (revoga refresh)
POST   /auth/verify-email        {token}                     -> 204
POST   /auth/forgot-password     {email}                     -> 204
POST   /auth/reset-password      {token, password}           -> 204 (bloqueia conta só-OAuth)
GET    /auth/oauth/google                                    -> 302 redirect Google (ADR-11)
GET    /auth/oauth/google/callback                           -> upsert user + set cookie + redirect front
GET    /auth/oauth/github                                    -> 302 redirect GitHub
GET    /auth/oauth/github/callback                           -> upsert user + set cookie + redirect front

# Users
GET    /users/me                                             -> perfil + stats básicas
PATCH  /users/me                 {username?, bio?}
POST   /users/me/avatar          multipart                   -> {avatarUrl}
DELETE /users/me

# Animes / Jikan (ADR-06)
GET    /animes/search?query=&page=                           -> AnimeDto[] (cache 1h)
GET    /animes/:malId                                        -> AnimeDto (cache 24h; faz upsert em Anime)

# Calendars (ADR-03)
POST   /calendars                {season, year}              -> Calendar (409 se já existe)
GET    /calendars                                            -> Calendar[] (todas as estações do user)
GET    /calendars/current                                   -> estação atual (detectada) ou 404
GET    /calendars/:id                                        -> Calendar + entries agrupadas por weekday
POST   /calendars/:id/import-previous  {entryIds?[], resetProgress?:bool} -> CalendarEntry[]

# Entries (coração do board)
POST   /calendars/:id/entries    {malId, weekday}            -> CalendarEntry (upsert Anime via Jikan)
DELETE /entries/:id
PATCH  /entries/:id/move         {weekday, position}         -> reordena (drag&drop)
PATCH  /entries/:id/progress     {currentEpisode}            -> valida <= totalEpisodes
PATCH  /entries/:id/status       {status}
POST   /entries/:id/mark-watched {rating?, comment?}         -> cria WatchedAnime (Fase 2)
```

Erros padronizados via `HttpExceptionFilter` global: `{ statusCode, message, code }`. Swagger em `/docs`.

---

## 9. Cross-cutting

- **AuthN/Z:** `JwtAuthGuard` global (opt-out por `@Public()`). Guard de ownership em recursos por `userId`.
- **Validação:** `ZodValidationPipe` usando schemas de `packages/shared` (mesmo schema valida no front).
- **Cache/limiter:** Redis. Jikan atrás de fila (token bucket). Cache keys versionadas.
- **Erros:** filtro global + logging estruturado (pino). Sem vazar stack em prod.
- **Config:** `@nestjs/config` + validação de env com Zod no boot (falha rápido se faltar var).
- **CORS:** origem do front + `credentials: true` (cookie de refresh).
- **i18n:** UI em pt-BR (preferência do dono); mensagens de erro em pt-BR.
- **Observabilidade:** healthcheck `/health`; Sentry só na Fase 3 (proposta) — YAGNI antes disso.

---

## 10. Segurança (marca revisão pelo Lawliet Agent)

- **Lawliet obrigatório antes de fechar a Fase 1** no módulo `auth` (refresh rotation, reset de senha, cookies, **OAuth: state/PKCE, open-redirect no callback, account-linking por email** — ADR-11) e no `jikan/animes` (SSRF/entrada externa).
- bcrypt salt 12 (proposta dizia 10 — subir levemente). JWT access 15min, refresh 7d rotacionado + revogável (tabela `RefreshToken`, guarda **hash**).
- Rate limiting nas rotas de auth (anti brute-force) via `@nestjs/throttler`.
- Upload de avatar: validar MIME real + tamanho + reprocessar imagem (não confiar em extensão).
- Compartilhamento (Fase 3): tokens de share opacos, escopo view-only, revogáveis.

---

## 11. Escalabilidade / Performance

- Board lido por índice `(calendarId, weekday, position)`. Reorder = update de `position` das entradas afetadas em transação.
- Cache Jikan absorve o custo externo. Sem N+1: `include` controlado no Prisma.
- Paginação por cursor na busca e no museu. Nada de projetar sharding/microserviços (YAGNI — RNF-01).

---

## 12. Dependências externas e falhas

- **Jikan:** instável/rate-limited → cache + backoff + degradação graciosa (servir do cache local `Anime` se o Jikan cair).
- **Cloudinary/Resend:** falha de upload/email não deve derrubar o fluxo principal (email de verificação é assíncrono/retryable).

---

## 13. Deploy (decidido — ADR-10)

- **Dev:** `docker-compose up` sobe **só** `postgres` + `redis`; `api` e `web` rodam via `bun dev`.
- **Build de imagem:** `apps/api/Dockerfile` (multi-stage Nest → Node 22 slim) e `apps/web/Dockerfile` (Vite build → nginx estático).
- **CI (`ci.yml`):** em PR → `install → lint → typecheck → test`.
- **CD (`deploy.yml`):** em push na branch de release → build das 2 imagens → `docker push` para **ghcr.io/wallacemt/aniweek-api** e **aniweek-web** (tags `latest` + `${sha}`) → `curl` no **webhook do Portainer** para redeploy da stack.
- **VPS/Portainer:** stack `deploy/portainer-stack.yml` (compose v3: `api`, `web`, `postgres`, `redis`, volumes, rede). Secrets (DB, JWT, OAuth, Supabase, Resend) como env vars/secrets do Portainer — nunca versionados.
- **Registry:** GHCR default (auth via `GITHUB_TOKEN` no Actions). Trocável — ver §17.

---

## 14. Plano de implementação → Milestones (para o Neo Agent)

Mapa das fases da proposta para milestones de GitHub (granularidade solo). Cada milestone vira issues ricas.

> Ordenação por **dependência/entrega vertical** (M0→M5 primeiro). Sem datas/estimativas de semana — ritmo próprio do dono.

**FASE 1 — MVP**

- **M0 · Fundação** — scaffold inicial dos apps via CLI oficial + padrão de pastas (M0.0), monorepo Bun, `apps/api` (Nest 11), `apps/web` (Vue 3 + Vite + Tailwind v4), `packages/shared`, docker-compose dev (pg+redis), Prisma init + seed dos 4 temas sazonais (ADR-08/09). **Infra de deploy (ADR-10):** Dockerfiles api+web, `deploy/portainer-stack.yml`, `ci.yml` + `deploy.yml` (build→push ghcr→webhook Portainer).
- **M1 · Auth** — register/login/refresh/logout, cookie httpOnly, throttler, verify-email + reset (Resend), **OAuth Google+GitHub (ADR-11)** com `OAuthAccount` e account-linking. Front: telas de login/registro + botões social + Pinia auth + interceptor.
- **M2 · Perfil** — GET/PATCH/DELETE me, avatar via StorageService, stats básicas.
- **M3 · Integração Jikan** — JikanModule (cache+limiter+anticorrupção), `Anime` cache local, busca com debounce no front.
- **M4 · Calendário Semanal** — Calendar por (season,year), detecção de estação, board 7 dias + backlog, add/remove entry.
- **M5 · Drag-and-Drop & Progresso** — VueDraggablePlus, move/reorder persistido, progresso de episódio.

**FASE 2 — Personalização & Estações**

- **M6 · Estações & Import** — navegação entre estações, `import-previous` (continuação de anime).
- **M7 · Temas** — Theme CRUD, editor de cores + background, aplicar por estação (liga na base CSS-vars do MVP).
- **M8 · Métricas & Museu** — mark-watched, WatchedAnime, galeria/timeline, estatísticas + gráficos.

**FASE 3 — Social**

- **M9 · Compartilhamento** — share view-only + permissões + revogação.
- **M10 · Social & Notificações** — follow, SSE, notificações, comentários/reações, descoberta.

---

## 15. Critérios de aceitação (base para o Agent Smith) — destaques

- **AC-01** Refresh token NÃO acessível via JS (cookie httpOnly) — verificável no browser.
- **AC-02** Browser nunca faz request direto ao Jikan (só à API própria).
- **AC-03** `UNIQUE(userId, season, year)` impede 2º calendário na mesma temporada (409).
- **AC-04** `import-previous` preserva `currentEpisode` por default e é idempotente.
- **AC-05** Reorder de drag-and-drop persiste `weekday`+`position` e sobrevive a reload.
- **AC-06** Progresso rejeita `currentEpisode > totalEpisodes`.
- **AC-07** Busca serve do cache Redis em hit (sem nova chamada Jikan).
- **AC-08** Deletar conta faz cascade (calendars/entries/watched/tokens).

## 16. Fora de escopo (MVP)

- App nativo (mobile/desktop). Recomendação de animes por ML. Sentry/LogRocket antes da Fase 3. Auth/DB do Supabase (usamos só o Storage). *(OAuth saiu do "fora de escopo" — agora está no MVP, ADR-11.)*

## 17. Decisões resolvidas (confirmadas pelo dono — 2026-07-06)

1. **Hosting** — ✅ **VPS próprio + Portainer**, deploy por imagem Docker via CI/CD (build→push GHCR→webhook Portainer). ADR-10.
2. **Storage de imagem** — ✅ **Supabase Storage** atrás da porta `StorageService`. ADR-07.
3. **Estratégia de fase** — ✅ **sequencial** (Fase 1→2→3), com base de tema (CSS-vars) já no MVP. ADR-09.
4. **OAuth no MVP** — ✅ **SIM**, Google + GitHub no M1 (além de email/senha). ADR-11.
5. **Timeline** — ✅ **sem prazo fixo**; ordenação por dependência/entrega vertical (M0–M5 primeiro), sem datas.

**Ponto ainda flagged (não bloqueia):** registry de container — GHCR como default; trocável se o dono preferir outro. | **Versões patch:** o Neo revalida no `install`.

---

## Handoff

- Artefato gerado:   `docs/blueprint.md`
- Status:            **Aprovado** — 5 decisões resolvidas (§17). Milestones+issues criados no GitHub.
- Próximo agente:    Neo Agent (implementação) — começar por **M0 · Fundação**
- Ação requerida:    Implementar M0 (fundação + infra de deploy ADR-10). `auth` (incl. OAuth) e
  `jikan` passam pelo **Lawliet Agent** antes de fechar a Fase 1.
- Notas:             Correções/decisões relevantes vs. `proposta.md`:
  (a) `@dnd-kit`→VueDraggablePlus, (b) localStorage→cookie httpOnly,
  (c) versões Nest11/Prisma7/Tailwind4, (d) modelo de branch de estação (ADR-03),
  (e) deploy VPS+Portainer+GHCR (ADR-10), (f) OAuth Google+GitHub no MVP (ADR-11),
  (g) Supabase Storage atrás da porta (ADR-07).

```

```
