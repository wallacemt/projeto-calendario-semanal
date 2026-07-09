# syntax=docker/dockerfile:1
# Build context: raiz do monorepo (necessário para resolver o workspace Bun).
#   docker build -f apps/web/Dockerfile .

FROM oven/bun:1-slim AS build
WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile --ignore-scripts

COPY packages/shared packages/shared
COPY apps/web apps/web
RUN bun run --filter @aniweek/shared build
# type-check é gate de CI (M0.5), não do build de imagem — vite build sozinho
# já faz strip de tipos via esbuild.
RUN cd apps/web && bunx vite build

FROM nginx:alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
