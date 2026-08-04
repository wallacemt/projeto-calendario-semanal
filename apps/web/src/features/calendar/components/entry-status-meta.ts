import { EntryStatus } from '@aniweek/shared'

export interface StatusMeta {
  label: string
  color: string
  bg: string
  border: string
  bar: string
}

// Cores 1:1 com o design (AnimeWeek Calendario.dc.html). COMPLETED/DROPPED
// não aparecem ainda na M4 (toda entrada nova nasce PLANNED — mudar status é
// M5), mas o enum tem 5 valores e o mapa cobre todos pra não quebrar quando
// a UI de progresso passar a escrever esses status.
export const STATUS_META: Record<EntryStatus, StatusMeta> = {
  [EntryStatus.WATCHING]: {
    label: 'Assistindo',
    color: '#5EEAD4',
    bg: 'rgba(94,234,212,0.12)',
    border: 'rgba(94,234,212,0.3)',
    bar: 'linear-gradient(90deg,#2DD4BF,#5EEAD4)',
  },
  [EntryStatus.PLANNED]: {
    label: 'Planejado',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.3)',
    bar: 'linear-gradient(90deg,#8B5CF6,#A78BFA)',
  },
  [EntryStatus.PAUSED]: {
    label: 'Pausado',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.3)',
    bar: 'linear-gradient(90deg,#F59E0B,#FBBF24)',
  },
  [EntryStatus.COMPLETED]: {
    label: 'Completo',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.12)',
    border: 'rgba(74,222,128,0.3)',
    bar: 'linear-gradient(90deg,#22C55E,#4ADE80)',
  },
  [EntryStatus.DROPPED]: {
    label: 'Abandonado',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.12)',
    border: 'rgba(248,113,113,0.3)',
    bar: 'linear-gradient(90deg,#EF4444,#F87171)',
  },
}
