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

// Ordem fixa da indústria (§7 do blueprint) — usada pelo import-previous (M6)
// pra achar de qual estação trazer os animes "em andamento". Ao voltar de
// WINTER, cai pra FALL do ano anterior.
const SEASON_ORDER: readonly Season[] = [
  Season.WINTER,
  Season.SPRING,
  Season.SUMMER,
  Season.FALL,
];

export function getPreviousSeason({
  season,
  year,
}: CurrentSeason): CurrentSeason {
  const index = SEASON_ORDER.indexOf(season);
  if (index === 0) return { season: Season.FALL, year: year - 1 };
  return { season: SEASON_ORDER[index - 1], year };
}
