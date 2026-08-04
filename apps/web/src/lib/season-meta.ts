import { Season } from '@aniweek/shared'

// Usado pelo hero das telas de auth e pelo calendário (M6 — troca/importa
// estação). Promovido de features/auth/lib pra cá quando um 2º feature
// passou a precisar do mesmo rótulo.
export const seasonMeta: Record<Season, { emoji: string; label: string; range: string }> = {
  [Season.WINTER]: { emoji: '❄️', label: 'Winter', range: 'Jan–Mar' },
  [Season.SPRING]: { emoji: '🌸', label: 'Spring', range: 'Abr–Jun' },
  [Season.SUMMER]: { emoji: '☀️', label: 'Summer', range: 'Jul–Set' },
  [Season.FALL]: { emoji: '🍂', label: 'Fall', range: 'Out–Dez' },
}
