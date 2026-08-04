# @aniweek/shared

Contratos compartilhados entre `apps/api` e `apps/web`: enums (`Season`, `Weekday`, `EntryStatus`)
e seus schemas Zod correspondentes. Fonte única de verdade — DTOs de cada feature são adicionados
aqui conforme a feature é implementada (não antecipar).

```bash
bun run build       # emite dist/ (ESM + .d.ts)
bun run typecheck
```

Consumido via workspace: `"@aniweek/shared": "workspace:*"`.
