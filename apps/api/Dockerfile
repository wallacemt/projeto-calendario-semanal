# syntax=docker/dockerfile:1
# Build context: raiz do monorepo (necessário para resolver o workspace Bun).
#   docker build -f apps/api/Dockerfile .

FROM oven/bun:1-slim AS deps
WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile --ignore-scripts

FROM deps AS build
WORKDIR /app
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN bun run --filter @aniweek/shared build
RUN cd apps/api && bunx prisma generate && bunx nest build

FROM oven/bun:1-slim AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile --production --ignore-scripts --filter api --filter @aniweek/shared

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules/.bun node_modules/.bun
COPY --from=prod-deps /app/apps/api/node_modules apps/api/node_modules
COPY --from=prod-deps /app/packages/shared/node_modules packages/shared/node_modules
COPY --from=prod-deps /app/packages/shared/package.json packages/shared/package.json
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/package.json apps/api/package.json

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
