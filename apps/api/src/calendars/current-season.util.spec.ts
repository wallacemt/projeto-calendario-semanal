import { Season } from '@aniweek/shared';
import { getCurrentSeason } from './current-season.util';

describe('getCurrentSeason', () => {
  it.each([
    [0, Season.WINTER], // jan
    [1, Season.WINTER], // fev
    [2, Season.WINTER], // mar
    [3, Season.SPRING], // abr
    [4, Season.SPRING], // mai
    [5, Season.SPRING], // jun
    [6, Season.SUMMER], // jul
    [7, Season.SUMMER], // ago
    [8, Season.SUMMER], // set
    [9, Season.FALL], // out
    [10, Season.FALL], // nov
    [11, Season.FALL], // dez
  ])('classifica o mês %i como %s', (monthIndex, expected) => {
    const reference = new Date(2026, monthIndex, 15);
    expect(getCurrentSeason(reference).season).toBe(expected);
  });

  it('trata 31/mar como WINTER e 01/abr como SPRING (borda entre estações)', () => {
    expect(getCurrentSeason(new Date(2026, 2, 31)).season).toBe(Season.WINTER);
    expect(getCurrentSeason(new Date(2026, 3, 1)).season).toBe(Season.SPRING);
  });

  it('retorna o ano da data de referência', () => {
    expect(getCurrentSeason(new Date(2026, 6, 15)).year).toBe(2026);
  });
});
