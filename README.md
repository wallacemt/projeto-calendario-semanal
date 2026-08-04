# 🍥 AnimeWeek

![status](https://img.shields.io/badge/status-em%20constru%C3%A7%C3%A3o-yellow?style=for-the-badge)

<p align="center">
  <img src="https://em-content.zobj.net/source/microsoft-teams/363/construction_1f6a7.png" alt="Em construção" width="120" />
</p>

<p align="center"><b>🚧 Projeto em construção — ainda não há versão utilizável. 🚧</b></p>

---

## O que é

O **AnimeWeek** é uma plataforma para organizar os animes que você assiste durante a semana: um calendário semanal onde cada anime é encaixado no dia certo, com progresso de episódios, temporadas separadas por estação do ano e total liberdade para personalizar a cara do app.

## Funcionalidades planejadas

- 🔍 **Busca de animes** integrada à Jikan API (MyAnimeList) — título, imagem, sinopse e episódios corretos.
- 🗓️ **Calendário semanal** com os 7 dias, drag-and-drop para reorganizar o que vai assistir.
- 📈 **Progresso de episódios** por anime, com atualização em tempo real.
- 🍂 **Estações do ano** — cada troca de estação gera um novo calendário, podendo trazer para a nova temporada os animes que ainda estão em andamento.
- 🎨 **Temas personalizáveis** — cores, imagem de fundo e layout do calendário, com temas próprios por estação.
- 🏆 **Perfil e métricas** — total de animes/episódios assistidos, gêneros mais vistos.
- 🖼️ **Museu de animes assistidos** — uma vitrine/timeline dos animes já completados, como um registro de memória.
- 🔗 **Compartilhamento** do calendário com outros usuários.
- 🔐 **Autenticação** por e-mail/senha ou OAuth (Google/GitHub).

Detalhes técnicos, decisões de arquitetura e o roadmap completo estão em [`docs/blueprint.md`](docs/blueprint.md). O progresso é acompanhado nas [milestones e issues do repositório](https://github.com/wallacemt/aniweek/milestones).

## Stack

- **Frontend:** Vue 3 + Vite + TypeScript + Pinia + Tailwind CSS
- **Backend:** NestJS + PostgreSQL + Prisma
- **APIs externas:** Jikan API (MyAnimeList)
- **Cache:** Redis
- **Gerenciador de pacotes:** Bun (monorepo com workspaces)

