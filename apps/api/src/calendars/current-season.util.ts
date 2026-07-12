import { getMonth, getYear } from 'date-fns';
import { Season } from '@aniweek/shared';

// Convenção fixa da indústria (ADR-03 do blueprint) — mês do calendário,
// independente de timezone/hemisfério do usuário. Ver season-meta.ts no web.
const SEASON_BY_MONTH: readonly Season[] = [
  Season.WINTER, // jan
  Season.WINTER, // fev
  Season.WINTER, // mar
  Season.SPRING, // abr
  Season.SPRING, // mai
  Season.SPRING, // jun
  Season.SUMMER, // jul
  Season.SUMMER, // ago
  Season.SUMMER, // set
  Season.FALL, // out
  Season.FALL, // nov
  Season.FALL, // dez
];

export interface CurrentSeason {
  season: Season;
  year: number;
}

export function getCurrentSeason(reference: Date = new Date()): CurrentSeason {
  return {
    season: SEASON_BY_MONTH[getMonth(reference)],
    year: getYear(reference),
  };
}
