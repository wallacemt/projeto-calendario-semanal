import { Season } from '@aniweek/shared'

// Só usado pelo hero das telas de auth por enquanto — se calendar/museum
// precisarem do mesmo rótulo depois, promove pra um lugar compartilhado.
export const seasonMeta: Record<Season, { emoji: string; label: string; range: string }> = {
  [Season.WINTER]: { emoji: '❄️', label: 'Winter', range: 'Jan–Mar' },
  [Season.SPRING]: { emoji: '🌸', label: 'Spring', range: 'Abr–Jun' },
  [Season.SUMMER]: { emoji: '☀️', label: 'Summer', range: 'Jul–Set' },
  [Season.FALL]: { emoji: '🍂', label: 'Fall', range: 'Out–Dez' },
}
