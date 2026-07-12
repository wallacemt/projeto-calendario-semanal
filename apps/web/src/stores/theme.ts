import { defineStore } from 'pinia'
import { Season } from '@aniweek/shared'
import { calendarApi } from '../features/calendar/api'
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
  },
})
