import { z } from "zod";
import { Season, Weekday, EntryStatus } from "./enums.js";

export const seasonSchema = z.enum(Season);
export const weekdaySchema = z.enum(Weekday);
export const entryStatusSchema = z.enum(EntryStatus);
