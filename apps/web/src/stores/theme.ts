import { defineStore } from 'pinia'
import { Season } from '@aniweek/shared'
import { calendarApi } from '../features/calendar/api'
import { themeApi, type ThemeDto } from '../features/theme/api'
import spring from '../assets/seasons/spring.jpg'
import summer from '../assets/seasons/summer.jpg'
import fall from '../assets/seasons/fall.jpg'
import winter from '../assets/seasons/winter.webp'

const seasonBackgrounds: Record<Season, string> = {
  [Season.SPRING]: spring,
  [Season.SUMMER]: summer,
  [Season.FALL]: fall,
  [Season.WINTER]: winter,
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    season: Season.SPRING as Season,
    // Tema custom do usuário (M7), ou null no modo "auto" — ver
    // applyActiveTheme abaixo pra como ele se combina com a estação.
    activeTheme: null as ThemeDto | null,
  }),
  actions: {
    // Troca CSS vars em runtime (ADR-09) — sem reload, sem CSS-in-JS.
    setSeason(season: Season) {
      this.season = season
      document.documentElement.dataset.season = season.toLowerCase()
      document.documentElement.style.setProperty(
        '--season-bg-image',
        `url(${seasonBackgrounds[season]})`,
      )
    },

    // Chamado no boot (App.vue): troca o default local (SPRING) pela estação
    // real vinda da API — GET /calendars/current-season (data-only, mesma
    // convenção de mês pra qualquer usuário; não é a estação do hemisfério
    // dele, é a estação da indústria de anime — ver ADR-03).
    async fetchCurrentSeason(): Promise<void> {
      try {
        const { season } = await calendarApi.getCurrentSeason()
        this.setSeason(season)
      } catch {
        // API fora do ar não trava o boot — fica no default local.
      }
    },

    // M7: aplica (ou remove) o override de tema custom por cima da paleta
    // padrão da estação. Sempre reaplica setSeason() primeiro — sem isso, um
    // --season-bg-image de um tema anterior (inline) ficaria "grudado" no
    // <html> mesmo depois do usuário voltar pro modo auto, porque inline
    // style não volta sozinho pra regra de [data-season] (ver
    // ThemeApplier.tsx do projeto de referência: mesmo princípio de
    // setProperty/removeProperty). setSeason() só cobre --season-bg-image —
    // por isso os 4 vars de cor são explicitamente removidos aqui no branch
    // sem tema: removeProperty devolve o controle pra regra de classe
    // [data-season] do tokens.css, setProperty sozinho (sem o remove
    // correspondente) deixava a cor customizada "grudada" pra sempre depois
    // que o usuário voltava pro modo auto.
    applyActiveTheme(theme: ThemeDto | null) {
      this.activeTheme = theme
      this.setSeason(this.season)
      const root = document.documentElement

      if (!theme) {
        root.style.removeProperty('--color-primary')
        root.style.removeProperty('--color-secondary')
        root.style.removeProperty('--season-accent-1')
        root.style.removeProperty('--season-accent-2')
        return
      }

      root.style.setProperty('--color-primary', theme.accent)
      root.style.setProperty('--color-secondary', theme.accent2)
      root.style.setProperty('--season-accent-1', theme.accent)
      root.style.setProperty('--season-accent-2', theme.accent2)
      if (theme.bgImageUrl) {
        root.style.setProperty('--season-bg-image', `url(${theme.bgImageUrl})`)
      }
    },

    // Chamado no boot, só quando autenticado (GET /themes/active exige
    // sessão) — ver App.vue.
    async fetchActiveTheme(): Promise<void> {
      try {
        const theme = await themeApi.getActive()
        this.applyActiveTheme(theme)
      } catch {
        // Mesma postura de fetchCurrentSeason: falha não trava o boot, só
        // fica no default da estação.
      }
    },
  },
})
