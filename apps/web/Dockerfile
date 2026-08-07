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

# VITE_API_URL precisa existir no ambiente de BUILD: o Vite substitui
# import.meta.env.VITE_* por uma constante estática no bundle (esbuild
# define), não é lido em runtime pelo nginx que serve os arquivos depois.
# Setar essa var no container do nginx (ex.: docker run -e) não faz nada.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# VITE_ROBOTS_CONTENT também é substituição de build (vite faz %VITE_X%
# -> valor no index.html na hora do build, não em runtime). Só esse
# Dockerfile builda pra produção (deploy.yml só roda em push pra
# release/**), então o valor de produção é sempre este — não é segredo,
# não precisa vir de GitHub secret nem de build-arg no workflow.
ARG VITE_ROBOTS_CONTENT="index, follow"
ENV VITE_ROBOTS_CONTENT=$VITE_ROBOTS_CONTENT

# type-check é gate de CI (M0.5), não do build de imagem — vite build sozinho
# já faz strip de tipos via esbuild.
RUN cd apps/web && bunx vite build

FROM nginx:alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
