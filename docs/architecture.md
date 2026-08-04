# Arquitetura — Convenção de pastas

> Curto, por design. Decisões e trade-offs completos estão nos ADRs de `docs/blueprint.md` §3
> e no exemplo ilustrativo de `docs/blueprint.md` §5. Este documento só fixa a convenção que
> toda feature nova deve seguir.

## Estrutura raiz

```
aniweek/
├── apps/
│   ├── api/        # NestJS — gerado via @nestjs/cli
│   └── web/        # Vue 3 + Vite — gerado via `bun create vite` (template vue-ts)
├── packages/
│   └── shared/     # enums, Zod schemas, tipos DTO compartilhados entre api e web
├── deploy/         # manifests/config de deploy (Docker, CI/CD)
├── docs/           # este diretório
└── old/            # protótipo legado — só referência de UX/assets, não buildado
```

## `apps/api` — 1 módulo por domínio

Cada domínio (`auth`, `users`, `animes`, `jikan`, `calendars`, `entries`, `museum`, `themes`,
`social`, ...) é uma pasta com o padrão nativo do Nest:

```
src/<domínio>/
├── <domínio>.controller.ts
├── <domínio>.service.ts
└── ...                       # dto/, entities/ conforme o CLI do Nest gera
```

- Acesso a dados sempre via `PrismaService` (`common/`), nunca client Prisma direto no controller.
- Integrações externas trocáveis (Jikan, Storage, E-mail) usam um port/adapter fino — só para
  essas 3 integrações (ADR-06/ADR-07 em `blueprint.md`). **Não generalizar esse padrão** para
  módulos internos (YAGNI).

## `apps/web` — organização por feature

```
src/features/<feature>/
├── views/
├── components/
├── store.ts     # Pinia
└── api.ts        # chamadas à api
```

- `src/shared/` só para design system, tokens e componentes genéricos usados por 2+ features.
- Feature que só é usada em um lugar fica dentro da própria feature, não em `shared/`.

## `packages/shared`

Vazio até a M0.1 (só `package.json` + `tsconfig.json`). Conteúdo real (enums, schemas Zod, DTOs)
entra quando o workspace Bun for cabeado — ver M0.1.

## Referência

Estrutura completa ilustrativa (com todos os módulos e arquivos esperados) e as decisões que a
motivaram: `docs/blueprint.md` §5 e ADRs relacionados.
