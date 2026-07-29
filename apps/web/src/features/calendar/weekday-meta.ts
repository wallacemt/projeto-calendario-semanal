import { Weekday } from "@aniweek/shared";

// Rótulos usados pelo board (CalendarView), pelo seletor de dia do modal de
// trazer (BringForwardModal) e pelo form de editar card (EditEntryModal) —
// única fonte pra não repetir os 8 dias em 3 lugares.
export const WEEKDAY_META: Record<
  Weekday,
  { short: string; isExtra?: boolean }
> = {
  [Weekday.MON]: { short: "SEG" },
  [Weekday.TUE]: { short: "TER" },
  [Weekday.WED]: { short: "QUA" },
  [Weekday.THU]: { short: "QUI" },
  [Weekday.FRI]: { short: "SEX" },
  [Weekday.SAT]: { short: "SÁB" },
  [Weekday.SUN]: { short: "DOM" },
  [Weekday.BACKLOG]: { short: "🗂 Extra", isExtra: true },
};

export const WEEKDAY_ORDER: Weekday[] = [
  Weekday.SUN,
  Weekday.MON,
  Weekday.TUE,
  Weekday.WED,
  Weekday.THU,
  Weekday.FRI,
  Weekday.SAT,
  Weekday.BACKLOG,
];
