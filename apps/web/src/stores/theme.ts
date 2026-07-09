import { defineStore } from 'pinia'
import { Season } from '@aniweek/shared'
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
  },
})
