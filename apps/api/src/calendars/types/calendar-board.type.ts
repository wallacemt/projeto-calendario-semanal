import { Weekday } from '../../../generated/prisma/enums';
import type {
  Anime,
  Calendar,
  CalendarEntry,
  EntryStatus,
  Season,
} from '../../../generated/prisma/client';

// Board pronto pro front consumir direto (§8 do blueprint: "entries
// agrupadas por weekday") — evita reimplementar o group-by no Vue.
export interface EntryResponse {
  id: string;
  weekday: Weekday;
  position: number;
  currentEpisode: number;
  totalEpisodes: number | null;
  status: EntryStatus;
  anime: {
    id: string;
    malId: number;
    title: string;
    imageUrl: string | null;
  };
}

export interface CalendarBoardResponse {
  id: string;
  season: Season;
  year: number;
  createdAt: Date;
  entries: Record<Weekday, EntryResponse[]>;
}

type CalendarWithEntries = Calendar & {
  entries: (CalendarEntry & { anime: Anime })[];
};

export function toCalendarBoard(
  calendar: CalendarWithEntries,
): CalendarBoardResponse {
  const grouped = Object.fromEntries(
    Object.values(Weekday).map((weekday) => [weekday, [] as EntryResponse[]]),
  ) as Record<Weekday, EntryResponse[]>;

  for (const entry of calendar.entries) {
    grouped[entry.weekday].push({
      id: entry.id,
      weekday: entry.weekday,
      position: entry.position,
      currentEpisode: entry.currentEpisode,
      totalEpisodes: entry.totalEpisodes,
      status: entry.status,
      anime: {
        id: entry.anime.id,
        malId: entry.anime.malId,
        title: entry.anime.title,
        imageUrl: entry.anime.imageUrl,
      },
    });
  }
  for (const list of Object.values(grouped)) {
    list.sort((a, b) => a.position - b.position);
  }

  return {
    id: calendar.id,
    season: calendar.season,
    year: calendar.year,
    createdAt: calendar.createdAt,
    entries: grouped,
  };
}
