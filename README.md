# 🍥 AnimeWeek

<p align="center"><b>Acesse em <a href="https://aniweek.wallacedev.com.br">aniweek.wallacedev.com.br</a></b></p>

---

## O que é

O **AnimeWeek** é uma plataforma para organizar os animes que você assiste durante a semana: um calendário semanal onde cada anime é encaixado no dia certo, com progresso de episódios, temporadas separadas por estação do ano e total liberdade para personalizar a cara do app.

## Funcionalidades

- 🔍 **Busca de animes** integrada à Jikan API (MyAnimeList) — título, imagem, sinopse e episódios corretos.
- 🗓️ **Calendário semanal** com os 7 dias, drag-and-drop para reorganizar o que vai assistir.
- 📈 **Progresso de episódios** por anime, com atualização em tempo real.
- 🍂 **Estações do ano** — cada troca de estação gera um novo calendário, podendo trazer para a nova temporada os animes que ainda estão em andamento.
- 🎨 **Temas personalizáveis** — cores, imagem de fundo e layout do calendário, com temas próprios por estação.
- 🏆 **Perfil e métricas** — total de animes/episódios assistidos, gêneros mais vistos.
- 🖼️ **Museu de animes assistidos** — uma vitrine/timeline dos animes já completados, como um registro de memória.
- 🔗 **Compartilhamento** do calendário (view-only) e **social** — seguir usuários, notificações, descoberta.
- 🔐 **Autenticação** por e-mail/senha ou OAuth (Google/GitHub).

Todas as milestones M0–M10 do roadmap estão implementadas. Detalhes técnicos e decisões de arquitetura estão em [`docs/blueprint.md`](docs/blueprint.md).

## Stack

- **Frontend:** Vue 3 + Vite + TypeScript + Pinia + Tailwind CSS
- **Backend:** NestJS + PostgreSQL + Prisma
- **APIs externas:** Jikan API (MyAnimeList)
- **Cache:** Redis
- **Gerenciador de pacotes:** Bun (monorepo com workspaces)
